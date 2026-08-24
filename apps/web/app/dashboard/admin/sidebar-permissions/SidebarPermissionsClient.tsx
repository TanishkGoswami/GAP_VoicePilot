"use client";

import React, { useState, useEffect } from "react";
import { 
  Shield, 
  Lock, 
  Unlock, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  LayoutDashboard,
  Bot,
  Share2,
  GitBranch,
  Users,
  Megaphone,
  PhoneCall,
  Headphones,
  TrendingUp,
  CreditCard
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  getAdminSidebarPermissionsAction, 
  updateSidebarPermissionsAction
} from "@/app/actions/adminSidebarPermissions";
import { SidebarPermissionsConfig, DEFAULT_SIDEBAR_PERMISSIONS } from "@/lib/sidebarPermissions";

interface SidebarItemDefinition {
  href: string;
  name: string;
  description: string;
  icon: any;
}

const SIDEBAR_ITEMS: SidebarItemDefinition[] = [
  { href: "/dashboard", name: "Overview", description: "Main overview page with aggregate metrics and quick links.", icon: LayoutDashboard },
  { href: "/dashboard/assistants", name: "Assistants", description: "Manage neural voice agents, prompts, and catalogs.", icon: Bot },
  { href: "/dashboard/connectors", name: "Connectors & Tools", description: "Integrations, API actions, and database connector mappings.", icon: Share2 },
  { href: "/dashboard/workflows", name: "Workflows & Automation", description: "Automated trigger pipelines for call logs and CRM events.", icon: GitBranch },
  { href: "/dashboard/contacts", name: "Contacts & Sync", description: "Customer contact uploads, custom lists, and databases.", icon: Users },
  { href: "/dashboard/campaigns", name: "Campaigns", description: "High-volume dialing operations and automatic calling queues.", icon: Megaphone },
  { href: "/dashboard/phone-numbers", name: "Phone Numbers", description: "Rent virtual phone lines and assign them to voice assistants.", icon: PhoneCall },
  { href: "/dashboard/calls", name: "Call Logs & Audio", description: "Review audio recordings, cost metrics, and full call transcripts.", icon: Headphones },
  { href: "/dashboard/analytics", name: "Analytics", description: "Detailed graphical insights on user metrics and latencies.", icon: TrendingUp },
  { href: "/dashboard/billing", name: "Plans & Billing", description: "Plan tier upgrades, wallet recharges, and billing summaries.", icon: CreditCard }
];

export default function SidebarPermissionsClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SidebarPermissionsConfig>(DEFAULT_SIDEBAR_PERMISSIONS);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await getAdminSidebarPermissionsAction();
      setConfig(res);
    } catch (e) {
      console.error("Failed to load sidebar permissions:", e);
      showToast("error", "Unauthorized or failed to fetch permissions configuration");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, message: msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleToggle = (href: string) => {
    setConfig(prev => ({
      ...prev,
      [href]: prev[href] === "admin" ? "user" : "admin"
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateSidebarPermissionsAction(config);
      if (res.success) {
        showToast("success", "Sidebar access control matrix updated successfully!");
      } else {
        showToast("error", res.error || "Failed to update access control matrix");
      }
    } catch (e: any) {
      showToast("error", e.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn pb-12">
      {/* Toast Notification */}
      {toast && (
        <div 
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-[12px] shadow-lg flex items-center gap-3 border ${
            toast.type === "success" 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-black tracking-tight">Sidebar Permissions</h1>
            <Badge className="bg-[#ff4b2f] hover:bg-[#ff4b2f]/90 text-white font-mono text-[9px] px-2 py-0.5 rounded-full font-bold">
              ROLE MATRIX
            </Badge>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Configure access rules for individual navigation tabs. Modules locked as Admin Only are hidden from ordinary users and blocked from direct routing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={loadSettings}
            disabled={loading || saving}
            className="rounded-[10px] text-xs h-10 px-4 flex items-center gap-2 border-neutral-200 text-neutral-700 bg-white hover:bg-neutral-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </Button>

          <Button
            onClick={handleSave}
            disabled={loading || saving}
            className="bg-black hover:bg-neutral-800 text-white rounded-[10px] text-xs h-10 px-5 font-bold flex items-center gap-2 shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving Matrix..." : "Save Settings"}</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <Card className="border border-neutral-200 shadow-xs">
          <CardContent className="p-8 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-neutral-400 animate-spin" />
            <p className="text-xs text-neutral-500 font-medium">Fetching permission profiles...</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-neutral-200 shadow-xs bg-white">
          <CardHeader className="border-b border-neutral-100 pb-4">
            <CardTitle className="text-sm font-bold text-black uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-5 h-5 text-neutral-800" />
              <span>Sidebar Access Matrix</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Manage permission overrides for standard users. Locked sidebar items default to Admin Only.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-neutral-100">
            {SIDEBAR_ITEMS.map(item => {
              const isAdminOnly = config[item.href] === "admin";
              const ItemIcon = item.icon;

              return (
                <div 
                  key={item.href}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 transition-colors ${
                    isAdminOnly ? 'bg-amber-50/20' : 'hover:bg-neutral-50/50'
                  }`}
                >
                  <div className="flex items-start gap-3.5 max-w-xl">
                    <div className={`p-2 rounded-lg border ${
                      isAdminOnly 
                        ? 'bg-amber-50/50 border-amber-200/50 text-amber-600' 
                        : 'bg-neutral-50 border-neutral-200/60 text-neutral-500'
                    }`}>
                      <ItemIcon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-black">{item.name}</span>
                        <span className="text-[10px] font-mono text-neutral-400">({item.href})</span>
                        {isAdminOnly && (
                          <Badge className="bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[9px] font-bold px-1.5 py-0.2 rounded">
                            ADMIN ONLY
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 font-medium">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleToggle(item.href)}
                      className={`relative inline-flex h-9 w-52 items-center justify-between rounded-xl border p-1 text-xs font-semibold select-none transition-all ${
                        isAdminOnly
                          ? "bg-amber-50 border-amber-200 text-amber-900"
                          : "bg-neutral-50 border-neutral-200 text-neutral-700"
                      }`}
                    >
                      <span 
                        className={`flex items-center justify-center gap-1.5 w-1/2 py-1 rounded-[8px] transition-all ${
                          !isAdminOnly 
                            ? "bg-white shadow-xs text-black border border-neutral-200/50" 
                            : "text-neutral-400 hover:text-neutral-600"
                        }`}
                      >
                        <Unlock className="w-3 h-3" />
                        <span>User + Admin</span>
                      </span>
                      <span 
                        className={`flex items-center justify-center gap-1.5 w-1/2 py-1 rounded-[8px] transition-all ${
                          isAdminOnly 
                            ? "bg-amber-600 text-white shadow-sm" 
                            : "text-neutral-400 hover:text-neutral-600"
                        }`}
                      >
                        <Lock className="w-3 h-3" />
                        <span>Admin Only</span>
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
