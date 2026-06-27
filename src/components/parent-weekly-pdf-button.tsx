"use client";

type ParentWeeklyPdfButtonProps = {
  childProfileId?: string;
  label?: string;
};

export function ParentWeeklyPdfButton({
  childProfileId,
  label = "Haftalık PDF raporu indir",
}: ParentWeeklyPdfButtonProps) {
  const href = childProfileId
    ? `/api/ecosystem/progress/weekly/pdf?childProfileId=${encodeURIComponent(childProfileId)}`
    : "/api/ecosystem/progress/weekly/pdf";

  return (
    <a
      className="tap-scale inline-flex rounded-xl border border-cyan-200 bg-white px-4 py-2 text-sm font-black text-crystal"
      download
      href={href}
    >
      {label}
    </a>
  );
}
