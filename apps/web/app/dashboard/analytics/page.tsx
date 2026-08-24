import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Headphones,
  Phone,
  PhoneCall,
  Radio,
  Signal,
  TimerReset,
  XCircle,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

type ProviderCall = {
  id?: string;
  created_at?: string;
  status?: string;
  call_duration?: string;
  latency_ms?: number | string;
  customer_number?: string;
  phone_number?: string;
  assistant?: {
    id?: string;
    name?: string;
  };
  additional_data?: {
    campaign_name?: string;
  };
};

function parseDurationSecs(value?: string) {
  if (!value) return 0;

  const parts = String(value)
    .split(":")
    .map((part) => Number.parseInt(part || "0", 10));

  if (parts.some(Number.isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

function formatClock(value?: string) {
  if (!value) return "No timestamp";

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function compactDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

function getAssistantName(call: ProviderCall) {
  return call.assistant?.name || call.additional_data?.campaign_name || "Assistant";
}

function isCompletedCall(call: ProviderCall) {
  const durationSecs = parseDurationSecs(call.call_duration);
  return call.status === "completed" || call.status === "completed-answered" || durationSecs > 5;
}

import { verifyRouteAccess } from "@/app/actions/adminSidebarPermissions";

export default async function AnalyticsPage() {
  await verifyRouteAccess("/dashboard/analytics");
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  let totalCalls = 0;
  let totalDurationSecs = 0;
  let avgLatencyMs = 340;
  let successRateStr = "100%";
  let recentCalls: ProviderCall[] = [];
  const hourlyHistogram = new Array(24).fill(0);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
          .is("deleted_at", null);

        const userAssistantIds = new Set(dbAssistants?.map((a) => a.id) || []);
        const userProviderIds = new Set(
          dbAssistants?.map((a) => a.provider_resource_id).filter(Boolean) || []
        );
        const userAssistantNames = new Set(dbAssistants?.map((a) => a.name.trim()) || []);

        const vomyraApiKey = process.env.VOMYRA_API_KEY || "";
        const vomyraBaseUrl = process.env.VOMYRA_BASE_URL || "https://api.vomyra.com";

        const res = await fetch(`${vomyraBaseUrl}/v1/calls?limit=250`, {
          headers: { "x-api-key": vomyraApiKey },
          cache: "no-store",
        });

        if (res.ok) {
          const data = await res.json();
          const rawCalls: ProviderCall[] = data.data || data.calls || (Array.isArray(data) ? data : []);

          const filteredCalls = rawCalls.filter((call) => {
            const astId = call.assistant?.id || "";
            const astName = call.assistant?.name?.trim() || call.additional_data?.campaign_name?.trim() || "";
            return userAssistantIds.has(astId) || userProviderIds.has(astId) || userAssistantNames.has(astName);
          });

          totalCalls = filteredCalls.length;

          if (filteredCalls.length > 0) {
            let latencySum = 0;
            let completedCount = 0;
            const now = new Date();
            const oneDayMs = 24 * 60 * 60 * 1000;

            filteredCalls.forEach((call) => {
              const durationSecs = parseDurationSecs(call.call_duration);
              totalDurationSecs += durationSecs;
              latencySum += Number(call.latency_ms || 340);

              if (isCompletedCall(call)) completedCount++;

              if (call.created_at) {
                const callDate = new Date(call.created_at);
                const diffMs = now.getTime() - callDate.getTime();

                if (diffMs <= oneDayMs) {
                  const hourIndex = 23 - Math.floor(diffMs / (60 * 60 * 1000));
                  if (hourIndex >= 0 && hourIndex < 24) hourlyHistogram[hourIndex]++;
                }
              }
            });

            avgLatencyMs = Math.round(latencySum / filteredCalls.length);
            successRateStr = `${((completedCount / filteredCalls.length) * 100).toFixed(1)}%`;
            recentCalls = [...filteredCalls]
              .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
              .slice(0, 5);
          }
        }
      }
    }
  } catch (e) {
    console.warn("Failed to load analytics metrics from Vomyra API:", e);
  }

  const totalMinutes = Math.round(totalDurationSecs / 60);
  const avgDurationSecs = totalCalls > 0 ? Math.round(totalDurationSecs / totalCalls) : 0;
  const completedCalls = recentCalls.filter(isCompletedCall).length;
  const attentionCalls = Math.max(recentCalls.length - completedCalls, 0);
  const maxVolume = Math.max(...hourlyHistogram, 1);
  const peakHourIndex = hourlyHistogram.reduce(
    (peakIndex, value, index) => (value > hourlyHistogram[peakIndex] ? index : peakIndex),
    0
  );
  const lastCallTime = recentCalls[0]?.created_at ? formatClock(recentCalls[0].created_at) : "Waiting";
  const activeHours = hourlyHistogram.filter((count) => count > 0).length;
  const visibleRecentCount = Math.min(recentCalls.length, 5);

  return (
    <section className="min-h-[calc(100vh-124px)] animate-fadeIn [letter-spacing:0]">
      <div
        className="hidden"
        dangerouslySetInnerHTML={{
          __html:
            "<!-- impeccable:surface seed=7f02f432 mode=operate thesis='Analytics as a live voice operations signal board, not a generic KPI grid.' -->",
        }}
      />

      <div className="overflow-hidden rounded-[14px] border border-black/10 bg-[#10100f] text-white shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_360px]">
          <div className="relative min-h-[360px] overflow-hidden p-5 sm:p-7 lg:p-8">
            <div className="absolute inset-0 opacity-70 [background:radial-gradient(circle_at_24%_18%,rgba(220,238,177,0.22),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_34%)]" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.38))]" />

            <div className="relative flex h-full min-h-[310px] flex-col justify-between gap-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-2xl">
                  <div className="mb-5 inline-flex items-center gap-2 rounded-[10px] border border-white/15 bg-white/8 px-3 py-2 text-xs font-semibold text-white/80">
                    <Radio className="h-3.5 w-3.5 text-block-lime" />
                    Live voice operations
                  </div>
                  <h1 className="max-w-3xl text-[34px] font-semibold leading-[1.04] text-white [letter-spacing:0] sm:text-[48px] lg:text-[58px]">
                    Analytics that show how the call floor is breathing.
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-white/68 sm:text-base">
                    Monitor completion, latency, voice minutes, and the latest customer interactions from the same workspace-filtered call stream.
                  </p>
                </div>

                <Link
                  href="/dashboard/calls"
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-block-lime px-4 text-sm font-bold text-black transition-all hover:bg-white focus:outline-none focus:ring-2 focus:ring-block-lime focus:ring-offset-2 focus:ring-offset-black"
                >
                  Open call logs
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[12px] bg-white/[0.08] p-4 ring-1 ring-white/10">
                  <div className="flex items-center justify-between text-xs font-semibold text-white/62">
                    <span>Total calls</span>
                    <PhoneCall className="h-4 w-4 text-block-lime" />
                  </div>
                  <p className="mt-3 text-4xl font-semibold text-white [letter-spacing:0]">{totalCalls}</p>
                  <p className="mt-1 text-xs text-white/48">VoicePilot workspace stream</p>
                </div>

                <div className="rounded-[12px] bg-white/[0.08] p-4 ring-1 ring-white/10">
                  <div className="flex items-center justify-between text-xs font-semibold text-white/62">
                    <span>Completion</span>
                    <CheckCircle2 className="h-4 w-4 text-block-lime" />
                  </div>
                  <p className="mt-3 text-4xl font-semibold text-white [letter-spacing:0]">{successRateStr}</p>
                  <p className="mt-1 text-xs text-white/48">Answered or meaningful sessions</p>
                </div>

                <div className="rounded-[12px] bg-white/[0.08] p-4 ring-1 ring-white/10">
                  <div className="flex items-center justify-between text-xs font-semibold text-white/62">
                    <span>Last signal</span>
                    <Signal className="h-4 w-4 text-block-lime" />
                  </div>
                  <p className="mt-3 text-4xl font-semibold text-white [letter-spacing:0]">{lastCallTime}</p>
                  <p className="mt-1 text-xs text-white/48">Newest call in this workspace</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="border-t border-white/10 bg-[#f4ecd6] p-5 text-black lg:border-l lg:border-t-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold [letter-spacing:0]">Signal brief</h2>
                <p className="mt-1 text-xs leading-5 text-black/60">
                  A compact read on the current calling environment.
                </p>
              </div>
              <div className="rounded-[10px] bg-black px-3 py-2 text-xs font-bold text-block-lime">
                Now
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <SignalRow icon={Activity} label="Average latency" value={`${avgLatencyMs} ms`} />
              <SignalRow icon={Clock3} label="Voice minutes" value={`${totalMinutes} min`} />
              <SignalRow icon={TimerReset} label="Average call" value={compactDuration(avgDurationSecs)} />
              <SignalRow icon={Headphones} label="Needs review" value={`${attentionCalls} recent`} />
            </div>
          </aside>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_420px]">
        <section className="flex h-full flex-col overflow-hidden rounded-[14px] bg-white shadow-[0_18px_60px_rgba(0,0,0,0.08)] ring-1 ring-black/8">
          <div className="flex flex-col gap-4 border-b border-hairline bg-[#fbfbfa] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-black [letter-spacing:0]">
                <BarChart3 className="h-5 w-5" />
                24-hour call exposure
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-5 text-neutral-500">
                Hourly call pressure, newest on the right. Dark marks the peak, lime marks the current hour.
              </p>
            </div>
            <div className="inline-flex w-fit items-center rounded-[10px] bg-black px-3 py-2 text-xs font-bold text-block-lime">
              Peak hour: {peakHourIndex === 23 ? "Now" : `${23 - peakHourIndex}h ago`}
            </div>
          </div>

          <div className="flex-1 grid gap-0 lg:grid-cols-[160px_minmax(0,1fr)]">
            <div className="grid grid-cols-3 gap-2 border-b border-hairline p-4 lg:block lg:border-b-0 lg:border-r lg:p-5">
              <ChartStat label="Active hours" value={`${activeHours}/24`} />
              <ChartStat label="Peak load" value={`${maxVolume}`} />
              <ChartStat label="Window" value="24h" />
            </div>

            <div className="flex h-full flex-col p-4 sm:p-5">
              <div className="isolate relative flex-1 min-h-[236px] overflow-hidden rounded-[12px] bg-[#f6f5f4] px-4 pb-4 pt-12">
                <div className="absolute inset-x-4 top-1/4 border-t border-black/[0.06]" />
                <div className="absolute inset-x-4 top-1/2 border-t border-black/[0.06]" />
                <div className="absolute inset-x-4 top-3/4 border-t border-black/[0.06]" />
                <div className="relative flex h-full w-full items-end justify-between gap-1">
              {hourlyHistogram.map((count, index) => {
                const heightPercent = count === 0 ? 4 : Math.max(12, Math.round((count / maxVolume) * 78));
                const isPeak = index === peakHourIndex && count > 0;
                const isCurrentHour = index === 23;

                return (
                  <div key={index} className="group flex h-full min-w-0 flex-1 items-end justify-center">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="relative flex w-full max-w-[24px] justify-center"
                    >
                      <div className="pointer-events-none absolute -top-8 z-10 whitespace-nowrap rounded-[8px] bg-black px-2 py-1 text-[11px] font-bold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                        {count} calls
                      </div>
                      <div
                        className={`h-full w-full rounded-t-[8px] rounded-b-[3px] transition-all duration-200 group-hover:scale-x-110 ${
                          isPeak
                            ? "bg-black shadow-[0_0_0_4px_rgba(0,0,0,0.06)]"
                            : isCurrentHour
                              ? "bg-block-lime"
                              : count > 0
                                ? "bg-neutral-500"
                                : "bg-black/10"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
                </div>
            </div>

              <div className="mt-4 grid grid-cols-3 text-xs font-bold text-neutral-400">
                <span>24h ago</span>
                <span className="text-center">12h ago</span>
                <span className="text-right">Now</span>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[14px] bg-white shadow-[0_18px_60px_rgba(0,0,0,0.08)] ring-1 ring-black/8">
          <div className="flex items-center justify-between gap-4 border-b border-hairline bg-[#fbfbfa] p-5">
            <div>
              <h2 className="text-xl font-bold text-black [letter-spacing:0]">Recent calls</h2>
              <p className="mt-1 text-sm text-neutral-500">Showing the latest {visibleRecentCount || 5} calls only.</p>
            </div>
            <Link
              href="/dashboard/calls"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-[10px] bg-black px-3 text-sm font-bold text-white transition-colors hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-black/20"
            >
              View all
            </Link>
          </div>

          {recentCalls.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-surface-soft text-neutral-400">
                <Phone className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-black [letter-spacing:0]">No calls in view yet</h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-neutral-500">
                Once an assistant places or receives a call, this rail will show the latest outcome and duration.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-hairline">
              {recentCalls.map((call, index) => {
                const isSuccess = isCompletedCall(call);
                const durationSecs = parseDurationSecs(call.call_duration);
                const customer = call.customer_number || call.phone_number || "Unknown number";

                return (
                  <li key={call.id || `${customer}-${index}`} className="p-4 transition-colors hover:bg-[#fbfbfa]">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] ${
                          isSuccess ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" : "bg-rose-50 text-rose-700 ring-1 ring-rose-100"
                        }`}
                      >
                        {isSuccess ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-black">{customer}</p>
                            <p className="mt-1 truncate text-xs font-medium text-neutral-500">{getAssistantName(call)}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-bold text-black">{compactDuration(durationSecs)}</p>
                            <p className="mt-1 text-xs text-neutral-400">{formatClock(call.created_at)}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-soft">
                            <div
                              className={`h-full rounded-full ${isSuccess ? "bg-emerald-500" : "bg-rose-500"}`}
                              style={{ width: `${Math.min(100, Math.max(8, durationSecs ? durationSecs / 3 : 8))}%` }}
                            />
                          </div>
                          <span className={`text-[11px] font-bold ${isSuccess ? "text-emerald-700" : "text-rose-700"}`}>
                            {isSuccess ? "Complete" : "Review"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}

function ChartStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] bg-white p-3 ring-1 ring-black/5 lg:mb-3">
      <p className="text-[11px] font-bold text-neutral-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-black [letter-spacing:0]">{value}</p>
    </div>
  );
}

function SignalRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[12px] bg-white/62 p-3 ring-1 ring-black/5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-black text-block-lime">
          <Icon className="h-4 w-4" />
        </div>
        <span className="truncate text-sm font-semibold text-black/68">{label}</span>
      </div>
      <strong className="shrink-0 text-sm font-bold text-black">{value}</strong>
    </div>
  );
}
