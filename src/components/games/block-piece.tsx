"use client";

import { memo } from "react";

export type ShapeType = {
  matrix: number[][];
  color: string;
};

type BlockPieceProps = {
  shape: ShapeType | null;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
};

export const BlockPiece = memo(function BlockPiece({
  shape,
  isSelected,
  onClick,
  disabled,
}: BlockPieceProps) {
  if (!shape) {
    return <div className="w-20 h-20 opacity-0" />;
  }

  const { matrix, color } = shape;
  const rows = matrix.length;
  const cols = matrix[0].length;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`tap-scale p-2 rounded-xl transition-all flex items-center justify-center min-w-[5rem] min-h-[5rem] ${
        isSelected ? "bg-slate-200 shadow-inner scale-110 ring-2 ring-indigo-500" : "bg-slate-50 hover:bg-slate-100 border border-slate-100"
      } ${disabled ? "opacity-30 cursor-not-allowed grayscale" : ""}`}
    >
      <div
        className="grid gap-[2px]"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {matrix.map((row, rIndex) =>
          row.map((cell, cIndex) => (
            <div
              key={`${rIndex}-${cIndex}`}
              className={`w-4 h-4 sm:w-5 sm:h-5 rounded-sm ${
                cell === 1 ? `${color} shadow-sm border border-black/10` : "bg-transparent"
              }`}
            />
          ))
        )}
      </div>
    </button>
  );
});
