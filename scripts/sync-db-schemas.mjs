#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const typesPath = path.join(root, "src/lib/supabase/database.types.ts");
const schemasPath = path.join(root, "src/features/shared/types/db-schemas.ts");

const CORE_TABLES = [
  "users",
  "lesson_bookings",
  "teacher_availability",
  "student_needs",
  "posts",
  "questions",
];

const typesSource = fs.readFileSync(typesPath, "utf8");
const schemasSource = fs.readFileSync(schemasPath, "utf8");

const tableNames = [...typesSource.matchAll(/^\s{6}([a-z_]+):\s*\{\s*\n\s{8}Row:/gm)].map((match) => match[1]);
const schemaExports = [...schemasSource.matchAll(/export const db([A-Za-z]+)Schema/g)].map((match) => {
  const camel = match[1];
  const snake = camel.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
  const tableMap = {
    user: "users",
    lesson_booking: "lesson_bookings",
    student_need: "student_needs",
    post: "posts",
    question: "questions",
  };
  return tableMap[snake] ?? snake;
});

const missingCore = CORE_TABLES.filter((table) => !schemaExports.includes(table));
const coveredCore = CORE_TABLES.filter((table) => schemaExports.includes(table));

console.log(`Tables in database.types.ts: ${tableNames.length}`);
console.log(`Zod mirrors exported: ${schemaExports.length}`);
console.log(`Core covered (${coveredCore.length}/${CORE_TABLES.length}): ${coveredCore.join(", ")}`);

if (missingCore.length > 0) {
  console.error(`FAIL Missing core Zod mirrors for: ${missingCore.join(", ")}`);
  process.exit(1);
}

console.log("PASS db schema sync check");
