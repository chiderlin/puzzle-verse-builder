import { useState, useEffect } from "react";
import { CrosswordGrid } from "@/components/CrosswordGrid";
import { ClueList } from "@/components/ClueList";
import { AuthForm } from "@/components/AuthForm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const defaultPuzzle = {
  grid: [
    [{ letter: "", number: 1 }, { letter: "", number: 2 }, { letter: "" }],
    [{ letter: "", number: 3 }, { letter: "" }, { letter: "" }],
    [{ letter: "", number: 4 }, { letter: "" }, { letter: "" }],
  ],
  across: [
    { number: 1, text: "Loading..." },
    { number: 3, text: "Loading..." },
    { number: 4, text: "Loading..." },
  ],
  down: [
    { number: 1, text: "Loading..." },
    { number: 2, text: "Loading..." },
  ],
};

const Index = () => {
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
        isRevealed: Math.random() < 0.3, // Randomly reveal 30% of cells initially
      }))
    )
  );

  const [activeClue, setActiveClue] = useState<{ direction: "across" | "down"; number: number } | null>(
    null
  );

  const generateNewPuzzle = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-crossword');
      
      if (error) throw error;

      setPuzzle(data);

      const findWordStarts = () => {
        const wordStarts = new Set();
        data.across.forEach((clue: { number: number }) => {
          wordStarts.add(clue.number);
        });
        data.down.forEach((clue: { number: number }) => {
          wordStarts.add(clue.number);
        });
        return wordStarts;
      };

      const isPartOfWordStart = (row: number, col: number, grid: any[][]) => {
        const cell = grid[row][col];
        if (!cell.letter) return false;
        
        if (cell.number) return true;
        if (row > 0 && grid[row - 1][col]?.number) return true;
        if (col > 0 && grid[row][col - 1]?.number) return true;
        
        return false;
      };

      const processedGrid = data.grid.map((row: any[], rowIndex: number) =>
        row.map((cell: any, colIndex: number) => {
          const isWordStart = isPartOfWordStart(rowIndex, colIndex, data.grid);
          return {
            ...cell,
            isActive: false,
            isHighlighted: false,
            isRevealed: Math.random() < 0.2, // Reduce random reveals to 20%
            isPartialHint: isWordStart, // Show first letters of words as hints
          };
        })
      );

      setGrid(processedGrid);

      toast({
        title: "New Puzzle Generated",
        description: "Start solving the new crossword puzzle! First letters are revealed as hints.",
      });
    } catch (error) {
      console.error('Error generating puzzle:', error);
      toast({
        title: "Error",
        description: "Failed to generate new puzzle",
        variant: "destructive",
      });
    }
  };

  const handleHintRequest = (row: number, col: number) => {
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

  useEffect(() => {
    if (isAuthenticated) {
      generateNewPuzzle();
    }
  }, [isAuthenticated]);

  const handleAuth = async (email: string, password: string) => {
    try {
      const { error } = authMode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

      if (error) throw error;

      if (authMode === "register") {
        toast({
          title: "Success",
          description: "Please check your email to confirm your account",
        });
      }
    } catch (error) {
      console.error("Auth error:", error);
      throw error;
    }
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

  const handleClueClick = (direction: "across" | "down", number: number) => {
    setActiveClue({ direction, number });
  };

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
            onSubmit={handleAuth}
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
              onClick={generateNewPuzzle}
            >
              Generate New Puzzle
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
};

export default Index;
