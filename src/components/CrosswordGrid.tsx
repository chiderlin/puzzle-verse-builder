
import { useEffect, useRef } from "react";

interface CrosswordCell {
  letter: string;
  number?: number;
  isActive: boolean;
  isHighlighted: boolean;
  isRevealed?: boolean;
  isPartialHint?: boolean; // New property to mark cells that are shown as hints
}

interface CrosswordGridProps {
  grid: CrosswordCell[][];
  onCellClick: (row: number, col: number) => void;
  onCellChange: (row: number, col: number, value: string) => void;
  onHintRequest: (row: number, col: number) => void;
}

export const CrosswordGrid = ({ 
  grid, 
  onCellClick, 
  onCellChange,
  onHintRequest 
}: CrosswordGridProps) => {
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
              <div className="relative">
                <input
                  type="text"
                  maxLength={1}
                  className={`crossword-cell ${cell.isActive ? "active" : ""} ${
                    cell.isHighlighted ? "highlighted" : ""
                  } ${cell.isPartialHint ? "bg-slate-100" : ""}`}
                  value={cell.isRevealed || cell.isPartialHint ? cell.letter : ""}
                  onChange={(e) => handleCellInput(rowIndex, colIndex, e.target.value)}
                  onClick={() => onCellClick(rowIndex, colIndex)}
                  onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                  data-row={rowIndex}
                  data-col={colIndex}
                  readOnly={cell.isPartialHint}
                />
                {!cell.isRevealed && !cell.isPartialHint && cell.letter && (
                  <button
                    onClick={() => onHintRequest(rowIndex, colIndex)}
                    className="absolute -right-6 top-1/2 -translate-y-1/2 text-xs bg-blue-500 text-white p-1 rounded hover:bg-blue-600"
                    title="Get hint"
                  >
                    ?
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
