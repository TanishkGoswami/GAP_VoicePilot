import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { ContactsClient, VoiceContact, AssistantOption } from "./ContactsClient";

export const dynamic = "force-dynamic";

import { verifyRouteAccess } from "@/app/actions/adminSidebarPermissions";

export default async function ContactsPage() {
  await verifyRouteAccess("/dashboard/contacts");
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  let initialContacts: VoiceContact[] = [];
  let assistantOptions: AssistantOption[] = [];

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
        // 1. Fetch Assistants
        const { data: dbAssistants } = await adminClient
          .from("assistants")
          .select(`
            id,
            name,
            phone_numbers (
              phone_number
            )
          `)
          .in("workspace_id", wIds)
          .is("deleted_at", null);

        if (dbAssistants) {
          assistantOptions = dbAssistants.map((a: any) => {
            const numbers = a.phone_numbers || [];
            const phone = numbers.length > 0 ? numbers[0].phone_number : "Default Number";
            return {
              id: a.id,
              name: a.name,
              phone_number: phone,
            };
          });
        }

        // 2. Fetch Synced & Local Contacts
        const { data: dbContacts } = await adminClient
          .from("contacts")
          .select("*")
          .in("workspace_id", wIds)
          .order("created_at", { ascending: false });

        if (dbContacts) {
          initialContacts = dbContacts.map((c: any) => ({
            id: c.id,
            name: c.name || null,
            phone: c.phone,
            metadata: c.metadata || null,
            canonical_contact_id: c.canonical_contact_id || null,
            ecosystem_sync_source: c.ecosystem_sync_source || null,
            ecosystem_sync_status: c.ecosystem_sync_status || "local",
            ecosystem_synced_at: c.ecosystem_synced_at || null,
            created_at: c.created_at,
          }));
        }
      }
    }
  } catch (err) {
    console.error("Failed to fetch contacts page DB data:", err);
  }

  return (
    <ContactsClient
      initialContacts={initialContacts}
      assistants={assistantOptions}
    />
  );
}
