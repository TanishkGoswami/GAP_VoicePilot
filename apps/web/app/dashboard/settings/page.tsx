import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeCheck, KeyRound, Link2, ShieldCheck } from "lucide-react";

const settingsSections = [
  {
    title: "Account",
    description: "Workspace identity, owner profile, and team access controls.",
    status: "Ready",
    icon: BadgeCheck,
  },
  {
    title: "Security",
    description: "Service keys, webhook secrets, and protected admin access.",
    status: "Review",
    icon: ShieldCheck,
  },
  {
    title: "Integrations",
    description: "Database, Payment Gateways, and AI Telephony configuration.",
    status: "Env",
    icon: Link2,
  },
  {
    title: "API Access",
    description: "Production API URL, webhook endpoints, and internal tokens.",
    status: "Locked",
    icon: KeyRound,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      <div className="space-y-1 border-b border-hairline pb-5 sm:pb-6">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-black">Settings</h1>
        <p className="text-neutral-600 text-xs sm:text-sm">
          Manage workspace configuration before going live.
        </p>
      </div>

      <div className="grid gap-3.5 sm:gap-4 grid-cols-1 md:grid-cols-2">
        {settingsSections.map((section) => {
          const Icon = section.icon;

          return (
            <Card key={section.title} className="border-hairline shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div className="space-y-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-soft text-black">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-base font-semibold text-black">{section.title}</CardTitle>
                </div>
                <span className="rounded-full border border-hairline px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-600">
                  {section.status}
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-neutral-600">{section.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
