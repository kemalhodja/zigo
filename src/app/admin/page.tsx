import Link from "next/link";

import { AdminBankTransferActions } from "@/components/admin-bank-transfer-actions";
import { AdminRedemptionStatus } from "@/components/admin-redemption-status";
import { AdminStockForm } from "@/components/admin-stock-form";
import { AdminStripeCampaignPanel } from "@/components/admin-stripe-campaign-panel";
import { AdminStudentDocumentActions } from "@/components/admin-student-document-actions";
import { AdminTeacherActions } from "@/components/admin-teacher-actions";
import { AdminTeacherAreaForm } from "@/components/admin-teacher-area-form";
import { StateCard } from "@/components/state-card";
import { hasSupabaseEnv } from "@/lib/config";
import {
  getAdminStoreProducts,
  getAdminStoreRedemptions,
  getStudentDocumentQueue,
  getTeacherVerificationQueue,
  isCurrentUserPlatformAdmin,
} from "@/lib/domain/admin";
import { getPendingBankTransferQueue } from "@/lib/domain/bank-transfer";
import { getCurrentProfile, getEducationAreas } from "@/lib/domain/profiles";
import { getServerMessages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

function TeacherRow({
  teacher,
  areas,
  labels,
}: {
  teacher: Awaited<ReturnType<typeof getTeacherVerificationQueue>>[number];
  areas: Awaited<ReturnType<typeof getEducationAreas>>;
  labels: {
    verified: string;
    pendingVerification: string;
  };
}) {
  return (
    <div className="grid gap-3 border-b border-slate-100 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-night">{teacher.full_name}</p>
          <p className="text-xs font-bold text-slate-500">{teacher.email}</p>
          <p className="mt-1 text-xs font-black text-crystal">
            {teacher.is_verified ? labels.verified : labels.pendingVerification}
          </p>
        </div>
        <AdminTeacherActions isVerified={teacher.is_verified} teacherId={teacher.id} />
      </div>
      <AdminTeacherAreaForm areas={areas} teacherId={teacher.id} />
    </div>
  );
}

export default async function AdminPage() {
  const m = await getServerMessages();
  const a = m.ops.admin;
  const c = m.ops.common;

  if (!hasSupabaseEnv()) {
    return (
      <StateCard
        action={
          <Link className="font-black text-crystal" href="/setup">
            {a.openSetup}
          </Link>
        }
        description={a.needsSupabaseDesc}
        title={a.needsSupabaseTitle}
      />
    );
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    return (
      <StateCard
        action={
          <Link className="font-black text-crystal" href="/auth?next=/admin">
            {c.signIn}
          </Link>
        }
        description={a.signInRequiredDesc}
        title={a.signInRequiredTitle}
      />
    );
  }

  const isAdmin = await isCurrentUserPlatformAdmin(supabase);

  if (!isAdmin) {
    return (
      <StateCard
        action={
          <Link className="font-black text-crystal" href="/setup">
            {a.openSetupGuide}
          </Link>
        }
        description={a.noAccessDesc}
        title={a.noAccessTitle}
      />
    );
  }

  const [teachers, products, redemptions, areas, studentDocuments, bankTransfers] = await Promise.all([
    getTeacherVerificationQueue(supabase),
    getAdminStoreProducts(supabase),
    getAdminStoreRedemptions(supabase),
    getEducationAreas(supabase),
    getStudentDocumentQueue(supabase),
    getPendingBankTransferQueue(supabase),
  ]);

  const pendingTeachers = teachers.filter((teacher) => !teacher.is_verified);
  const verifiedTeachers = teachers.filter((teacher) => teacher.is_verified);

  const auditItems = [
    { label: a.queueTeacherVerify, value: pendingTeachers.length },
    { label: a.queueStudentDocs, value: studentDocuments.length },
    { label: a.queueBankTransfers, value: bankTransfers.length },
    { label: a.queueStoreOrders, value: redemptions.length },
    { label: a.queueStock, value: products.length },
  ];

  return (
    <div className="space-y-5">
      <section className="-mx-4 border-b border-slate-100 bg-white px-4 pb-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{a.eyebrow}</p>
        <h2 className="mt-1 text-2xl font-black text-night">{a.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{a.desc}</p>
        <span className="mt-3 inline-block rounded-lg bg-violet-50 px-3 py-1 text-xs font-black text-crystal">
          {a.platformFocus}
        </span>
      </section>

      <section className="-mx-4 bg-white px-4 py-4">
        <h3 className="text-sm font-black text-night">{a.quickLinksTitle}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-night" href="/moderation">
            {a.linkModeration}
          </Link>
          <Link className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-night" href="/setup">
            {a.linkSetup}
          </Link>
          <Link className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-night" href="/explore">
            {a.linkExplore}
          </Link>
        </div>
      </section>

      <AdminStripeCampaignPanel />

      <section className="-mx-4 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-lg font-black text-night">{a.bankTransferSectionTitle}</h3>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{a.bankTransferSectionDesc}</p>
        </div>
        {bankTransfers.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-black text-night">{a.noBankTransfersTitle}</p>
            <p className="mx-auto mt-1 max-w-64 text-sm font-bold leading-6 text-slate-500">{a.noBankTransfersDesc}</p>
          </div>
        ) : (
          bankTransfers.map((transfer) => (
            <div className="space-y-3 border-b border-slate-100 px-4 py-4" key={transfer.id}>
              <div>
                <p className="font-black text-night">{transfer.user?.full_name ?? c.unknownUser}</p>
                <p className="text-xs font-bold text-slate-500">{transfer.user?.email}</p>
                <p className="mt-1 text-xs font-black text-crystal">{transfer.reference_code}</p>
              </div>
              <AdminBankTransferActions request={transfer} />
            </div>
          ))
        )}
      </section>

      <section className="-mx-4 bg-gradient-to-r from-violet-50 via-pink-50 to-cyan-50 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{a.auditEyebrow}</p>
            <h3 className="mt-1 text-xl font-black text-night">{a.auditTitle}</h3>
            <p className="mt-1 text-sm font-bold leading-6 text-slate-600">{a.auditDesc}</p>
          </div>
          <span className="rounded-lg bg-white px-3 py-2 text-xs font-black text-crystal">{c.live}</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {auditItems.map((item) => (
            <div className="rounded-lg bg-white p-3" key={item.label}>
              <p className="text-lg font-black text-night">{item.value}</p>
              <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="-mx-4 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-lg font-black text-night">{a.studentDocSectionTitle}</h3>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{a.studentDocSectionDesc}</p>
        </div>
        {studentDocuments.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-black text-night">{a.noStudentDocsTitle}</p>
            <p className="mx-auto mt-1 max-w-64 text-sm font-bold leading-6 text-slate-500">{a.noStudentDocsDesc}</p>
          </div>
        ) : (
          studentDocuments.map((student) => (
            <div className="border-b border-slate-100 px-4 py-4" key={student.id}>
              <AdminStudentDocumentActions
                documentUrl={student.student_document_url}
                fullName={student.full_name}
                gradeLevel={student.grade_level}
                studentId={student.id}
              />
            </div>
          ))
        )}
      </section>

      <section className="-mx-4 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-lg font-black text-night">{a.pendingTeachersTitle}</h3>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{a.pendingTeachersDesc}</p>
        </div>
        {pendingTeachers.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-black text-night">{a.noTeachersTitle}</p>
            <p className="mx-auto mt-1 max-w-64 text-sm font-bold leading-6 text-slate-500">{a.noTeachersDesc}</p>
          </div>
        ) : (
          pendingTeachers.map((teacher) => (
            <TeacherRow
              areas={areas}
              key={teacher.id}
              labels={{ verified: a.verified, pendingVerification: a.pendingVerification }}
              teacher={teacher}
            />
          ))
        )}
      </section>

      {verifiedTeachers.length > 0 ? (
        <section className="-mx-4 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-lg font-black text-night">{a.allTeachersTitle}</h3>
          </div>
          {verifiedTeachers.map((teacher) => (
            <TeacherRow
              areas={areas}
              key={teacher.id}
              labels={{ verified: a.verified, pendingVerification: a.pendingVerification }}
              teacher={teacher}
            />
          ))}
        </section>
      ) : null}

      <section className="-mx-4 bg-white">
        <h3 className="border-b border-slate-100 px-4 py-3 text-lg font-black text-night">{a.storeOrdersTitle}</h3>
        {redemptions.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-black text-night">{a.noOrdersTitle}</p>
            <p className="mx-auto mt-1 max-w-64 text-sm font-bold leading-6 text-slate-500">{a.noOrdersDesc}</p>
          </div>
        ) : (
          redemptions.map((redemption) => (
            <div className="space-y-3 border-b border-slate-100 px-4 py-4" key={redemption.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-night">{redemption.product?.name ?? c.zigoProduct}</p>
                  <p className="text-xs font-bold text-slate-500">
                    {redemption.child?.display_name ??
                      redemption.user?.full_name ??
                      c.unknownUser}
                  </p>
                  {redemption.note ? (
                    <p className="mt-2 text-xs leading-5 text-slate-600">{redemption.note}</p>
                  ) : null}
                </div>
                <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-black text-night">
                  {redemption.points_spent} Zigo
                </span>
              </div>
              <AdminRedemptionStatus redemptionId={redemption.id} status={redemption.status} />
            </div>
          ))
        )}
      </section>

      <section className="-mx-4 bg-white">
        <h3 className="border-b border-slate-100 px-4 py-3 text-lg font-black text-night">{a.stockTitle}</h3>
        {products.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-black text-night">{a.noProductsTitle}</p>
            <p className="mx-auto mt-1 max-w-64 text-sm font-bold leading-6 text-slate-500">{a.noProductsDesc}</p>
          </div>
        ) : (
          products.map((product) => (
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4" key={product.id}>
              <div>
                <p className="font-black text-night">{product.name}</p>
                <p className="text-xs font-bold text-slate-500">
                  {product.price_points} Zigo · {product.category}
                </p>
              </div>
              <AdminStockForm productId={product.id} stockCount={product.stock_count} />
            </div>
          ))
        )}
      </section>
    </div>
  );
}
