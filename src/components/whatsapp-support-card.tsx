import {
  buildWhatsAppSupportUrl,
  isWhatsAppSupportVisible,
  type WhatsAppSupportContext,
} from "@/lib/domain/support-contact";
import type { UserRole } from "@/lib/supabase/database.types";

type WhatsAppSupportCardProps = {
  role?: UserRole | null;
  context: WhatsAppSupportContext;
  eyebrow: string;
  title: string;
  description: string;
  buttonLabel: string;
  hoursLabel: string;
  privacyNote: string;
  prefilledMessage: string;
  compact?: boolean;
};

export function WhatsAppSupportCard({
  role,
  context,
  eyebrow,
  title,
  description,
  buttonLabel,
  hoursLabel,
  privacyNote,
  prefilledMessage,
  compact = false,
}: WhatsAppSupportCardProps) {
  if (!isWhatsAppSupportVisible(role, context)) return null;

  const href = buildWhatsAppSupportUrl(prefilledMessage);
  if (!href) return null;

  if (compact) {
    return (
      <WhatsAppSupportLink
        ariaLabel={buttonLabel}
        className="tap-scale inline-flex size-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md ring-4 ring-emerald-100"
        href={href}
        iconClassName="size-6"
      />
    );
  }

  return (
    <section className="-mx-4 border-y border-emerald-100 bg-gradient-to-br from-emerald-50 to-white px-4 py-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">{eyebrow}</p>
      <h2 className="mt-2 text-lg font-black text-night">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <p className="mt-2 text-xs font-semibold text-slate-500">{hoursLabel}</p>
      <div className="mt-4 flex items-center gap-3">
        <WhatsAppSupportLink
          ariaLabel={buttonLabel}
          className="tap-scale inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg ring-4 ring-emerald-100 transition hover:scale-105"
          href={href}
          iconClassName="size-7"
        />
        <p className="text-sm font-semibold text-slate-600">{buttonLabel}</p>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{privacyNote}</p>
    </section>
  );
}

function WhatsAppSupportLink({
  ariaLabel,
  className,
  href,
  iconClassName,
}: {
  ariaLabel: string;
  className: string;
  href: string;
  iconClassName: string;
}) {
  return (
    <a
      aria-label={ariaLabel}
      className={className}
      href={href}
      rel="noopener noreferrer"
      target="_blank"
      title={ariaLabel}
    >
      <WhatsAppIcon className={iconClassName} />
    </a>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}
