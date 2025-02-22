import { useState, useEffect } from "react";
import { CrosswordGrid } from "@/components/CrosswordGrid";
import { ClueList } from "@/components/ClueList";
import { AuthForm } from "@/components/AuthForm";
import { PuzzleControls } from "@/components/PuzzleControls";
import { usePuzzleState } from "@/hooks/usePuzzleState";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const {
    puzzle,
    grid,
    setGrid,
    isGenerating,
    isSaving,
    saveProgress,
    generateNewPuzzle,
  } = usePuzzleState(isAuthenticated);

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

  const handleHintRequest = (row: number, col: number) => {
    const newGrid = [...grid];
    newGrid[row][col] = {
      ...newGrid[row][col],
      isRevealed: true,
    };
    setGrid(newGrid);
  };

  const handleRevealAnswer = () => {
    const newGrid = grid.map(row =>
      row.map(cell => ({
        ...cell,
        isRevealed: cell.letter !== ""
      }))
    );
    setGrid(newGrid);
    toast({
      title: "Answers Revealed",
      description: "All puzzle answers have been revealed.",
    });
  };

  const handleHideAnswer = () => {
    const newGrid = grid.map(row =>
      row.map(cell => ({
        ...cell,
        isRevealed: false
      }))
    );
    setGrid(newGrid);
    toast({
      title: "Answers Hidden",
      description: "Continue solving the puzzle!",
    });
  };

  const handleAuth = async (email: string, password: string) => {
    try {
      const { error } = authMode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

      if (error) throw error;
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
      userCurrentValue: value,
    };
    setGrid(newGrid);
  };

  const handleSubmit = async () => {
    let score = 0;
    
    grid.forEach(row => {
      row.forEach(cell => {
        if (cell.letter && cell.letter === cell.userCurrentValue) {
          score += 5;
        }
      });
    });

    try {
      const { data: existingProgress } = await supabase
        .from('puzzle_progress')
        .select('id')
        .limit(1)
        .single();

      if (existingProgress) {
        await supabase
          .from('puzzle_progress')
          .update({
            grid_state: grid,
            score: score,
            submitted: true,
            last_updated: new Date().toISOString(),
          })
          .eq('id', existingProgress.id);
      } else {
        await supabase
          .from('puzzle_progress')
          .insert({
            grid_state: grid,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            score: score,
            submitted: true,
          });
      }

      setIsSubmitted(true);
      toast({
        title: "Puzzle Submitted!",
        description: `Your score: ${score} points`,
      });
    } catch (error) {
      console.error('Error submitting puzzle:', error);
      toast({
        title: "Error",
        description: "Failed to submit puzzle",
        variant: "destructive",
      });
    }
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
        <PuzzleControls
          onSignOut={() => supabase.auth.signOut()}
          onGenerateNew={generateNewPuzzle}
          onSaveProgress={saveProgress}
          onRevealAnswer={handleRevealAnswer}
          onHideAnswer={handleHideAnswer}
          onSubmit={handleSubmit}
          isGenerating={isGenerating}
          isSaving={isSaving}
          isSubmitted={isSubmitted}
        />

        {isGenerating ? (
          <div className="grid place-items-center h-[600px]">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-600 animate-pulse">Generating new puzzle...</p>
            </div>
          </div>
        ) : (
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
                  clues={puzzle.across}
                  onClueClick={() => {}}
                />
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <ClueList
                  title="Down"
                  clues={puzzle.down}
                  onClueClick={() => {}}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
