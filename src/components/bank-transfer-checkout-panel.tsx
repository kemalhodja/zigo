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
  return (
    <dl className="space-y-2 text-sm">
      {account.label ? (
        <div>
          <dt className="font-bold text-emerald-900">{labels.labelAccount}</dt>
          <dd className="font-black text-night">{account.label}</dd>
        </div>
      ) : null}
      <div>
        <dt className="font-bold text-emerald-900">{labels.labelPayee}</dt>
        <dd className="font-black text-night">{account.accountName}</dd>
      </div>
      {account.bankName ? (
        <div>
          <dt className="font-bold text-emerald-900">{labels.labelBank}</dt>
          <dd className="font-black text-night">{account.bankName}</dd>
        </div>
      ) : null}
      {account.branchName ? (
        <div>
          <dt className="font-bold text-emerald-900">{labels.labelBranch}</dt>
          <dd className="font-black text-night">{account.branchName}</dd>
        </div>
      ) : null}
      {account.accountNumber ? (
        <div>
          <dt className="font-bold text-emerald-900">{labels.labelAccountNo}</dt>
          <dd className="font-black text-night">{account.accountNumber}</dd>
        </div>
      ) : null}
      <div>
        <dt className="font-bold text-emerald-900">{labels.labelIban}</dt>
        <dd className="break-all font-black tracking-wide text-night">{account.iban}</dd>
      </div>
      {showReference ? (
        <>
          <div>
            <dt className="font-bold text-emerald-900">{labels.labelAmount}</dt>
            <dd className="font-black text-night">{formatTryPrice(amountTry)}</dd>
          </div>
          <div>
            <dt className="font-bold text-emerald-900">{labels.labelReference}</dt>
            <dd className="font-black text-crystal">{referenceCode}</dd>
          </div>
        </>
      ) : null}
    </dl>
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
      formData.set("requestId", request.id);
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

      {!request ? (
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
                    referenceCode={request.reference_code}
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
                .replace("{code}", request.reference_code)}
            </div>
          ) : null}

          <p className="text-xs font-semibold leading-5 text-emerald-800">{h.referenceHint}</p>

          {statusLabel ? (
            <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">{statusLabel}</p>
          ) : null}

          {request.status === "pending" ? (
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
                {uploading ? h.receiptUploading : request.receipt_storage_path ? h.receiptUpdate : h.receiptUpload}
              </button>
              {request.receipt_storage_path ? (
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
