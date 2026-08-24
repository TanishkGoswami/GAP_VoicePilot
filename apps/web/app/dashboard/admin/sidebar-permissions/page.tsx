import React from "react";
import SidebarPermissionsClient from "./SidebarPermissionsClient";

export const metadata = {
  title: "Sidebar Permissions | VoicePilot Admin",
  description: "Centralized controls for dashboard sidebar navigation visibility.",
};

export default function AdminSidebarPermissionsPage() {
  return <SidebarPermissionsClient />;
}
