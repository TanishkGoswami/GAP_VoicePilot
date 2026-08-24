import React from "react";
import ConnectorsClient from "./ConnectorsClient";

export const metadata = {
  title: "Connectors & Integrations | VoicePilot",
  description: "Manage enterprise tool connectors and AI assistant permissions.",
};

import { verifyRouteAccess } from "@/app/actions/adminSidebarPermissions";

export default async function ConnectorsPage() {
  await verifyRouteAccess("/dashboard/connectors");
  return <ConnectorsClient />;
}
