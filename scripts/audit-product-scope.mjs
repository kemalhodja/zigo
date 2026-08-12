import fs from 'fs';
import path from 'path';

console.log("🔍 Zigo Product Scope Audit Başlıyor...");

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
let hasMatchFeed = false;

// 1. Check if social_post_matches_current_user exists in migrations
if (fs.existsSync(migrationsDir)) {
  const files = fs.readdirSync(migrationsDir);
  for (const file of files) {
    if (file.endsWith('.sql')) {
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      if (content.includes('social_post_matches_current_user')) {
        hasMatchFeed = true;
      }
    }
  }
}

if (!hasMatchFeed) {
  console.error("❌ HATA (Invariant): 'social_post_matches_current_user' RLS fonksiyonu bulunamadı!");
  process.exit(1);
} else {
  console.log("✅ OK: Match-feed invariant (social_post_matches_current_user) bulundu.");
}

// 2. No Student DM Verification
// We scan for files that might imply direct messaging between students
const srcDir = path.join(process.cwd(), 'src');
let dmCodeFound = false;

function scanDirForDMs(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDirForDMs(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      // Look for suspicious patterns
      if (content.includes('createDirectMessage') && !fullPath.includes('teacher') && !fullPath.includes('parent')) {
        console.error(`❌ HATA (Invariant): Öğrenci DM şüphesi bulundu -> ${fullPath}`);
        dmCodeFound = true;
      }
    }
  }
}

scanDirForDMs(srcDir);

if (dmCodeFound) {
  process.exit(1);
} else {
  console.log("✅ OK: No-Student-DM kuralı ihlali bulunamadı.");
}

console.log("🚀 Zigo Product Scope Audit BAŞARILI!");
process.exit(0);
