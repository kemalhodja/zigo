import type { AdminBillingGrantLedgerRow } from "@/lib/domain/admin-billing-grant";
import { summarizeAdminBillingGrant } from "@/lib/domain/admin-billing-grant";
import type { Messages } from "@/lib/i18n/server";

type AdminBillingGrantLedgerProps = {
  grants: AdminBillingGrantLedgerRow[];
  labels: Messages["ops"]["admin"];
};

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AdminBillingGrantLedger({ grants, labels }: AdminBillingGrantLedgerProps) {
  return (
    <section className="-mx-4 bg-white px-4 py-4">
      <h3 className="text-sm font-black text-night">{labels.grantLedgerTitle}</h3>
      <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{labels.grantLedgerDesc}</p>
      {grants.length === 0 ? (
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-500">
          {labels.grantLedgerEmpty}
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-100">
          {grants.map((grant) => (
            <li className="px-3 py-3" key={grant.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-black text-night">{summarizeAdminBillingGrant(grant)}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {grant.userEmail ?? grant.userId}
                    {grant.adminName ? ` · ${labels.grantLedgerBy} ${grant.adminName}` : ""}
                  </p>
                  {grant.note ? (
                    <p className="mt-1 text-xs font-bold leading-5 text-amber-800">
                      {labels.grantLedgerNote}: {grant.note}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 text-[0.65rem] font-black text-slate-400">{formatWhen(grant.createdAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
