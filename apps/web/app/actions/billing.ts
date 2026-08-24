"use server";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getRazorpayKeyId(): string {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_dummy';
}

function getRazorpayKeySecret(): string {
  return process.env.RAZORPAY_KEY_SECRET || 'dummy_secret';
}

async function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    requireEnv("SUPABASE_SERVICE_ROLE_KEY")
  );
}

async function getWorkspaceId(): Promise<string> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { }
        },
      },
    }
  );

  const adminClient = await getAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: member } = await adminClient
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (member?.workspace_id) return member.workspace_id;
  }

  // Fallback to ANY workspace removed to prevent random assignment

  const { data: newWs } = await adminClient.from('workspaces').insert({ name: `${user?.email?.split('@')[0] || 'Default'}'s Workspace`, owner_id: user?.id || '00000000-0000-0000-0000-000000000000' }).select().single();

  if (newWs?.id && user?.id) {
    try {
      await adminClient.from('workspace_members').insert({
        workspace_id: newWs.id,
        user_id: user.id,
        role: 'owner'
      });
    } catch (e) { }
  }
  return newWs.id;
}

export async function getBillingDataAction() {
  const adminClient = await getAdminClient();
  const workspaceId = await getWorkspaceId();

  // 1. Get Balance
  const { data: balanceData } = await adminClient.rpc('get_workspace_credit_balance', {
    p_workspace_id: workspaceId
  });

  const balance = Number(balanceData || 0);

  // 2. Get Active Subscription & Plan
  const { data: sub } = await adminClient
    .from('workspace_subscriptions')
    .select('*, plans(*)')
    .eq('workspace_id', workspaceId)
    .eq('status', 'active')
    .maybeSingle();

  // 3. Get All Plans
  const { data: allPlans } = await adminClient.from('plans').select('*').neq('id', 'sidebar_permissions').order('price_monthly', { ascending: true });

  // 4. Get Ledger History
  const { data: ledger } = await adminClient
    .from('credit_ledger')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(20);

  return {
    workspaceId,
    balance,
    subscription: sub || null,
    plans: allPlans || [],
    ledger: ledger || [],
    razorpayKeyId: getRazorpayKeyId()
  };
}

/**
 * Create a Razorpay Order (Server Action)
 */
export async function createRazorpayOrderAction(params: { amount: number; planId?: string; type: 'top_up' | 'subscription' }) {
  const { amount, planId, type } = params;
  const workspaceId = await getWorkspaceId();
  const razorpayKeyId = getRazorpayKeyId();
  const razorpayKeySecret = getRazorpayKeySecret();

  const authHeader = 'Basic ' + Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: { workspaceId, planId: planId || 'custom', type }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Razorpay API order error:', errText);
    return { success: false, error: 'Failed to create Razorpay Order' };
  }

  const order = await response.json();

  return {
    success: true,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: razorpayKeyId,
    workspaceId
  };
}

/**
 * Verify Razorpay Payment Signature & Update Supabase DB (Subscriptions + Profiles.current_plan)
 */
export async function verifyRazorpayPaymentAction(params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  planId?: string;
  type: 'top_up' | 'subscription';
  amount?: number;
}) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, type, amount } = params;
  const adminClient = await getAdminClient();
  const workspaceId = await getWorkspaceId();
  const razorpayKeySecret = getRazorpayKeySecret();

  // Verify HMAC SHA256 Signature
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', razorpayKeySecret)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return { success: false, error: 'Payment signature verification failed' };
  }

  if (type === 'subscription' && planId) {
    const { data: targetPlan } = await adminClient.from('plans').select('*').eq('id', planId).maybeSingle();

    // 1. Update workspace_subscriptions
    await adminClient.from('workspace_subscriptions').upsert({
      workspace_id: workspaceId,
      plan_id: planId,
      status: 'active',
      stripe_subscription_id: razorpay_payment_id,
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }, { onConflict: 'workspace_id' });

    // 2. Sync to profiles table for easy Supabase UI viewing
    const { data: ws } = await adminClient.from('workspaces').select('owner_id').eq('id', workspaceId).maybeSingle();
    if (ws?.owner_id) {
      await adminClient.from('profiles').update({ current_plan: planId }).eq('id', ws.owner_id);
    }

    // 3. Grant plan included credits
    const includedCredits = targetPlan?.included_credits || 100;
    await adminClient.from('credit_ledger').insert({
      workspace_id: workspaceId,
      type: 'grant',
      amount: includedCredits,
      description: `Plan Subscription: ${targetPlan?.name || planId} (Razorpay ${razorpay_payment_id})`,
      reference_id: razorpay_payment_id
    });

    revalidatePath('/dashboard/billing');
    return {
      success: true,
      message: `Plan ${targetPlan?.name || planId} activated! ${includedCredits} AI Mins credited.`,
      planId
    };
  }

  // Top Up Wallet
  const rupees = Number(amount || 500);
  const minutesGranted = Math.floor(rupees / 5);

  await adminClient.from('credit_ledger').insert({
    workspace_id: workspaceId,
    type: 'top_up',
    amount: minutesGranted,
    description: `Razorpay Wallet Top-up (₹${rupees} = ${minutesGranted} Mins)`,
    reference_id: razorpay_payment_id
  });

  revalidatePath('/dashboard/billing');
  return {
    success: true,
    message: `Recharged ₹${rupees} (${minutesGranted} AI Mins added)!`,
    minutesGranted
  };
}
