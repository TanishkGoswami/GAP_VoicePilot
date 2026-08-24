"use client";

import React, { useState, useEffect } from "react";
import { 
  Share2, 
  CheckCircle2, 
  Shield, 
  Sliders, 
  Check, 
  X, 
  RefreshCw, 
  Mail, 
  MessageSquare, 
  Database, 
  Zap, 
  FileText,
  Save
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  getAgentPermissionsAction, 
  saveAgentPermissionsAction 
} from "@/app/actions/connectors";

interface AgentIntegrationsPermissionsProps {
  assistantId: string;
}

const CONNECTOR_ICONS: Record<string, any> = {
  gmail: Mail,
  slack: MessageSquare,
  salesforce: Database,
  notion: FileText,
  zapier: Zap,
};

export function AgentIntegrationsPermissions({ assistantId }: AgentIntegrationsPermissionsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
  const [definitions, setDefinitions] = useState<any[]>([]);

  // Connector enabled states: Record<workspace_connector_id, boolean>
  const [connectorEnabledMap, setConnectorEnabledMap] = useState<Record<string, boolean>>({});

  // Tool permissions states: Record<`${workspace_connector_id}:${tool_name}`, { enabled: boolean; policy: "automatic" | "confirm" | "disabled" }>
  const [toolPermMap, setToolPermMap] = useState<
    Record<string, { enabled: boolean; policy: "automatic" | "confirm" | "disabled" }>
  >({});

  useEffect(() => {
    loadPermissions();
  }, [assistantId]);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const res = await getAgentPermissionsAction(assistantId);
      if (res.success) {
        setConnectedAccounts(res.connectedAccounts || []);
        setDefinitions(res.definitions || []);

        // Initialize connector enabled map
        const cMap: Record<string, boolean> = {};
        (res.connectedAccounts || []).forEach((acc: any) => {
          const astConn = (res.assistantConnectors || []).find(
            (ac: any) => ac.workspace_connector_id === acc.id
          );
          cMap[acc.id] = astConn ? astConn.enabled : true; // Default enabled
        });
        setConnectorEnabledMap(cMap);

        // Initialize tool permissions map
        const tMap: Record<string, { enabled: boolean; policy: "automatic" | "confirm" | "disabled" }> = {};

        (res.connectedAccounts || []).forEach((acc: any) => {
          const def = (res.definitions || []).find((d: any) => d.slug === acc.connector_definition_id || d.id === acc.connector_definition_id);
          const tools = def?.tools || [];

          tools.forEach((t: any) => {
            const key = `${acc.id}:${t.name}`;
            const existingPerm = (res.toolPermissions || []).find(
              (tp: any) => tp.workspace_connector_id === acc.id && tp.tool_name === t.name
            );

            if (existingPerm) {
              tMap[key] = {
                enabled: existingPerm.enabled,
                policy: existingPerm.execution_policy || "automatic",
              };
            } else {
              // Default policies if no explicit permission set
              const defaultPolicy = t.name.includes("send") ? "confirm" : "automatic";
              tMap[key] = {
                enabled: true,
                policy: defaultPolicy as any,
              };
            }
          });
        });

        setToolPermMap(tMap);
      }
    } catch (e: any) {
      console.error("[AgentIntegrationsPermissions] Load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const toggleConnector = (connectorId: string) => {
    setConnectorEnabledMap((prev) => ({
      ...prev,
      [connectorId]: !prev[connectorId],
    }));
  };

  const toggleToolEnabled = (connectorId: string, toolName: string) => {
    const key = `${connectorId}:${toolName}`;
    setToolPermMap((prev) => {
      const current = prev[key] || { enabled: true, policy: "automatic" };
      return {
        ...prev,
        [key]: { ...current, enabled: !current.enabled },
      };
    });
  };

  const changeToolPolicy = (
    connectorId: string,
    toolName: string,
    policy: "automatic" | "confirm" | "disabled"
  ) => {
    const key = `${connectorId}:${toolName}`;
    setToolPermMap((prev) => {
      const current = prev[key] || { enabled: true, policy: "automatic" };
      return {
        ...prev,
        [key]: { ...current, policy, enabled: policy !== "disabled" },
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const connectorsPayload = Object.entries(connectorEnabledMap).map(([id, enabled]) => ({
        workspace_connector_id: id,
        enabled,
      }));

      const toolPermissionsPayload = Object.entries(toolPermMap).map(([key, val]) => {
        const [workspace_connector_id, tool_name] = key.split(":");
        return {
          workspace_connector_id,
          tool_name,
          enabled: val.enabled,
          execution_policy: val.policy,
        };
      });

      const res = await saveAgentPermissionsAction(assistantId, {
        connectors: connectorsPayload,
        toolPermissions: toolPermissionsPayload,
      });

      if (res.success) {
        showToast("Integration permissions saved successfully!");
      } else {
        alert(`Save failed: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-neutral-500 font-mono text-xs flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>Loading Agent Integration Permissions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-black">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-black text-white px-4 py-2.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-2 border border-white/20 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-hairline pb-4">
        <div>
          <h3 className="text-lg font-bold text-black flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            <span>Connected Integrations & Tool Permissions</span>
          </h3>
          <p className="text-xs text-neutral-600 mt-0.5">
            Configure tool access and execution policies specific to this AI Assistant.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          variant="default"
          size="sm"
          className="bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-bold gap-1.5 px-4 shadow-sm"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving..." : "Save Permissions"}</span>
        </Button>
      </div>

      {/* Integration Cards List */}
      {connectedAccounts.length === 0 ? (
        <div className="border border-dashed border-hairline p-6 rounded-2xl bg-surface-soft/40 text-center space-y-2">
          <p className="text-xs font-bold text-black">No Connected Workspace Integrations</p>
          <p className="text-[11px] text-neutral-500">
            Connect Gmail, Slack, Zapier, or other enterprise tools in the <span className="font-bold text-black">Connectors & Tools</span> page first to grant permissions to this agent.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {connectedAccounts.map((acc) => {
            const def = definitions.find((d) => d.slug === acc.connector_definition_id || d.id === acc.connector_definition_id);
            const Icon = CONNECTOR_ICONS[def?.slug || ""] || Share2;
            const isConnectorEnabled = connectorEnabledMap[acc.id] ?? true;
            const tools = def?.tools || [];

            return (
              <Card key={acc.id} className="border-hairline shadow-xs overflow-hidden bg-white">
                <CardHeader className="bg-surface-soft/40 pb-3 border-b border-hairline">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-hairline flex items-center justify-center text-black shadow-xs">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold text-black flex items-center gap-2">
                          <span>{def?.name || acc.name || "Integration"}</span>
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] py-0">
                            CONNECTED
                          </Badge>
                        </CardTitle>
                        <span className="text-[11px] font-mono text-neutral-500">
                          {acc.connected_account_email || acc.connected_account_name || "Active Account"}
                        </span>
                      </div>
                    </div>

                    {/* Enable / Disable Connector Toggle */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase text-neutral-500">
                        {isConnectorEnabled ? "Enabled for Agent" : "Disabled for Agent"}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleConnector(acc.id)}
                        className={`w-10 h-6 rounded-full p-0.5 transition-all ${
                          isConnectorEnabled ? "bg-black" : "bg-neutral-200"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-xs transition-all ${
                            isConnectorEnabled ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </CardHeader>

                {/* Tools Permissions Section */}
                <CardContent className={`p-4 space-y-3 transition-opacity ${isConnectorEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                  <p className="text-[11px] font-mono font-bold uppercase text-neutral-400 tracking-wider">
                    TOOLS & EXECUTION POLICIES
                  </p>

                  <div className="border border-hairline rounded-xl divide-y divide-hairline bg-white">
                    {tools.map((t: any) => {
                      const key = `${acc.id}:${t.name}`;
                      const perm = toolPermMap[key] || { enabled: true, policy: "automatic" };

                      return (
                        <div key={t.name} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              onClick={() => toggleToolEnabled(acc.id, t.name)}
                              className={`w-5 h-5 mt-0.5 rounded border flex items-center justify-center transition-all ${
                                perm.enabled ? "bg-black border-black text-white" : "border-neutral-300"
                              }`}
                            >
                              {perm.enabled && <Check className="w-3.5 h-3.5" />}
                            </button>

                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-bold text-xs text-black">{t.name}</span>
                                <Badge variant="outline" className="text-[9px] font-mono uppercase bg-surface-soft">
                                  {t.permissionCategory || "action"}
                                </Badge>
                                {t.realtimeSuitability ? (
                                  <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-[9px] font-mono py-0">
                                    USE DURING CALLS (REAL-TIME SYNC)
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-[9px] font-mono py-0 text-neutral-500">
                                    POST-CALL WORKFLOW ONLY
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[11px] text-neutral-600 mt-0.5">{t.description}</p>
                            </div>
                          </div>

                          {/* Execution Policy Dropdown */}
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <span className="text-[10px] font-mono text-neutral-400 uppercase">Execution Policy:</span>
                            <select
                              value={perm.enabled ? perm.policy : "disabled"}
                              onChange={(e) => changeToolPolicy(acc.id, t.name, e.target.value as any)}
                              className="bg-surface-soft border border-hairline rounded-lg px-2.5 py-1 text-xs font-semibold text-black focus:outline-none focus:ring-1 focus:ring-black"
                            >
                              <option value="automatic">Automatic (Auto-Run)</option>
                              <option value="confirm">Require Confirmation</option>
                              <option value="disabled">Disabled</option>
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
