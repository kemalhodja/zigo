import React from "react";

import { requireRole } from "@/lib/server/role-guard";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["parent"]);
  return <>{children}</>;
}
