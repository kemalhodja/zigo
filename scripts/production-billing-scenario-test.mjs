/* global console, process, fetch, FormData */

/**
 * Production billing & role scenario probe for zigo-kohl.vercel.app
 * Usage: node scripts/production-billing-scenario-test.mjs
 */

const BASE = process.env.ZIGO_PROD_URL?.trim() || "https://zigo-kohl.vercel.app";
const PASSWORD = process.env.ZIGO_E2E_PASSWORD?.trim() || "ZigoTest2026!Secure";
const ADMIN_EMAIL = process.env.ZIGO_E2E_ADMIN_EMAIL?.trim() || "platform.admin@zigo.app";
const ADMIN_PASSWORD = process.env.ZIGO_ADMIN_E2E_PASSWORD?.trim() || process.env.ZIGO_E2E_ADMIN_PASSWORD?.trim();

const results = [];

function record(category, name, ok, detail, weight = 1) {
  results.push({ category, name, ok, detail, weight });
  const icon = ok ? "✅" : "❌";
  console.log(`${icon} [${category}] ${name}${detail ? ` — ${detail}` : ""}`);
}

async function fetchJson(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      ...(options.body && !(options.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
    },
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { response, body };
}

function getCookieHeader(setCookie) {
  if (!setCookie) return "";
  const parts = Array.isArray(setCookie) ? setCookie : [setCookie];
  return parts.map((item) => item.split(";")[0]).join("; ");
}

async function signIn(email, password = PASSWORD) {
  const { response, body } = await fetchJson("/api/auth/sign-in", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const cookies = getCookieHeader(response.headers.getSetCookie?.() ?? response.headers.get("set-cookie"));
  return { ok: response.ok, body, cookies };
}

async function main() {
  console.log(`\nZIGO Production Billing & Role Scenario Test`);
  console.log(`URL: ${BASE}\n`);

  const health = await fetchJson("/api/setup/health");
  record(
    "Altyapı",
    "Health API",
    health.response.ok,
    health.body?.data ? `gates ${health.body.data.readyCount}/${health.body.data.totalCount}` : String(health.response.status),
  );

  const havalePage = await fetch(`${BASE}/billing/havale?planId=student-monthly`);
  record("Havale", "Havale sayfası yükleniyor", havalePage.ok, `HTTP ${havalePage.status}`);

  const billingPlatform = await fetchJson("/api/billing/platform");
  record(
    "Billing",
    "Platform API",
    billingPlatform.response.ok,
    billingPlatform.body?.data?.webCheckoutAllowed === true ? "web checkout allowed" : JSON.stringify(billingPlatform.body?.data ?? billingPlatform.body),
  );

  const studentEmail = `billing-student-${Date.now()}@gmail.com`;
  const signUp = await fetchJson("/api/auth/sign-up", {
    method: "POST",
    body: JSON.stringify({
      email: studentEmail,
      password: PASSWORD,
      fullName: "Billing Test Student",
      role: "student",
    }),
  });
  record("Auth", "Test öğrenci kaydı", signUp.response.ok, studentEmail);

  const signInResult = await signIn(studentEmail);
  record("Auth", "Test öğrenci giriş", signInResult.ok, signInResult.ok ? "session ok" : JSON.stringify(signInResult.body));

  if (signInResult.ok) {
    const bankTransfer = await fetchJson("/api/billing/bank-transfer", {
      method: "POST",
      headers: { Cookie: signInResult.cookies },
      body: JSON.stringify({ planId: "student-monthly" }),
    });
    const request = bankTransfer.body?.data?.request;
    const bank = bankTransfer.body?.data?.bank;
    const banks = bankTransfer.body?.data?.banks ?? [];
    record(
      "Havale",
      "Havale talebi oluşturma",
      bankTransfer.response.ok && Boolean(request?.reference_code),
      request?.reference_code
        ? `${request.reference_code} · ${request.amount_try} TRY`
        : bankTransfer.body?.error ?? "failed",
    );
    record(
      "Havale",
      "Banka bilgileri yapılandırılmış",
      Boolean(bank?.iban && bank?.accountName),
      bank?.accountName ? `${bank.accountName} · IBAN set` : "ZIGO_BANK_* eksik",
    );
    record(
      "Havale",
      "İkinci banka hesabı (Enpara)",
      banks.length >= 2 && Boolean(banks[1]?.iban?.startsWith("TR93")),
      banks.length >= 2 ? `${banks.length} hesap · ${banks[1]?.bankName ?? "slot 2"}` : "ZIGO_BANK_2_* eksik",
    );

    const checkout = await fetchJson("/api/billing/checkout", {
      method: "POST",
      headers: { Cookie: signInResult.cookies },
      body: JSON.stringify({ planId: "student-monthly" }),
    });
    record(
      "Stripe",
      "Checkout beklenen durum (Stripe yok)",
      checkout.response.status === 503,
      checkout.body?.error ?? `HTTP ${checkout.response.status}`,
    );

    const profile = await fetch(`${BASE}/profile`, {
      headers: { Cookie: signInResult.cookies },
    });
    record("Rol UI", "Profil sayfası", profile.ok, `HTTP ${profile.status}`);

    const student = await fetch(`${BASE}/student`, {
      headers: { Cookie: signInResult.cookies },
    });
    record("Rol UI", "Öğrenci paneli", student.ok, `HTTP ${student.status}`);
  }

  const adminSignIn = ADMIN_PASSWORD
    ? await signIn(ADMIN_EMAIL, ADMIN_PASSWORD)
    : { ok: false, body: { error: "ZIGO_ADMIN_E2E_PASSWORD not set" }, cookies: "" };
  record(
    "Admin",
    "Platform admin giriş",
    adminSignIn.ok,
    adminSignIn.ok ? "ok" : JSON.stringify(adminSignIn.body),
  );

  if (adminSignIn.ok) {
    const adminPage = await fetch(`${BASE}/admin`, {
      headers: { Cookie: adminSignIn.cookies },
    });
    const adminHtml = await adminPage.text();
    record("Admin", "Admin paneli yükleniyor", adminPage.ok, `HTTP ${adminPage.status}`);
    record(
      "Admin",
      "Havale onay bölümü UI",
      adminHtml.includes("Havale") || adminHtml.includes("bank-transfer") || adminHtml.includes("bankTransfer"),
      adminHtml.includes("Havale") ? "section found" : "section text not found in HTML",
    );
  }

  const passed = results.filter((item) => item.ok).length;
  const total = results.length;
  const score = Math.round((passed / total) * 100);

  console.log(`\n══════════════════════════════════════`);
  console.log(` SONUÇ: ${passed}/${total} geçti · Skor ${score}/100`);
  console.log(`══════════════════════════════════════\n`);

  const failed = results.filter((item) => !item.ok);
  if (failed.length > 0) {
    console.log("Başarısız maddeler:");
    for (const item of failed) {
      console.log(`  • [${item.category}] ${item.name}: ${item.detail ?? "fail"}`);
    }
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
