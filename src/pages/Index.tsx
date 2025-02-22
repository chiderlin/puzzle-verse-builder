
import { useState, useEffect } from "react";
import { CrosswordGrid } from "@/components/CrosswordGrid";
import { ClueList } from "@/components/ClueList";
import { AuthForm } from "@/components/AuthForm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Sample crossword data
const samplePuzzle = {
  grid: [
    [{ letter: "", number: 1 }, { letter: "", number: 2 }, { letter: "" }],
    [{ letter: "", number: 3 }, { letter: "" }, { letter: "" }],
    [{ letter: "", number: 4 }, { letter: "" }, { letter: "" }],
  ],
  across: [
    { number: 1, text: "First word across" },
    { number: 3, text: "Second word across" },
    { number: 4, text: "Third word across" },
  ],
  down: [
    { number: 1, text: "First word down" },
    { number: 2, text: "Second word down" },
  ],
};

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const { toast } = useToast();
  
  const [grid, setGrid] = useState(
    samplePuzzle.grid.map((row) =>
      row.map((cell) => ({
        ...cell,
        isActive: false,
        isHighlighted: false,
      }))
    )
  );

  const [activeClue, setActiveClue] = useState<{ direction: "across" | "down"; number: number } | null>(
    null
  );

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

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
        isHighlighted: false, // Reset highlighting
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
    // Here you would also highlight relevant cells
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
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => supabase.auth.signOut()}
          >
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <CrosswordGrid
                grid={grid}
                onCellClick={handleCellClick}
                onCellChange={handleCellChange}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <ClueList
                title="Across"
                clues={samplePuzzle.across.map((clue) => ({
                  ...clue,
                  isActive: activeClue?.direction === "across" && activeClue.number === clue.number,
                }))}
                onClueClick={(number) => handleClueClick("across", number)}
              />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <ClueList
                title="Down"
                clues={samplePuzzle.down.map((clue) => ({
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
