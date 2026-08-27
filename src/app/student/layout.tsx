import React from "react";

import { requireRole } from "@/lib/server/role-guard";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["student"]);
  return <>{children}</>;
}
