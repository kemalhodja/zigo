import { execSync } from "node:child_process";

process.env.ANALYZE = "true";
execSync("npm run build", { stdio: "inherit", env: process.env });
