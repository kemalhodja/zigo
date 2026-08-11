"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { BankTransferConfig } from "@/lib/domain/bank-transfer";
import { formatTryPrice } from "@/lib/domain/subscription-plans";
import { useMessages } from "@/lib/i18n/locale-context";
import type { BankTransferRequestRow } from "@/lib/supabase/database.types";

type BankTransferCheckoutPanelProps = {
  planId: string;
  planLabel: string;
  amountTry: number;
  compareAtTry: number;
  campaignActive: boolean;
  initialRequest: BankTransferRequestRow | null;
  banks: BankTransferConfig[];
  configured: boolean;
};

function CopyableFieldRow({
  label,
  value,
  textToCopy,
  isCode = false,
}: {
  label: string;
  value: string;
  textToCopy: string;
  isCode?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs transition hover:border-emerald-300 hover:bg-emerald-50/40">
      <div className="min-w-0 flex-1">
        <dt className="text-[0.68rem] font-black uppercase tracking-wider text-emerald-800">{label}</dt>
        <dd className={`truncate font-black ${isCode ? "text-base tracking-wide text-night" : "text-sm text-night"}`}>
          {value}
        </dd>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className={`tap-scale flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition ${
          copied
            ? "bg-emerald-600 text-white shadow-xs"
            : "bg-emerald-100/80 text-emerald-900 border border-emerald-200 hover:bg-emerald-200/70"
        }`}
        title={`${label} kopyala`}
      >
        {copied ? (
          <>
            <svg aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
            <span>Kopyalandı ✓</span>
          </>
        ) : (
          <>
            <svg aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>Kopyala</span>
          </>
        )}
      </button>
    </div>
  );
}

function BankAccountDetails({
  account,
  amountTry,
  referenceCode,
  showReference,
  labels,
}: {
  account: BankTransferConfig;
  amountTry: number;
  referenceCode?: string;
  showReference?: boolean;
  labels: {
    labelAccount: string;
    labelPayee: string;
    labelBank: string;
    labelBranch: string;
    labelAccountNo: string;
    labelIban: string;
    labelAmount: string;
    labelReference: string;
  };
}) {
  const [copiedAll, setCopiedAll] = useState(false);

  async function handleCopyAll() {
    const lines = [];
    if (account.label) lines.push(`${labels.labelAccount}: ${account.label}`);
    lines.push(`${labels.labelPayee}: ${account.accountName}`);
    if (account.bankName) lines.push(`${labels.labelBank}: ${account.bankName}`);
    if (account.branchName) lines.push(`${labels.labelBranch}: ${account.branchName}`);
    if (account.accountNumber) lines.push(`${labels.labelAccountNo}: ${account.accountNumber}`);
    lines.push(`${labels.labelIban}: ${account.iban.replaceAll(" ", "")}`);
    if (showReference) {
      lines.push(`${labels.labelAmount}: ${formatTryPrice(amountTry)}`);
      if (referenceCode) lines.push(`${labels.labelReference}: ${referenceCode}`);
    }
    const fullText = lines.join("\n");

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullText);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = fullText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2200);
    } catch {
      setCopiedAll(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2.5">
        <span className="text-xs font-black uppercase tracking-wider text-emerald-900">Hesap Detayları</span>
        <button
          type="button"
          onClick={handleCopyAll}
          className={`tap-scale flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition ${
            copiedAll
              ? "bg-emerald-700 text-white shadow-sm"
              : "bg-emerald-800 text-white shadow-sm hover:bg-emerald-900"
          }`}
        >
          {copiedAll ? (
            <>
              <svg aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
              <span>Tüm Bilgiler Kopyalandı ✓</span>
            </>
          ) : (
            <>
              <svg aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span>📋 Tüm Bilgileri Kopyala</span>
            </>
          )}
        </button>
      </div>

      <dl className="space-y-2.5">
        {account.label ? (
          <CopyableFieldRow
            label={labels.labelAccount}
            textToCopy={account.label}
            value={account.label}
          />
        ) : null}
        <CopyableFieldRow
          label={labels.labelPayee}
          textToCopy={account.accountName}
          value={account.accountName}
        />
        {account.bankName ? (
          <CopyableFieldRow
            label={labels.labelBank}
            textToCopy={account.bankName}
            value={account.bankName}
          />
        ) : null}
        {account.branchName ? (
          <CopyableFieldRow
            label={labels.labelBranch}
            textToCopy={account.branchName}
            value={account.branchName}
          />
        ) : null}
        {account.accountNumber ? (
          <CopyableFieldRow
            label={labels.labelAccountNo}
            textToCopy={account.accountNumber}
            value={account.accountNumber}
          />
        ) : null}
        <CopyableFieldRow
          isCode
          label={labels.labelIban}
          textToCopy={account.iban.replaceAll(" ", "")}
          value={account.iban}
        />
        {showReference ? (
          <>
            <CopyableFieldRow
              label={labels.labelAmount}
              textToCopy={String(amountTry)}
              value={formatTryPrice(amountTry)}
            />
            {referenceCode ? (
              <CopyableFieldRow
                isCode
                label={labels.labelReference}
                textToCopy={referenceCode}
                value={referenceCode}
              />
            ) : null}
          </>
        ) : null}
      </dl>
    </div>
  );
}

