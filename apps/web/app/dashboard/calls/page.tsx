import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import CallsClient, { CallItem } from "./CallsClient";

export const dynamic = "force-dynamic";

import { verifyRouteAccess } from "@/app/actions/adminSidebarPermissions";

export default async function CallLogsPage() {
  await verifyRouteAccess("/dashboard/calls");
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  let assistants: Array<{ id: string; name: string }> = [];
  let callsList: CallItem[] = [];

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
        const { data: dbAssistants } = await adminClient
          .from("assistants")
          .select("id, name, provider_resource_id")
          .in("workspace_id", wIds)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });
        
        if (dbAssistants) {
          assistants = dbAssistants;
        }
      }
    }
  } catch (e) {
    console.warn("Failed to fetch assistants for calls page:", e);
  }

  // Fetch Live Real Call Logs directly from Vomyra API
  try {
    const vomyraApiKey = process.env.VOMYRA_API_KEY || '';
    const vomyraBaseUrl = process.env.VOMYRA_BASE_URL || 'https://api.vomyra.com';

    const res = await fetch(`${vomyraBaseUrl}/v1/calls?limit=100`, {
      headers: { 'x-api-key': vomyraApiKey },
      cache: 'no-store'
    });

    if (res.ok) {
      const data = await res.json();
      const rawCalls = data.data || data.calls || (Array.isArray(data) ? data : []);

      // Filter to only show calls from this user's assistants
      const userAssistantIds = new Set(assistants.map(a => a.id));
      const userProviderIds = new Set(assistants.map((a: any) => a.provider_resource_id).filter(Boolean));
      const userAssistantNames = new Set(assistants.map(a => a.name.trim()));
      
      const filteredCalls = rawCalls.filter((c: any) => {
        const astId = c.assistant?.id || "";
        const astName = c.assistant?.name?.trim() || (c.additional_data?.campaign_name?.trim() || "");
        return userAssistantIds.has(astId) || userProviderIds.has(astId) || userAssistantNames.has(astName);
      });

      callsList = filteredCalls.map((c: any) => {
        let durationStr = "0s";
        let durationSeconds = 0;
        if (c.call_duration) {
          const parts = String(c.call_duration).split(":");
          if (parts.length === 3) {
            const h = parseInt(parts[0] || "0");
            const m = parseInt(parts[1] || "0");
            const s = parseInt(parts[2] || "0");
            durationSeconds = h * 3600 + m * 60 + s;
            durationStr = m > 0 ? `${m}m ${s}s` : `${s}s`;
          } else {
            durationStr = c.call_duration;
          }
        }

        const callerName = c.additional_data?.name || c.additional_data?.customerName || "";
        const customerNumber = c.phone_number || c.customer_number || (c.call_type === "web" ? "In-Browser Web" : "Unknown");
        const assignedNumber = c.assigned_number || (c.call_type === "phone" ? "Unknown Number" : "Web Voice Engine");

        // Format Transcript
        let transcriptArray: Array<{ role: string; content: string; timestamp?: string }> = [];
        let transcriptSummary = "";

        if (Array.isArray(c.transcript)) {
          transcriptArray = c.transcript.map((t: any) => ({
            role: t.role || t.speaker || 'assistant',
            content: t.content || t.message || t.text || '',
            timestamp: t.timestamp ? new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : undefined
          }));
          transcriptSummary = transcriptArray.map(t => `${t.role}: ${t.content}`).join("\n");
        } else if (typeof c.transcript === "string" && c.transcript.trim()) {
          transcriptSummary = c.transcript;
          transcriptArray = [{ role: 'assistant', content: c.transcript }];
        }

        // Summary & Outcome
        const summary = c.whatsapp_summary || c.summary || c.notes || (durationSeconds > 0 ? "Conversation completed successfully." : "Call not answered / missed.");
        const outcome = durationSeconds > 15 ? "POSITIVE" : (durationSeconds > 0 ? "NEUTRAL" : "MISSED");

        // Cost estimation ($0.05 / min or ₹1.5 / min)
        const costMinutes = Math.max(1, Math.ceil(durationSeconds / 60));
        const estimatedCost = `$${(costMinutes * 0.045).toFixed(2)}`;

        return {
          id: c.id,
          assistant: c.assistant?.name || (c.additional_data?.campaign_name ? `Campaign (${c.additional_data.campaign_name})` : "Voice Assistant"),
          assistantId: c.assistant?.id || assistants[0]?.id || "ast_default",
          customerNumber,
          callerName,
          assignedNumber,
          duration: durationStr,
          durationSeconds,
          latency: "280ms",
          status: c.status || (durationSeconds === 0 ? "no-answer" : "completed"),
          direction: c.direction || (c.call_type === "web" ? "Web" : "Outbound"),
          callType: c.call_type || "phone",
          cost: estimatedCost,
          time: new Date(c.created_at || Date.now()).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
          }),
          recordingUrl: c.recording_url || c.recording || c.audio_url || c.call_recording || c.media_url || null,
          summary,
          outcome,
          notes: c.notes || "",
          transcript: transcriptSummary,
          transcriptMessages: transcriptArray
        };
      });
    }
  } catch (err: any) {
    console.error("Failed to fetch live Vomyra call logs:", err.message);
  }

  return (
    <CallsClient
      initialCalls={callsList}
      assistants={assistants.length > 0 ? assistants : [{ id: "ast_default", name: "Voice Assistant" }]}
    />
  );
}
