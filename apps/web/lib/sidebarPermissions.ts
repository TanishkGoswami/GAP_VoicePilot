export type SidebarPermissionsConfig = Record<string, "user" | "admin">;

export const DEFAULT_SIDEBAR_PERMISSIONS: SidebarPermissionsConfig = {
  "/dashboard": "user",
  "/dashboard/assistants": "user",
  "/dashboard/connectors": "user",
  "/dashboard/workflows": "user",
  "/dashboard/contacts": "user",
  "/dashboard/campaigns": "user",
  "/dashboard/phone-numbers": "user",
  "/dashboard/calls": "user",
  "/dashboard/analytics": "user",
  "/dashboard/billing": "user",
};
