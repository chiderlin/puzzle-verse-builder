
import { useRef, useState } from "react";

interface CrosswordCell {
  letter: string;
  number?: number;
  isActive: boolean;
  isHighlighted: boolean;
  isRevealed?: boolean;
  isPartialHint?: boolean;
  userInput?: string;
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
  const [userInputs, setUserInputs] = useState<{ [key: string]: string }>({});

  const handleCellInput = (row: number, col: number, value: string) => {
    if (value.length <= 1 && /^[A-Za-z]$/.test(value) || value === "") {
      const upperValue = value.toUpperCase();
      setUserInputs(prev => ({
        ...prev,
        [`${row}-${col}`]: upperValue
      }));
      onCellChange(row, col, upperValue);
      
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
          setUserInputs(prev => ({
            ...prev,
            [`${row}-${col}`]: ""
          }));
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8 space-y-2">
        <div className="flex justify-center gap-8 items-center">
          <img 
            src="/lovable-uploads/c6fa1836-b744-4791-a522-0d9aff5c5f6b.png" 
            alt="Crown" 
            className="w-16 h-16"
          />
          <h1 className="text-4xl font-black tracking-tight">CROSSWORD PUZZLE</h1>
          <img 
            src="/lovable-uploads/c6fa1836-b744-4791-a522-0d9aff5c5f6b.png" 
            alt="Castle" 
            className="w-16 h-16"
          />
        </div>
        <p className="text-xl font-medium text-gray-600">CROSSWORD PUZZLE</p>
      </div>

      <div 
        ref={gridRef} 
        className="grid gap-px bg-gray-900 p-0.5 rounded-lg shadow-xl max-w-4xl mx-auto"
        style={{
          gridTemplateColumns: `repeat(${grid[0]?.length || 0}, minmax(0, 1fr))`
        }}
      >
        {grid.map((row, rowIndex) => (
          row.map((cell, colIndex) => (
            <div 
              key={`${rowIndex}-${colIndex}`} 
              className={`
                relative aspect-square
                ${!cell.letter ? 'bg-gray-900' : 'bg-white'}
                ${cell.isActive ? 'ring-2 ring-blue-500' : ''}
                ${cell.isHighlighted ? 'bg-yellow-50' : ''}
              `}
            >
              {cell.letter && (
                <>
                  {cell.number && (
                    <span 
                      className="absolute top-0.5 left-1 text-xs font-bold text-gray-900"
                    >
                      {cell.number}
                    </span>
                  )}
                  <input
                    type="text"
                    maxLength={1}
                    className={`
                      w-full h-full text-center text-lg font-bold
                      focus:outline-none focus:bg-blue-50
                      ${cell.isActive ? "bg-blue-50" : "bg-white"}
                      ${cell.isHighlighted ? "bg-yellow-50" : ""}
                      ${cell.isPartialHint ? "bg-gray-50" : ""}
                      ${cell.isRevealed && !userInputs[`${rowIndex}-${colIndex}`] ? "text-green-600" : "text-blue-600"}
                      uppercase
                    `}
                    style={{
                      border: 'none',
                      caretColor: 'transparent'
                    }}
                    value={
                      cell.isRevealed || cell.isPartialHint 
                        ? cell.letter 
                        : userInputs[`${rowIndex}-${colIndex}`] || ""
                    }
                    onChange={(e) => handleCellInput(rowIndex, colIndex, e.target.value)}
                    onClick={() => onCellClick(rowIndex, colIndex)}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                    data-row={rowIndex}
                    data-col={colIndex}
                    readOnly={cell.isRevealed || cell.isPartialHint}
                  />
                </>
              )}
            </div>
          ))
        ))}
      </div>
    </div>
  );
};
