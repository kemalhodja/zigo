"use client";

import { memo } from "react";

export type ShapeType = {
  matrix: number[][];
  color: string;
  glowColor: string;
};

type BlockPieceProps = {
  shape: ShapeType | null;
  isSelected: boolean;
  onClick: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  disabled?: boolean;
  isDragging?: boolean;
  isGhost?: boolean;
};

export const BlockPiece = memo(function BlockPiece({
  shape,
  isSelected,
  onClick,
  onPointerDown,
  disabled,
  isDragging,
  isGhost,
}: BlockPieceProps) {
  if (!shape) {
    return <div className="w-20 h-20 opacity-0" />;
  }

  const { matrix, color, glowColor } = shape;
  const rows = matrix.length;
  const cols = matrix[0].length;
  // Dinamik boyutlandırma: büyük parçaların hücreler daha küçük olsun
  const maxDim = Math.max(rows, cols);
  const cellSize = maxDim <= 2 ? "w-6 h-6" : maxDim <= 3 ? "w-5 h-5" : "w-4 h-4";

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      disabled={disabled}
      className={`${
        isGhost 
          ? "flex items-center justify-center scale-110 drop-shadow-2xl opacity-90" 
          : `tap-scale p-2.5 rounded-2xl transition-all duration-200 flex items-center justify-center min-w-[5rem] min-h-[5rem] ${
              isSelected
                ? `bg-white/20 shadow-inner scale-110 ring-2 ring-white/50 ${glowColor}`
                : "bg-white/5 hover:bg-white/10 border border-white/10"
            } ${disabled ? "opacity-30 cursor-not-allowed grayscale" : "cursor-pointer"} ${isDragging ? "opacity-50 scale-90" : ""}`
      }`}
      style={{ touchAction: "none" }} // prevent scrolling while dragging
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
              className={`${cellSize} rounded-sm transition-all ${
                cell === 1
                  ? `${color} shadow-sm border border-white/20`
                  : "bg-transparent"
              }`}
            />
          ))
        )}
      </div>
    </button>
  );
});
