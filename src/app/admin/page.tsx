import Link from "next/link";

import { AdminBankTransferActions } from "@/components/admin-bank-transfer-actions";
import { AdminDisputeActions } from "@/components/admin-dispute-actions";
import { AdminRedemptionStatus } from "@/components/admin-redemption-status";
import { AdminStockForm } from "@/components/admin-stock-form";
import { AdminStripeCampaignPanel } from "@/components/admin-stripe-campaign-panel";
import { AdminStudentDocumentActions } from "@/components/admin-student-document-actions";
import { AdminTeacherActions } from "@/components/admin-teacher-actions";
import { AdminTeacherAreaForm } from "@/components/admin-teacher-area-form";
import { AdminTeacherCredentialActions } from "@/components/admin-teacher-credential-actions";
import { StateCard } from "@/components/state-card";
import { hasSupabaseEnv } from "@/lib/config";
import {
  getAdminStoreProducts,
  getAdminStoreRedemptions,
  getOpenPaymentDisputeQueue,
  getPublisherVerificationQueue,
  getStudentDocumentQueue,
  getTeacherCredentialQueue,
  isCurrentUserPlatformAdmin,
} from "@/lib/domain/admin";
import { getPendingBankTransferQueue } from "@/lib/domain/bank-transfer";
import { getCurrentProfile, getEducationAreas } from "@/lib/domain/profiles";
import { type PublisherAccountKind,resolvePublisherAccountKind } from "@/lib/domain/registration-account";
import { getServerMessages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

function PublisherRow({
  publisher,
  areas,
  labels,
}: {
  publisher: Awaited<ReturnType<typeof getPublisherVerificationQueue>>[number];
  areas: Awaited<ReturnType<typeof getEducationAreas>>;
  labels: {
    verified: string;
    pendingVerification: string;
    accountKinds: Record<PublisherAccountKind, string>;
  };
}) {
  const accountKind = resolvePublisherAccountKind(publisher);

  return (
    <div className="grid gap-3 border-b border-slate-100 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-night">{publisher.full_name}</p>
            <span className="rounded-lg bg-violet-50 px-2 py-0.5 text-[0.65rem] font-black uppercase tracking-[0.12em] text-crystal">
              {labels.accountKinds[accountKind]}
            </span>
          </div>
          <p className="text-xs font-bold text-slate-500">{publisher.email}</p>
          <p className="mt-1 text-xs font-black text-crystal">
            {publisher.is_verified ? labels.verified : labels.pendingVerification}
          </p>
        </div>
        <AdminTeacherActions isVerified={publisher.is_verified} teacherId={publisher.id} />
      </div>
      <AdminTeacherAreaForm areas={areas} teacherId={publisher.id} />
    </div>
  );
}

function PublisherQueueSection({
  title,
  desc,
  publishers,
  areas,
  labels,
  emptyTitle,
  emptyDesc,
}: {
  title: string;
  desc: string;
  publishers: Awaited<ReturnType<typeof getPublisherVerificationQueue>>;
  areas: Awaited<ReturnType<typeof getEducationAreas>>;
  labels: {
    verified: string;
    pendingVerification: string;
    accountKinds: Record<PublisherAccountKind, string>;
  };
  emptyTitle: string;
  emptyDesc: string;
}) {
  return (
    <section className="-mx-4 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-lg font-black text-night">{title}</h3>
        <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{desc}</p>
      </div>
      {publishers.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm font-black text-night">{emptyTitle}</p>
          <p className="mx-auto mt-1 max-w-64 text-sm font-bold leading-6 text-slate-500">{emptyDesc}</p>
        </div>
      ) : (
        publishers.map((publisher) => (
          <PublisherRow
            areas={areas}
            key={publisher.id}
            labels={labels}
            publisher={publisher}
          />
        ))
      )}
    </section>
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

  const [publishers, products, redemptions, areas, studentDocuments, bankTransfers, credentialQueue, disputeQueue] =
    await Promise.all([
    getPublisherVerificationQueue(supabase),
    getAdminStoreProducts(supabase),
    getAdminStoreRedemptions(supabase),
    getEducationAreas(supabase),
    getStudentDocumentQueue(supabase),
    getPendingBankTransferQueue(supabase),
    getTeacherCredentialQueue(supabase),
    getOpenPaymentDisputeQueue(supabase),
  ]);

  const pendingPublishers = publishers.filter((publisher) => !publisher.is_verified);
  const verifiedPublishers = publishers.filter((publisher) => publisher.is_verified);
  const pendingTeachers = pendingPublishers.filter(
    (publisher) => resolvePublisherAccountKind(publisher) === "teacher",
  );
  const pendingInstitutions = pendingPublishers.filter(
    (publisher) => resolvePublisherAccountKind(publisher) === "institution",
  );
  const pendingPlatforms = pendingPublishers.filter(
    (publisher) => resolvePublisherAccountKind(publisher) === "platform",
  );

  const publisherLabels = {
    verified: a.verified,
    pendingVerification: a.pendingVerification,
    accountKinds: {
      teacher: a.publisherKindTeacher,
      institution: a.publisherKindInstitution,
      platform: a.publisherKindPlatform,
    },
  };

  const auditItems = [
    { label: a.queuePublisherVerify, value: pendingPublishers.length },
    { label: a.queueStudentDocs, value: studentDocuments.length },
    { label: "Öğretmen belgeleri", value: credentialQueue.length },
    { label: "Ödeme itirazları", value: disputeQueue.length },
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
          <h3 className="text-lg font-black text-night">Öğretmen diploma / e-Devlet kuyruğu</h3>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
            Yüklenen belgeleri inceleyin; onay sonrası öğretmen otomatik doğrulanır.
          </p>
        </div>
        {credentialQueue.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-black text-night">Bekleyen belge yok</p>
          </div>
        ) : (
          credentialQueue.map((submission) => (
            <div className="border-b border-slate-100 px-4 py-4" key={submission.id}>
              <AdminTeacherCredentialActions
                credentialType={submission.credential_type}
                documentUrl={submission.document_url}
                submissionId={submission.id}
                teacherEmail={submission.teacher?.email ?? ""}
                teacherName={submission.teacher?.full_name ?? c.unknownUser}
              />
            </div>
          ))
        )}
      </section>

      <section className="-mx-4 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-lg font-black text-night">Ödeme itirazları</h3>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
            Veli veya öğretmen tarafından açılan ders ödeme itirazları.
          </p>
        </div>
        {disputeQueue.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-black text-night">Açık itiraz yok</p>
          </div>
        ) : (
          disputeQueue.map((dispute) => (
            <div className="border-b border-slate-100 px-4 py-4" key={dispute.id}>
              <AdminDisputeActions
                disputeId={dispute.id}
                parentName={dispute.booking?.parent?.full_name}
                reason={dispute.reason}
                teacherName={dispute.booking?.teacher?.full_name}
              />
            </div>
          ))
        )}
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

      <PublisherQueueSection
        areas={areas}
        desc={a.pendingTeachersDesc}
        emptyDesc={a.noTeachersDesc}
        emptyTitle={a.noTeachersTitle}
        labels={publisherLabels}
        publishers={pendingTeachers}
        title={a.pendingTeachersTitle}
      />

      <PublisherQueueSection
        areas={areas}
        desc={a.pendingInstitutionsDesc}
        emptyDesc={a.noInstitutionsDesc}
        emptyTitle={a.noInstitutionsTitle}
        labels={publisherLabels}
        publishers={pendingInstitutions}
        title={a.pendingInstitutionsTitle}
      />

      <PublisherQueueSection
        areas={areas}
        desc={a.pendingPlatformsDesc}
        emptyDesc={a.noPlatformsDesc}
        emptyTitle={a.noPlatformsTitle}
        labels={publisherLabels}
        publishers={pendingPlatforms}
        title={a.pendingPlatformsTitle}
      />

      {verifiedPublishers.length > 0 ? (
        <section className="-mx-4 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-lg font-black text-night">{a.allTeachersTitle}</h3>
          </div>
          {verifiedPublishers.map((publisher) => (
            <PublisherRow
              areas={areas}
              key={publisher.id}
              labels={publisherLabels}
              publisher={publisher}
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
