"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  Users,
  PhoneCall,
  Phone,
  FileText,
  BarChart3,
  CreditCard,
  Settings,
  Share2,
  GitBranch,
  Shield
} from "lucide-react";
import SidebarNavItem from "@/components/sidebar/SidebarNavItem";
import SidebarEngineCard from "@/components/sidebar/SidebarEngineCard";
import { Separator } from "@/components/ui/separator";

export default function DashboardSidebarNav() {
  const pathname = usePathname();

  const mainNav = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Assistants", href: "/dashboard/assistants", icon: Bot },
    { name: "Connectors & Tools", href: "/dashboard/connectors", icon: Share2 },
    { name: "Workflows & Automation", href: "/dashboard/workflows", icon: GitBranch },
    { name: "Contacts & Sync", href: "/dashboard/contacts", icon: Users },
    { name: "Campaigns", href: "/dashboard/campaigns", icon: PhoneCall },
    { name: "Phone Numbers", href: "/dashboard/phone-numbers", icon: Phone },
    { name: "Call Logs & Audio", href: "/dashboard/calls", icon: FileText },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Plans & Billing", href: "/dashboard/billing", icon: CreditCard },
  ];


  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="px-3 text-[10px] font-mono font-semibold uppercase tracking-wider text-neutral-400 mb-2">
          NAVIGATION
        </p>
        {mainNav.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          return (
            <SidebarNavItem
              key={item.name}
              name={item.name}
              href={item.href}
              icon={item.icon}
              isActive={isActive}
            />
          );
        })}

        <Separator className="my-3 bg-black/5 dark:bg-white/5" />

        <p className="px-3 text-[10px] font-mono font-semibold uppercase tracking-wider text-neutral-400 mb-2">
          ADMINISTRATION
        </p>
        <SidebarNavItem
          name="Integration Admin"
          href="/dashboard/admin/integrations"
          icon={Shield}
          isActive={pathname?.startsWith("/dashboard/admin/integrations")}
        />

        <Separator className="my-3 bg-black/5 dark:bg-white/5" />

        <p className="px-3 text-[10px] font-mono font-semibold uppercase tracking-wider text-neutral-400 mb-2">
          SYSTEM
        </p>
        <SidebarNavItem
          name="API & Webhooks"
          href="/dashboard/settings"
          icon={Settings}
          isActive={pathname === "/dashboard/settings"}
          badge="LIVE"
          badgeVariant="live"
        />
      </div>

      <SidebarEngineCard isCollapsed={false} />
    </div>
  );
}
