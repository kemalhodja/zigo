/**
 * AdGateButton — sponsor-only mode: actions proceed without rewarded ads.
 */

"use client";

interface AdGateButtonProps {
  userId: string | null | undefined;
  onClick: () => void;
  children: React.ReactNode;
  actionName: string;
  disabled?: boolean;
  className?: string;
}

export function AdGateButton({
  onClick,
  children,
  disabled = false,
  className = "",
}: AdGateButtonProps) {
  return (
    <button className={className} disabled={disabled} onClick={onClick} type="button">
      {children}
    </button>
  );
}
