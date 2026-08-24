import { getBillingDataAction } from "@/app/actions/billing";
import BillingClient from "./BillingClient";

export const dynamic = "force-dynamic";

import { verifyRouteAccess } from "@/app/actions/adminSidebarPermissions";

export default async function BillingPage() {
  await verifyRouteAccess("/dashboard/billing");
  const initialData = await getBillingDataAction();

  return <BillingClient initialData={initialData} />;
}
