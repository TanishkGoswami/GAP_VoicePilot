import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { PhoneNumbersClient, PhoneNumberRecord, AssistantOption } from "./PhoneNumbersClient";

export const dynamic = "force-dynamic";

import { verifyRouteAccess } from "@/app/actions/adminSidebarPermissions";

export default async function PhoneNumbersPage() {
  await verifyRouteAccess("/dashboard/phone-numbers");
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );


  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let initialMyNumbers: PhoneNumberRecord[] = [];
  let assistantOptions: AssistantOption[] = [];
  let workspaceBalance = 0;

  try {
    // Resolve current user workspace
    const { data: { user } } = await supabase.auth.getUser();
    let workspaceIds: string[] = [];

    if (user) {
      const { data: members } = await adminClient
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id);

      workspaceIds = members?.map((m: any) => m.workspace_id) || [];
    }

    if (workspaceIds.length > 0) {
      // 1. Fetch user's purchased numbers
      const { data: dbMyNumbers } = await adminClient
        .from("phone_numbers")
        .select("*, assistants(id, name)")
        .in("workspace_id", workspaceIds)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (dbMyNumbers && dbMyNumbers.length > 0) {
        initialMyNumbers = dbMyNumbers.map((n: any) => ({
          id: n.id,
          phone_number: n.phone_number,
          provider: n.provider || "vomyra",
          provider_resource_id: n.provider_resource_id,
          assigned_assistant_id: n.assigned_assistant_id,
          assistants: n.assistants ? { id: n.assistants.id, name: n.assistants.name } : null,
          status: n.assigned_assistant_id ? "active" : "unassigned",
          created_at: n.created_at
        }));
      }

      // 2. Fetch workspace balance from credit ledger RPC
      for (const wId of workspaceIds) {
        const { data: balanceData } = await adminClient.rpc("get_workspace_credit_balance", {
          p_workspace_id: wId
        });
        workspaceBalance += Number(balanceData || 0);
      }
    }

    // 3. Fetch current KYC status
    const { getWorkspaceKycStatus } = await import("@/app/actions/kyc");
    const kycRes = await getWorkspaceKycStatus();
    let initialKyc = kycRes.success ? kycRes.kyc : null;

    // 4. Fetch assistants list
    if (workspaceIds.length > 0) {
      const { data: dbAssistants } = await adminClient
        .from("assistants")
        .select("id, name")
        .in("workspace_id", workspaceIds)
        .is("deleted_at", null);

      if (dbAssistants) {
        assistantOptions = dbAssistants.map((a: any) => ({
          id: a.id,
          name: a.name
        }));
      }
    }

    return (
      <PhoneNumbersClient
        initialMyNumbers={initialMyNumbers}
        initialKyc={initialKyc}
        assistants={assistantOptions}
        workspaceBalance={workspaceBalance}
      />
    );
  } catch (e) {
    console.warn("Failed to fetch phone numbers page data:", e);
    return (
      <PhoneNumbersClient
        initialMyNumbers={initialMyNumbers}
        initialKyc={null}
        assistants={assistantOptions}
        workspaceBalance={workspaceBalance}
      />
    );
  }
}
