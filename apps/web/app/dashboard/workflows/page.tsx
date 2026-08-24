import React from "react";
import WorkflowsClient from "./WorkflowsClient";

export const metadata = {
  title: "Automated Workflows | VoicePilot",
  description: "Configure event-driven workflow rules for AI call events.",
};

import { verifyRouteAccess } from "@/app/actions/adminSidebarPermissions";

export default async function WorkflowsPage() {
  await verifyRouteAccess("/dashboard/workflows");
  return <WorkflowsClient />;
}
