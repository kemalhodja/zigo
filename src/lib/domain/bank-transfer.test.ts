import { describe, expect, it } from "vitest";

import {
  getBankTransferAccounts,
  getBankTransferConfig,
  hasBankTransferConfigured,
} from "@/lib/domain/bank-transfer";
import { findPlanById, resolveSubscriptionPeriodEnd } from "@/lib/domain/subscription-plans";

describe("bank-transfer", () => {
  it("detects bank transfer env configuration", () => {
    const keys = [
      "ZIGO_BANK_IBAN",
      "ZIGO_BANK_ACCOUNT_NAME",
      "ZIGO_BANK_NAME",
      "ZIGO_BANK_BRANCH",
      "ZIGO_BANK_ACCOUNT_NO",
      "ZIGO_BANK_LABEL",
      "ZIGO_BANK_2_IBAN",
      "ZIGO_BANK_2_ACCOUNT_NAME",
      "ZIGO_BANK_2_NAME",
    ] as const;
    const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

    for (const key of keys) {
      delete process.env[key];
    }
    expect(hasBankTransferConfigured()).toBe(false);
    expect(getBankTransferConfig()).toBeNull();
    expect(getBankTransferAccounts()).toEqual([]);

    process.env.ZIGO_BANK_IBAN = "TR00 0000 0000 0000 0000 0000 00";
    process.env.ZIGO_BANK_ACCOUNT_NAME = "Zigo Eduspire";
    process.env.ZIGO_BANK_NAME = "Demo Bank";
    process.env.ZIGO_BANK_BRANCH = "721 / Demo Şube";
    process.env.ZIGO_BANK_ACCOUNT_NO = "10262175";
    process.env.ZIGO_BANK_LABEL = "Halkbank";
    process.env.ZIGO_BANK_2_IBAN = "TR93 0015 7000 0000 0128 3325 48";
    process.env.ZIGO_BANK_2_ACCOUNT_NAME = "Nezih Eğitim";
    process.env.ZIGO_BANK_2_NAME = "Enpara Bank A.Ş.";
    process.env.ZIGO_BANK_2_LABEL = "Enpara";

    expect(hasBankTransferConfigured()).toBe(true);
    expect(getBankTransferAccounts()).toHaveLength(2);
    expect(getBankTransferConfig()).toEqual(getBankTransferAccounts()[0]);
    expect(getBankTransferAccounts()[1]?.iban).toBe("TR930015700000000128332548");

    for (const key of keys) {
      if (original[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = original[key];
      }
    }
  });
});

describe("resolveSubscriptionPeriodEnd", () => {
  it("extends monthly plans by one month", () => {
    const end = resolveSubscriptionPeriodEnd("student-monthly", new Date("2026-06-01T10:00:00.000Z"));
    expect(end.startsWith("2026-07-01")).toBe(true);
  });

  it("extends semiannual plans by six months", () => {
    const end = resolveSubscriptionPeriodEnd("student-semiannual", new Date("2026-01-15T10:00:00.000Z"));
    expect(end.startsWith("2026-07-15")).toBe(true);
  });

  it("extends yearly plans by one year", () => {
    const end = resolveSubscriptionPeriodEnd("student-yearly", new Date("2026-03-10T10:00:00.000Z"));
    expect(end.startsWith("2027-03-10")).toBe(true);
  });

  it("resolves known plan ids", () => {
    expect(findPlanById("family-monthly")?.interval).toBe("monthly");
  });
});
