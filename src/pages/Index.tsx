
import { useState, useEffect } from "react";
import { CrosswordGrid } from "@/components/CrosswordGrid";
import { ClueList } from "@/components/ClueList";
import { AuthForm } from "@/components/AuthForm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const defaultPuzzle = {
  grid: [
    [
      { letter: "M", number: 1 }, 
      { letter: "A", number: null }, 
      { letter: "K", number: null }, 
      { letter: "E", number: null }
    ],
    [
      { letter: "I", number: null }, 
      { letter: "", number: null }, 
      { letter: "", number: null },
      { letter: "", number: null }
    ],
    [
      { letter: "L", number: null }, 
      { letter: "", number: null }, 
      { letter: "", number: null },
      { letter: "", number: null }
    ],
    [
      { letter: "K", number: null }, 
      { letter: "", number: null }, 
      { letter: "", number: null },
      { letter: "", number: null }
    ]
  ],
  across: [
    { number: 1, text: "To create or produce something", length: 4 }
  ],
  down: [
    { number: 1, text: "A dairy product", length: 4 }
  ],
};

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [puzzle, setPuzzle] = useState(defaultPuzzle);
  const { toast } = useToast();
  
  const [grid, setGrid] = useState(
    defaultPuzzle.grid.map((row) =>
      row.map((cell) => ({
        ...cell,
        isActive: false,
        isHighlighted: false,
        isRevealed: false,
      }))
    )
  );

  const [activeClue, setActiveClue] = useState<{ direction: "across" | "down"; number: number } | null>(null);

  const generateHints = (wordLength: number) => {
    const hints: boolean[] = new Array(wordLength).fill(false);
    const numHints = wordLength === 3 ? 1 : Math.min(3, wordLength - 1);
    
    // Always reveal one random position
    let positions = Array.from({length: wordLength}, (_, i) => i);
    for (let i = 0; i < numHints; i++) {
      if (positions.length === 0) break;
      const randomIndex = Math.floor(Math.random() * positions.length);
      const position = positions[randomIndex];
      hints[position] = true;
      
      // Remove adjacent positions to avoid consecutive hints
      positions = positions.filter(p => 
        p !== position - 1 && p !== position && p !== position + 1
      );
    }
    
    return hints;
  };

  const handleRevealGrid = () => {
    setGrid(grid.map(row =>
      row.map(cell => ({
        ...cell,
        isRevealed: true
      }))
    ));
    
    toast({
      title: "Solution Revealed",
      description: "The complete solution has been shown.",
    });
  };

  const handleCellClick = (row: number, col: number) => {
    const newGrid = grid.map((r, rowIndex) =>
      r.map((cell, colIndex) => ({
        ...cell,
        isActive: row === rowIndex && col === colIndex,
        isHighlighted: false,
      }))
    );
    setGrid(newGrid);
  };

  const handleCellChange = (row: number, col: number, value: string) => {
    const newGrid = [...grid];
    newGrid[row][col] = {
      ...newGrid[row][col],
      letter: value,
    };
    setGrid(newGrid);
  };

  const handleHintRequest = (row: number, col: number) => {
    // Find word length and generate hints
    let wordLength = 0;
    let isAcross = false;
    
    // Check if part of across word
    let currentCol = col;
    while (currentCol < grid[row].length && grid[row][currentCol].letter) {
      wordLength++;
      currentCol++;
    }
    currentCol = col - 1;
    while (currentCol >= 0 && grid[row][currentCol].letter) {
      wordLength++;
      currentCol--;
    }
    
    if (wordLength > 1) isAcross = true;
    
    // If not part of across word, check down word
    if (!isAcross) {
      wordLength = 0;
      let currentRow = row;
      while (currentRow < grid.length && grid[currentRow][col].letter) {
        wordLength++;
        currentRow++;
      }
      currentRow = row - 1;
      while (currentRow >= 0 && grid[currentRow][col].letter) {
        wordLength++;
        currentRow--;
      }
    }
    
    const hints = generateHints(wordLength);
    
    // Apply hint for current cell
    const newGrid = [...grid];
    newGrid[row][col] = {
      ...newGrid[row][col],
      isRevealed: true,
    };
    setGrid(newGrid);
    
    toast({
      title: "Hint Revealed",
      description: `The letter at position (${row + 1}, ${col + 1}) is "${grid[row][col].letter}"`,
    });
  };

  const handleClueClick = (direction: "across" | "down", number: number) => {
    setActiveClue({ direction, number });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Crossword Puzzle</h1>
            <p className="text-slate-600">Sign in to start solving puzzles</p>
          </div>
          <AuthForm
            mode={authMode}
            onSubmit={async (email, password) => {
              try {
                if (authMode === "login") {
                  await supabase.auth.signInWithPassword({ email, password });
                } else {
                  await supabase.auth.signUp({ email, password });
                }
              } catch (error) {
                console.error("Auth error:", error);
                throw error;
              }
            }}
            onToggle={() => setAuthMode(authMode === "login" ? "register" : "login")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Crossword Puzzle</h1>
          <p className="text-slate-600">Challenge your mind with our daily crossword</p>
          <div className="flex justify-center gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() => supabase.auth.signOut()}
            >
              Sign Out
            </Button>
            <Button
              onClick={handleRevealGrid}
              variant="secondary"
            >
              Show Answer
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <CrosswordGrid
                grid={grid}
                onCellClick={handleCellClick}
                onCellChange={handleCellChange}
                onHintRequest={handleHintRequest}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <ClueList
                title="Across"
                clues={puzzle.across.map((clue) => ({
                  ...clue,
                  isActive: activeClue?.direction === "across" && activeClue.number === clue.number,
                }))}
                onClueClick={(number) => handleClueClick("across", number)}
              />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <ClueList
                title="Down"
                clues={puzzle.down.map((clue) => ({
                  ...clue,
                  isActive: activeClue?.direction === "down" && activeClue.number === clue.number,
                }))}
                onClueClick={(number) => handleClueClick("down", number)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
