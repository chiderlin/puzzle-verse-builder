
import { useEffect, useRef } from "react";

interface CrosswordCell {
  letter: string;
  number?: number;
  isActive: boolean;
  isHighlighted: boolean;
  isRevealed?: boolean;
  isPartialHint?: boolean;
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
      
      if (value) {
        const nextInput = gridRef.current?.querySelector(
          `input[data-row="${row}"][data-col="${col + 1}"]`
        ) as HTMLInputElement;
        if (nextInput && !nextInput.readOnly) {
          nextInput.focus();
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
    const currentInput = e.target as HTMLInputElement;

    switch (e.key) {
      case "Backspace":
        if (currentInput.value === "") {
          e.preventDefault();
          onCellChange(row, col, "");
          const prevInput = gridRef.current?.querySelector(
            `input[data-row="${row}"][data-col="${col - 1}"]`
          ) as HTMLInputElement;
          if (prevInput && !prevInput.readOnly) {
            prevInput.focus();
          }
        }
        break;
      case "ArrowLeft":
        e.preventDefault();
        const leftInput = gridRef.current?.querySelector(
          `input[data-row="${row}"][data-col="${col - 1}"]`
        ) as HTMLInputElement;
        if (leftInput && !leftInput.readOnly) {
          leftInput.focus();
        }
        break;
      case "ArrowRight":
        e.preventDefault();
        const rightInput = gridRef.current?.querySelector(
          `input[data-row="${row}"][data-col="${col + 1}"]`
        ) as HTMLInputElement;
        if (rightInput && !rightInput.readOnly) {
          rightInput.focus();
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        const upInput = gridRef.current?.querySelector(
          `input[data-row="${row - 1}"][data-col="${col}"]`
        ) as HTMLInputElement;
        if (upInput && !upInput.readOnly) {
          upInput.focus();
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        const downInput = gridRef.current?.querySelector(
          `input[data-row="${row + 1}"][data-col="${col}"]`
        ) as HTMLInputElement;
        if (downInput && !downInput.readOnly) {
          downInput.focus();
        }
        break;
    }
  };

  return (
    <div 
      ref={gridRef} 
      className="grid gap-0 bg-white p-8 rounded-lg shadow-lg animate-fade-in max-w-4xl mx-auto"
    >
      {grid.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-0 justify-center">
          {row.map((cell, colIndex) => (
            <div 
              key={`${rowIndex}-${colIndex}`} 
              className={`
                relative border border-gray-900
                ${!cell.letter ? 'bg-gray-900' : 'bg-white'}
              `}
              style={{
                width: '60px',
                height: '60px'
              }}
            >
              {cell.letter && (
                <>
                  {cell.number && (
                    <div className="absolute top-0 left-0 w-full">
                      <span 
                        className="absolute top-1 left-1.5 text-sm font-bold text-gray-900 bg-white px-0.5"
                        style={{ fontSize: '14px' }}
                      >
                        {cell.number}
                      </span>
                      <div className="absolute top-0.5 right-1 text-[10px] text-gray-500">
                        {`R${rowIndex+1}C${colIndex+1}`}
                      </div>
                    </div>
                  )}
                  <div className="relative h-full">
                    <input
                      type="text"
                      maxLength={1}
                      className={`
                        w-full h-full text-center text-2xl font-bold pt-3
                        focus:outline-none focus:bg-blue-50
                        ${cell.isActive ? "bg-blue-50" : "bg-white"}
                        ${cell.isHighlighted ? "bg-yellow-50" : ""}
                        ${cell.isPartialHint ? "bg-gray-50" : ""}
                        uppercase
                      `}
                      style={{
                        border: 'none',
                        caretColor: 'transparent'
                      }}
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
                        className="absolute -right-7 top-1/2 -translate-y-1/2 text-xs bg-blue-500 text-white p-1 rounded hover:bg-blue-600"
                        title="Get hint"
                      >
                        ?
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
