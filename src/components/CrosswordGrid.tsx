
import { useEffect, useRef } from "react";

interface CrosswordCell {
  letter: string;
  number?: number;
  isActive: boolean;
  isHighlighted: boolean;
}

interface CrosswordGridProps {
  grid: CrosswordCell[][];
  onCellClick: (row: number, col: number) => void;
  onCellChange: (row: number, col: number, value: string) => void;
}

export const CrosswordGrid = ({ grid, onCellClick, onCellChange }: CrosswordGridProps) => {
  const gridRef = useRef<HTMLDivElement>(null);

  const handleCellInput = (row: number, col: number, value: string) => {
    if (value.length <= 1 && /^[A-Za-z]$/.test(value) || value === "") {
      onCellChange(row, col, value.toUpperCase());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
    if (e.key === "Backspace" && (e.target as HTMLInputElement).value === "") {
      e.preventDefault();
      onCellChange(row, col, "");
      // Move to previous cell
      const prevInput = gridRef.current?.querySelector(
        `input[data-row="${row}"][data-col="${col - 1}"]`
      ) as HTMLInputElement;
      prevInput?.focus();
    }
  };

  return (
    <div ref={gridRef} className="grid gap-px bg-slate-200 p-px rounded-lg shadow-lg animate-fade-in">
      {grid.map((row, rowIndex) => (
        <div key={rowIndex} className="flex">
          {row.map((cell, colIndex) => (
            <div key={`${rowIndex}-${colIndex}`} className="relative">
              {cell.number && (
                <span className="crossword-cell-number">{cell.number}</span>
              )}
              <input
                type="text"
                maxLength={1}
                className={`crossword-cell ${cell.isActive ? "active" : ""} ${
                  cell.isHighlighted ? "highlighted" : ""
                }`}
                value={cell.letter}
                onChange={(e) => handleCellInput(rowIndex, colIndex, e.target.value)}
                onClick={() => onCellClick(rowIndex, colIndex)}
                onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                data-row={rowIndex}
                data-col={colIndex}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
