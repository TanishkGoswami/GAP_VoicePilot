import Link from "next/link";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { Plus, Bot, Mic, Activity, ArrowUpRight, Zap } from "lucide-react";
import AssistantActionMenu from "./AssistantActionMenu";

import { verifyRouteAccess } from "@/app/actions/adminSidebarPermissions";

export default async function AssistantsPage() {
  await verifyRouteAccess("/dashboard/assistants");
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();

  let assistants: any[] = [];

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
      const { data: userAssistants } = await adminClient
        .from("assistants")
        .select("*")
        .in("workspace_id", wIds)
        .is("deleted_at", null)
        .order('created_at', { ascending: false });

      if (userAssistants) {
        assistants = userAssistants;
      }
    }
  }

  const activeCount = assistants.filter(a => a.status === 'active').length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header section with DESIGN.md typography & pill actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-hairline pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="eyebrow text-black/60">// VOICE PILOT ENGINE</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-black">
            AI Assistants
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl">
            Manage your autonomous voice agents, system prompts, LLM models, and telephony settings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/assistants/create" className="btn-pill-primary text-base px-6 py-2.5 shadow-md hover:scale-[1.02] transition-transform">
            <Plus className="w-4 h-4" />
            Create Assistant
          </Link>
        </div>
      </div>

      {/* DESIGN.md Color Block Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Lime Block */}
        <div className="bg-block-lime rounded-[14px] p-6 text-black flex flex-col justify-between h-36 border border-black/5 hover:scale-[1.01] transition-transform">
          <div className="flex items-center justify-between">
            <span className="eyebrow text-black/70">TOTAL AGENTS</span>
            <Bot className="w-5 h-5 text-black/80" />
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight">{assistants.length}</div>
            <p className="text-xs text-black/70 mt-1 font-medium">Configured voice bots</p>
          </div>
        </div>

        {/* Lilac Block */}
        <div className="bg-block-lilac rounded-[14px] p-6 text-black flex flex-col justify-between h-36 border border-black/5 hover:scale-[1.01] transition-transform">
          <div className="flex items-center justify-between">
            <span className="eyebrow text-black/70">ACTIVE AGENTS</span>
            <Activity className="w-5 h-5 text-black/80" />
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight">{activeCount}</div>
            <p className="text-xs text-black/70 mt-1 font-medium">Live in production</p>
          </div>
        </div>

        {/* Mint Block */}
        <div className="bg-block-mint rounded-[14px] p-6 text-black flex flex-col justify-between h-36 border border-black/5 hover:scale-[1.01] transition-transform">
          <div className="flex items-center justify-between">
            <span className="eyebrow text-black/70">VOICE MODELS</span>
            <Mic className="w-5 h-5 text-black/80" />
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight">Cartesia / 11Labs</div>
            <p className="text-xs text-black/70 mt-1 font-medium">Ultra-low latency voices</p>
          </div>
        </div>

        {/* Navy Block */}
        <div className="bg-block-navy rounded-[14px] p-6 text-white flex flex-col justify-between h-36 border border-black/10 hover:scale-[1.01] transition-transform">
          <div className="flex items-center justify-between">
            <span className="eyebrow text-white/70">TURBO SPEED</span>
            <Zap className="w-5 h-5 text-block-lime" />
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight text-block-lime">&lt; 400ms</div>
            <p className="text-xs text-white/70 mt-1 font-medium">End-to-end response time</p>
          </div>
        </div>
      </div>

      {/* Main Table Container in Figma Card style */}
      <div className="bg-white border border-hairline rounded-[14px] shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-soft/40">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-black">Voice Assistants Library</h2>
            <p className="text-xs sm:text-sm text-neutral-500">Configure parameters, test voices, or launch campaigns.</p>
          </div>
          <span className="eyebrow text-neutral-500 bg-white px-3 py-1 rounded-full border border-hairline self-start sm:self-auto text-[10px] sm:text-xs">
            {assistants.length} ASSISTANTS
          </span>
        </div>

        <div className="overflow-x-auto min-h-[280px]">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-hairline bg-surface-soft text-black/70">
                <th className="py-3.5 px-6 eyebrow text-xs">ASSISTANT NAME</th>
                <th className="py-3.5 px-6 eyebrow text-xs">GAP AGENT ID</th>
                <th className="py-3.5 px-6 eyebrow text-xs">VOICE PROVIDER</th>
                <th className="py-3.5 px-6 eyebrow text-xs">STATUS</th>
                <th className="py-3.5 px-6 eyebrow text-xs text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {assistants.map((ast) => {
                const voiceName = ast.config_snapshot?.voice?.name || ast.config_snapshot?.voice || ast.config_snapshot?.voice_provider || 'Cartesia Neural';
                const cleanAgentId = String(ast.provider_resource_id || 'gap_agent_8f92a1').replace(/vomyra/gi, 'gap');
                return (
                  <tr key={ast.id} className="hover:bg-surface-soft/60 transition-colors group">
                    <td className="py-4 px-6 font-semibold text-black">
                      <Link href={`/dashboard/assistants/${ast.id}`} className="hover:underline flex items-center gap-2.5 group-hover:text-black">
                        <div className="w-8 h-8 rounded-full border border-hairline overflow-hidden shadow-sm shrink-0 bg-surface-soft">
                          <video src="/assets/ai-agent-avatar.webm" autoPlay loop muted playsInline className="w-full h-full object-cover" />
                        </div>
                        <span>{ast.name}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-xs font-mono text-neutral-500 font-semibold">
                      {cleanAgentId}
                    </td>
                    <td className="py-4 px-6 text-xs font-medium capitalize text-neutral-800">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-soft border border-hairline font-sans font-semibold">
                        <Mic className="w-3 h-3 text-black" />
                        {voiceName}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        ast.status === 'active' 
                          ? 'bg-block-lime text-black border border-black/10' 
                          : 'bg-surface-soft text-neutral-600 border border-hairline'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${ast.status === 'active' ? 'bg-emerald-600 animate-pulse' : 'bg-neutral-400'}`}></span>
                        {ast.status || 'draft'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <AssistantActionMenu assistant={ast} />
                    </td>
                  </tr>
                );
              })}

              {!assistants?.length && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-500 bg-white">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-block-cream mx-auto flex items-center justify-center">
                        <Bot className="w-6 h-6 text-black" />
                      </div>
                      <p className="font-semibold text-black">No assistants found</p>
                      <p className="text-xs text-neutral-500">Get started by building your first AI voice agent.</p>
                      <Link href="/dashboard/assistants/create" className="btn-pill-primary text-xs inline-flex mt-2">
                        + Create First Assistant
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
