import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { CampaignsClient, CampaignJob, AssistantOption } from "./CampaignsClient";

export const dynamic = "force-dynamic";

import { verifyRouteAccess } from "@/app/actions/adminSidebarPermissions";

export default async function CampaignsPage() {
  await verifyRouteAccess("/dashboard/campaigns");
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  let initialCampaigns: CampaignJob[] = [];
  let assistantOptions: AssistantOption[] = [];

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: members } = await adminClient
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id);

      const wIds = members?.map((m: any) => m.workspace_id) || [];

      if (wIds.length > 0) {
        // 1. Fetch Assistants
        const { data: dbAssistants } = await adminClient
          .from("assistants")
          .select(`
            id,
            name,
            phone_numbers (
              phone_number
            )
          `)
          .in("workspace_id", wIds)
          .is("deleted_at", null);

        if (dbAssistants) {
          assistantOptions = dbAssistants.map((a: any) => {
            const numbers = a.phone_numbers || [];
            const phone = numbers.length > 0 ? numbers[0].phone_number : "No number assigned";
            return {
              id: a.id,
              name: a.name,
              phone_number: phone
            };
          });
        }

        // 2. Fetch Supabase Campaigns
        const { data: dbCampaigns } = await adminClient
          .from("campaigns")
          .select("*, assistants(name)")
          .in("workspace_id", wIds)
          .order("created_at", { ascending: false });

        if (dbCampaigns && dbCampaigns.length > 0) {
          initialCampaigns = dbCampaigns.map((c: any) => ({
            id: c.id,
            name: c.name,
            status: c.status || "paused",
            target_audience: c.target_audience || "Unknown",
            assistant_name: c.assistants?.name || "Unknown Agent",
            total_contacts: c.total_contacts || c.total_phone_numbers || 0,
            completed_contacts: c.completed_contacts || 0,
            failed_contacts: c.failed_contacts || 0,
            success_rate: c.success_rate_percent ? `${c.success_rate_percent}%` : "0%",
            created_at: c.created_at
          }));
        }
      }
    }
  } catch (err) {
    console.warn("Failed to fetch campaigns DB data:", err);
  }

  // 3. Fetch & Reconstruct All Vomyra Bulk Campaign Dispatches from Live Call API
  try {
    const vomyraApiKey = process.env.VOMYRA_API_KEY || '';
    const vomyraBaseUrl = process.env.VOMYRA_BASE_URL || 'https://api.vomyra.com';

    const res = await fetch(`${vomyraBaseUrl}/v1/calls?limit=100`, {
      headers: { 'x-api-key': vomyraApiKey },
      cache: 'no-store'
    });

    if (res.ok) {
      const data = await res.json();
      const allRawCalls = data.data || data.calls || (Array.isArray(data) ? data : []);

      // Filter to only show calls from this user's assistants
      const userAssistantIds = new Set(assistantOptions.map(a => a.id));
      const userAssistantNames = new Set(assistantOptions.map(a => a.name));
      
      const rawCalls = allRawCalls.filter((c: any) => {
        // Exclude web simulator calls and manual quick test calls from campaign reconstruction
        if (c.call_type === "web") return false;
        if (c.additional_data?.source === "GAP_VoicePilot_WebConsole") return false;

        const astId = c.assistant?.id || "";
        const astName = c.assistant?.name || (c.additional_data?.campaign_name || "");
        return userAssistantIds.has(astId) || userAssistantNames.has(astName);
      });

      // Group calls placed within 5-minute batches (campaign dispatches)
      const batches: Record<string, { time: string; assistant: string; count: number; completed: number; id: string }> = {};

      rawCalls.forEach((c: any) => {
        const time = new Date(c.created_at || Date.now());
        const bucket = new Date(Math.floor(time.getTime() / (5 * 60 * 1000)) * (5 * 60 * 1000)).toISOString();
        const ast = c.assistant?.name || (c.additional_data?.campaign_name || 'Outbound Campaign Batch');
        const key = `${bucket}_${ast}`;

        if (!batches[key]) {
          batches[key] = {
            id: `#JOB-${c.id.slice(-6).toUpperCase()}`,
            time: c.created_at,
            assistant: ast,
            count: 0,
            completed: 0
          };
        }

        batches[key].count += 1;
        if (c.status === 'completed' || c.call_duration !== '00:00:00') {
          batches[key].completed += 1;
        }
      });

      // Convert batches with >= 2 calls into campaign jobs (1-off calls belong strictly in Call Logs)
      const vomyraCampaigns: CampaignJob[] = Object.values(batches)
        .filter((b) => b.count >= 2)
        .map((b) => ({
          id: b.id,
          name: `${b.assistant} (${b.count} contacts)`,
          assistant_name: b.assistant,
          total_contacts: b.count,
          status: b.completed > 0 ? "completed" : "in_progress",
          created_at: new Date(b.time).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
          })
        }));

      // Merge avoiding duplicate IDs
      const existingIds = new Set(initialCampaigns.map(c => c.id));
      for (const vc of vomyraCampaigns) {
        if (!existingIds.has(vc.id)) {
          initialCampaigns.push(vc);
        }
      }
    }
  } catch (err: any) {
    console.error("Failed to sync live Vomyra campaign batches:", err.message);
  }

  return (
    <CampaignsClient
      initialCampaigns={initialCampaigns}
      assistants={assistantOptions}
    />
  );
}
