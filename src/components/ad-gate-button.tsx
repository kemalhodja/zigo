/**
 * AdGateButton Component
 * 
 * Wrapper component that gates actions behind ad watch or premium status.
 * Use this for "Reels Paylaş" and "Akış Gönderisi" buttons.
 */

"use client";

import { useEffect,useState } from "react";

import { useAdGate } from "@/lib/hooks/use-ad-state";

import { AdGateModal } from "./ad-gate-modal";

interface AdGateButtonProps {
  userId: string | null | undefined;
  onClick: () => void;
  children: React.ReactNode;
  actionName: string;
  disabled?: boolean;
  className?: string;
}

export function AdGateButton({
  userId,
  onClick,
  children,
  actionName,
  disabled = false,
  className = "",
}: AdGateButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const { gateResult, loading } = useAdGate(userId);

  useEffect(() => {
    if (gateResult) {
      setCanProceed(gateResult.canProceed);
    }
  }, [gateResult]);

  const handleClick = () => {
    if (disabled || loading) return;

    if (canProceed) {
      // User is ad-free, proceed with action
      onClick();
    } else {
      // User needs to watch ad or upgrade
      setIsModalOpen(true);
    }
  };

  const handleAdSuccess = () => {
    setCanProceed(true);
    // Proceed with the original action
    onClick();
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        className={className}
      >
        {children}
      </button>

      <AdGateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAdSuccess}
        actionName={actionName}
      />
    </>
  );
}