/* global console, process */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

const family = readFileSync(join(root, "src/app/family/page.tsx"), "utf8");
const profilesRedirect = readFileSync(join(root, "src/app/profiles/page.tsx"), "utf8");
const selectRoute = readFileSync(join(root, "src/app/profiles/select/[id]/route.ts"), "utf8");
const cookieHelper = readFileSync(join(root, "src/lib/server/active-child-profile.ts"), "utf8");

if (profilesRedirect.includes("ProfileSwitchCard") || profilesRedirect.includes("Hangi modda")) {
  failures.push("legacy Netflix mode switcher must not return on /profiles");
}
if (!profilesRedirect.includes("getRoleDashboardHref") || !profilesRedirect.includes("redirect")) {
  failures.push("/profiles must redirect to the role dashboard");
}
if (!family.includes("/profiles/select/")) {
  failures.push("family page must link child cards through /profiles/select/");
}
if (!selectRoute.includes("ACTIVE_CHILD_PROFILE_COOKIE")) {
  failures.push("child select route must set active child cookie");
}
if (!cookieHelper.includes("zigo_active_child_profile")) {
  failures.push("active-child-profile helper missing cookie name");
}

if (failures.length > 0) {
  console.error("FAIL child profile switch audit");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS child profile switch audit");