export function BankTransferCheckoutPanel({
  planId,
  planLabel,
  amountTry,
  compareAtTry,
  campaignActive,
  initialRequest,
  banks,
  configured,
}: BankTransferCheckoutPanelProps) {
  const router = useRouter();
  const { billingUi } = useMessages();
  const h = billingUi.havale;
  const [request, setRequest] = useState<BankTransferRequestRow | null>(initialRequest);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const statusLabel = useMemo(() => {
    if (!request) return null;
    if (request.status === "pending") return h.statusPending;
    if (request.status === "approved") return h.statusApproved;
    if (request.status === "rejected") return h.statusRejected;
    return h.statusCancelled;
  }, [h, request]);

  async function createRequest() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/billing/bank-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const payload = (await response.json().catch(() => null)) as {
        data?: { request?: BankTransferRequestRow; banks?: BankTransferConfig[] };
        error?: string;
      } | null;

      if (!response.ok || !payload?.data?.request) {
        setMessage(payload?.error ?? h.createFailed);
        setLoading(false);
        return;
      }

      setRequest(payload.data.request);
      setMessage(h.createReady);
      router.refresh();
    } catch {
      setMessage(billingUi.connectionFailed);
    } finally {
      setLoading(false);
    }
  }

  async function uploadReceipt() {
    if (!request || !selectedFile) {
      setMessage(h.receiptSelectFile);
      return;
    }

    setUploading(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.set("requestId", String((request as { id?: string }).id));
      formData.set("file", selectedFile);

      const response = await fetch("/api/billing/bank-transfer/receipt", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as {
        data?: BankTransferRequestRow;
        error?: string;
      } | null;

      if (!response.ok) {
        setMessage(payload?.error ?? h.receiptFailed);
        setUploading(false);
        return;
      }

      if (payload?.data) {
        setRequest(payload.data);
      }
      setSelectedFile(null);
      setMessage(h.receiptReceived);
      router.refresh();
    } catch {
      setMessage(billingUi.connectionFailed);
    } finally {
      setUploading(false);
    }
  }

  if (!configured || banks.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-semibold text-amber-900">
        {h.notConfigured}
      </div>
    );
  }

  const requestLoc = request as { id?: string; status?: string; reference_code?: string; receipt_storage_path?: string } | null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{h.selectedPlan}</p>
        <p className="mt-1 text-lg font-black text-night">{planLabel}</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          {campaignActive ? (
            <span className="text-sm font-bold text-slate-400 line-through">{formatTryPrice(compareAtTry)}</span>
          ) : null}
          <span className="text-2xl font-black text-crystal">{formatTryPrice(amountTry)}</span>
        </div>
      </div>

      {!requestLoc ? (
        <button
          className="tap-scale w-full rounded-xl bg-night px-4 py-3 text-sm font-black text-white disabled:opacity-60"
          disabled={loading}
          onClick={() => void createRequest()}
          type="button"
        >
          {loading ? h.preparing : h.showDetails}
        </button>
      ) : (
        <>
          <div className="space-y-3">
            {banks.map((account, index) => (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4" key={account.id}>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  {banks.length > 1 ? h.bankAccount.replace("{n}", String(index + 1)) : h.bankDetails}
                </p>
                <div className="mt-3">
                  <BankAccountDetails
                    account={account}
                    amountTry={amountTry}
                    labels={h}
                    referenceCode={requestLoc.reference_code}
                    showReference={index === 0}
                  />
                </div>
              </div>
            ))}
          </div>

          {banks.length > 1 ? (
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
              {h.amountReference
                .replace("{amount}", formatTryPrice(amountTry))
                .replace("{code}", requestLoc.reference_code ?? "")}
            </div>
          ) : null}

          <p className="text-xs font-semibold leading-5 text-emerald-800">{h.referenceHint}</p>

          {statusLabel ? (
            <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">{statusLabel}</p>
          ) : null}

          {requestLoc.status === "pending" ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-black text-night">{h.receiptTitle}</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{h.receiptHint}</p>
              <input
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="mt-3 block w-full text-xs font-semibold text-slate-600"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                type="file"
              />
              <button
                className="tap-scale mt-3 w-full rounded-xl border border-night px-4 py-3 text-sm font-black text-night disabled:opacity-60"
                disabled={uploading || !selectedFile}
                onClick={() => void uploadReceipt()}
                type="button"
              >
                {uploading ? h.receiptUploading : requestLoc.receipt_storage_path ? h.receiptUpdate : h.receiptUpload}
              </button>
              {requestLoc.receipt_storage_path ? (
                <p className="mt-2 text-xs font-bold text-emerald-700">{h.receiptUploaded}</p>
              ) : null}
            </div>
          ) : null}
        </>
      )}

      {message ? <p className="text-sm font-bold text-slate-600">{message}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Link className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-black text-night" href="/profile">
          {h.backProfile}
        </Link>
        <Link className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-black text-night" href="/billing/success">
          {h.successInfo}
        </Link>
      </div>
    </div>
  );
}
