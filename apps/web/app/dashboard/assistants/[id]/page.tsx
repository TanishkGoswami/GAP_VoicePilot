import { getAdminClient } from "@/lib/workspace";
import { notFound } from "next/navigation";
import { EditAssistantForm } from "../EditAssistantForm";

export const dynamic = "force-dynamic";

interface AssistantPageProps {
  params: Promise<{ id: string }>;
}

export default async function AssistantDetailPage({ params }: AssistantPageProps) {
  const resolvedParams = await params;
  const assistantId = resolvedParams.id;

  const adminClient = await getAdminClient();
  let assistant: any = null;
  let tools: any[] = [];

  // 1. Fetch Assistant from Supabase using Admin Client (checks both UUID and provider_resource_id)
  if (adminClient) {
    try {
      // Check by primary ID
      const { data: dbAssistant } = await adminClient
        .from("assistants")
        .select("*")
        .eq("id", assistantId)
        .is("deleted_at", null)
        .maybeSingle();

      if (dbAssistant) {
        assistant = dbAssistant;
      } else {
        // Check by provider_resource_id if passed
        const { data: altAssistant } = await adminClient
          .from("assistants")
          .select("*")
          .eq("provider_resource_id", assistantId)
          .is("deleted_at", null)
          .maybeSingle();

        if (altAssistant) {
          assistant = altAssistant;
        }
      }
    } catch (err) {
      console.warn("Error fetching assistant from database:", err);
    }
  }

  // 2. Fetch assigned tools & detailed assignments for this assistant
  let detailedAssignments: any[] = [];
  let workspaceConnectors: any[] = [];

  if (assistant && adminClient) {
    try {
      const { data: assignedTools } = await adminClient
        .from("assistant_tools")
        .select("tool_id")
        .eq("assistant_id", assistant.id);

      const { data: assignments } = await adminClient
        .from("assistant_tool_assignments")
        .select("*")
        .eq("assistant_id", assistant.id);

      detailedAssignments = assignments || [];

      // Fetch workspace connectors strictly for this assistant's workspace
      let connQuery = adminClient
        .from("workspace_connectors")
        .select("id, connector_definition_id, connected_account_name, connected_account_email, status, connector_definitions(slug)");
      
      if (assistant.workspace_id) {
        connQuery = connQuery.eq("workspace_id", assistant.workspace_id);
      }
      const { data: connectors } = await connQuery;
      
      workspaceConnectors = connectors || [];

      const assignedIds = new Set<string>();
      if (assignedTools) assignedTools.forEach((t: any) => assignedIds.add(t.tool_id));
      if (assignments) assignments.forEach((a: any) => assignedIds.add(a.tool_name));

      assistant = {
        ...assistant,
        config: assistant.config_snapshot || {},
        assigned_tool_ids: Array.from(assignedIds),
        tool_assignments: detailedAssignments,
        workspace_connectors: workspaceConnectors
      };
    } catch (e) {}
  }

  // 3. Fallback: Check Vomyra API directly if not in Supabase
  if (!assistant) {
    try {
      const vomyraApiKey = process.env.VOMYRA_API_KEY || "";
      const vomyraBaseUrl = process.env.VOMYRA_BASE_URL || "https://api.vomyra.com";
      const res = await fetch(`${vomyraBaseUrl}/v1/assistants/${assistantId}`, {
        headers: { "x-api-key": vomyraApiKey },
        cache: "no-store"
      });

      if (res.ok) {
        const vData = await res.json();
        const raw = vData.data || vData;
        assistant = {
          id: raw.id || assistantId,
          name: raw.name || "AI Assistant",
          status: raw.status || "active",
          provider_resource_id: raw.id || raw.provider_resource_id || assistantId,
          config_snapshot: raw.config || raw,
          assigned_tool_ids: raw.tools || []
        };
      }
    } catch (e) {}
  }

  // 4. Fallback: Check backend Express API
  if (!assistant) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
      const res = await fetch(`${apiUrl}/api/v1/assistants/${assistantId}`, { cache: "no-store" });
      if (res.ok) {
        assistant = await res.json();
      }
    } catch (e) {}
  }

  // If still not found after all fallbacks, return 404
  if (!assistant) {
    return notFound();
  }

  // 5. Fetch Workspace Tools & Filter by Connector Definitions
  const disabledConnectorSlugs = new Set(["salesforce", "hubspot", "make", "n8n", "zapier", "notion", "linear", "mcp"]);

  if (adminClient) {
    try {
      // Sync connector definitions directly from database
      const { data: dbDefs } = await adminClient
        .from("connector_definitions")
        .select("id, slug, name, availability_status, is_visible");

      const dbDefMap = new Map<string, string>();
      if (dbDefs && dbDefs.length > 0) {
        for (const d of dbDefs) {
          if (d.id && d.slug) dbDefMap.set(d.id, d.slug);
          if (d.availability_status !== "enabled" || d.is_visible === false) {
            disabledConnectorSlugs.add(d.slug.toLowerCase());
            if (d.slug === "gmail") {
              disabledConnectorSlugs.add("google_workspace");
              disabledConnectorSlugs.add("google_calendar");
              disabledConnectorSlugs.add("google_sheets");
              disabledConnectorSlugs.add("google_contacts");
              disabledConnectorSlugs.add("google_drive");
              disabledConnectorSlugs.add("google_meet");
            }
          } else {
            disabledConnectorSlugs.delete(d.slug.toLowerCase());
          }
        }
      }

      // Re-hydrate workspaceConnectors with explicit provider_slug
      if (workspaceConnectors.length > 0) {
        workspaceConnectors = workspaceConnectors.map((c: any) => {
          const matchedSlug = dbDefMap.get(c.connector_definition_id) || c.connector_definitions?.slug || c.provider_slug || (c.connected_account_email ? 'gmail' : '');
          return {
            ...c,
            provider_slug: matchedSlug,
            slug: matchedSlug
          };
        });

        if (assistant) {
          assistant.workspace_connectors = workspaceConnectors;
        }
      }

      const { data: dbTools } = await adminClient
        .from("tools")
        .select("*")
        .is("deleted_at", null);

      if (dbTools && dbTools.length > 0) {
        tools = dbTools;
      }
    } catch (e) {}
  }

  // Fetch Connector Registry Tools from backend API
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const wsId = assistant?.workspace_id || "default";
    const connectorRes = await fetch(`${apiUrl}/api/v1/connectors?workspaceId=${wsId}`, { cache: "no-store" });
    if (connectorRes.ok) {
      const cData = await connectorRes.json();
      const definitions = cData.definitions || [];
      const connectedAccounts = cData.connectedAccounts || [];
      const toolIds = new Set(tools.map((x) => x.id));

      if (connectedAccounts && Array.isArray(connectedAccounts)) {
        const mappedAccounts = connectedAccounts.map((acc: any) => ({
          id: acc.id,
          provider_slug: acc.provider,
          slug: acc.provider,
          status: acc.status || "connected",
          connected_account_name: acc.connectedAccountName || acc.connected_account_name,
          connected_account_email: acc.connectedAccountEmail || acc.connected_account_email
        }));

        workspaceConnectors = [...workspaceConnectors, ...mappedAccounts];
        if (assistant) {
          assistant.workspace_connectors = workspaceConnectors;
        }
      }

      for (const def of definitions) {
        if (def.availabilityStatus !== "enabled" || def.isVisible === false) {
          disabledConnectorSlugs.add(def.slug.toLowerCase());
          continue;
        }

        disabledConnectorSlugs.delete(def.slug.toLowerCase());

        if (def.tools && Array.isArray(def.tools)) {
          for (const t of def.tools) {
            const toolId = t.name;
            if (!toolIds.has(toolId)) {
              tools.push({
                id: toolId,
                name: t.name,
                type: def.slug === "gmail" || def.slug === "google_workspace" ? "google_workspace" : "connector",
                description: t.description || `${def.name} Tool`,
                config: {
                  provider: def.slug,
                  permission_category: t.permissionCategory || "read",
                  request_url: `${apiUrl}/api/v1/tools/execute`,
                  request_http_method: "POST"
                }
              });
              toolIds.add(toolId);
            }
          }
        }
      }
    }
  } catch (e) {}

  // Also fetch Vomyra Live Tools
  try {
    const vomyraApiKey = process.env.VOMYRA_API_KEY || "";
    const vomyraBaseUrl = process.env.VOMYRA_BASE_URL || "https://api.vomyra.com";
    const toolRes = await fetch(`${vomyraBaseUrl}/v1/tools`, {
      headers: { "x-api-key": vomyraApiKey },
      cache: "no-store"
    });

    if (toolRes.ok) {
      const tData = await toolRes.json();
      const rawTools = tData.data || tData.tools || (Array.isArray(tData) ? tData : []);
      const mappedVomyraTools = rawTools.map((t: any) => ({
        id: t.id || t._id,
        name: t.name || t.tool_name || "Custom Connector",
        type: t.type || (t.schema ? "api_request" : "knowledgebase"),
        description: t.description || (t.schema ? "VoicePilot API Request Connector" : "VoicePilot Knowledge Base Tool"),
        config: {
          request_url: t.schema?.endpoint || t.endpoint || "",
          request_http_method: t.schema?.method || t.method || "POST"
        }
      }));

      // Combine tools
      const toolIds = new Set(tools.map((x) => x.id));
      for (const mt of mappedVomyraTools) {
        if (!toolIds.has(mt.id)) {
          tools.push(mt);
        }
      }
    }
  } catch (e) {}

  // Strictly filter out any tools belonging to disabled or coming_soon connectors
  tools = tools.filter((t: any) => {
    const provider = String(t.config?.provider || t.name.split(".")[0]).toLowerCase();
    if (disabledConnectorSlugs.has(provider)) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-6xl space-y-6">
      <EditAssistantForm assistant={assistant} workspaceTools={tools} />
    </div>
  );
}
