"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkIsAdminAction } from "./kyc";

import { SidebarPermissionsConfig, DEFAULT_SIDEBAR_PERMISSIONS } from "@/lib/sidebarPermissions";

import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

// Helper to get authenticated client
async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createClient(cookieStore);
}

// Helper to get admin client (bypasses RLS)
function getAdminClient() {
  return createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// 1. PUBLIC/AUTHENTICATED ONLY READ (Used by Sidebar component & server-side Route Guard)
export async function getSidebarPermissionsAction(): Promise<SidebarPermissionsConfig> {
  try {
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return DEFAULT_SIDEBAR_PERMISSIONS;
    }

    const adminSupabase = getAdminClient();
    const { data: row } = await adminSupabase
      .from("plans")
      .select("features")
      .eq("id", "sidebar_permissions")
      .maybeSingle();

    if (row && row.features) {
      return { ...DEFAULT_SIDEBAR_PERMISSIONS, ...row.features };
    }

    return DEFAULT_SIDEBAR_PERMISSIONS;
  } catch (e) {
    console.error("Error fetching sidebar permissions:", e);
    return DEFAULT_SIDEBAR_PERMISSIONS;
  }
}

// 2. ADMIN ONLY READ (Used by Sidebar Permissions management page)
export async function getAdminSidebarPermissionsAction(): Promise<SidebarPermissionsConfig> {
  const isAdmin = await checkIsAdminAction();
  if (!isAdmin) {
    throw new Error("Unauthorized: Only administrators can read permission settings");
  }

  return getSidebarPermissionsAction();
}

// 3. ADMIN ONLY WRITE (Used by Sidebar Permissions management page)
export async function updateSidebarPermissionsAction(config: SidebarPermissionsConfig) {
  const isAdmin = await checkIsAdminAction();
  if (!isAdmin) {
    throw new Error("Unauthorized: Only administrators can update permission settings");
  }

  try {
    const adminSupabase = getAdminClient();
    const { error } = await adminSupabase
      .from("plans")
      .upsert({
        id: "sidebar_permissions",
        name: "Sidebar Permissions Config",
        price_monthly: 0,
        included_credits: 0,
        max_assistants: 0,
        max_concurrent_calls: 0,
        features: config,
        is_active: false,
      }, { onConflict: "id" });

    if (error) {
      throw new Error(error.message);
    }
    return { success: true };
  } catch (e: any) {
    console.error("Error updating sidebar permissions:", e);
    return { success: false, error: e.message || "Failed to update settings" };
  }
}

// 4. Server-side Route Access Verification Helper
export async function verifyRouteAccess(routeHref: string) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const perms = await getSidebarPermissionsAction();
  const perm = perms[routeHref] || "user";

  if (perm === "admin") {
    const isAdmin = await checkIsAdminAction();
    if (!isAdmin) {
      redirect("/dashboard");
    }
  }
}
