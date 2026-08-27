import React from "react";

import { requireRole } from "@/lib/server/role-guard";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["teacher"]);
  return <>{children}</>;
}
