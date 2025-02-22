
import { useState, useEffect } from "react";
import { CrosswordGrid } from "@/components/CrosswordGrid";
import { ClueList } from "@/components/ClueList";
import { AuthForm } from "@/components/AuthForm";
import { PuzzleControls } from "@/components/PuzzleControls";
import { Leaderboard } from "@/components/Leaderboard";
import { usePuzzleState } from "@/hooks/usePuzzleState";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const { toast } = useToast();
  
  const {
    puzzle,
    grid,
    setGrid,
    isGenerating,
    isSaving,
    saveProgress,
    generateNewPuzzle
  } = usePuzzleState(isAuthenticated);

  const fetchTotalScore = async (userId: string) => {
    try {
      const { data: puzzleScores, error: puzzleError } = await supabase
        .from('puzzle_progress')
        .select('score')
        .eq('user_id', userId)
        .eq('submitted', true);

      if (puzzleError) throw puzzleError;

      const calculatedTotal = puzzleScores.reduce((sum, entry) => sum + (entry.score || 0), 0);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ total_score: calculatedTotal })
        .eq('id', userId);

      if (updateError) throw updateError;

      setTotalScore(calculatedTotal);
    } catch (error) {
      console.error('Error fetching total score:', error);
      toast({
        title: "Error",
        description: "Failed to fetch total score",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
      if (session?.user) {
        fetchTotalScore(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        fetchTotalScore(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleHintRequest = (row: number, col: number) => {
    const newGrid = [...grid];
    newGrid[row][col] = {
      ...newGrid[row][col],
      isRevealed: true
    };
    setGrid(newGrid);
  };

  const handleRevealAnswer = () => {
    const newGrid = grid.map(row => row.map(cell => ({
      ...cell,
      isRevealed: cell.letter !== ""
    })));
    setGrid(newGrid);
    toast({
      title: "Answers Revealed",
      description: "All puzzle answers have been revealed."
    });
  };

  const handleHideAnswer = () => {
    const newGrid = grid.map(row => row.map(cell => ({
      ...cell,
      isRevealed: false
    })));
    setGrid(newGrid);
    toast({
      title: "Answers Hidden",
      description: "Continue solving the puzzle!"
    });
  };

  const handleAuth = async (email: string, password: string) => {
    try {
      const {
        error
      } = authMode === "login" ? await supabase.auth.signInWithPassword({
        email,
        password
      }) : await supabase.auth.signUp({
        email,
        password
      });
      if (error) throw error;
    } catch (error) {
      console.error("Auth error:", error);
      throw error;
    }
  };

  const handleCellClick = (row: number, col: number) => {
    const newGrid = grid.map((r, rowIndex) => r.map((cell, colIndex) => ({
      ...cell,
      isActive: row === rowIndex && col === colIndex,
      isHighlighted: false
    })));
    setGrid(newGrid);
  };

  const handleCellChange = (row: number, col: number, value: string) => {
    const newGrid = [...grid];
    newGrid[row][col] = {
      ...newGrid[row][col],
      userCurrentValue: value
    };
    setGrid(newGrid);
  };

  const handleSubmit = async () => {
    let score = 0;
    let totalCells = 0;
    
    grid.forEach(row => {
      row.forEach(cell => {
        if (cell.letter) {
          totalCells++;
          if (cell.letter === cell.userCurrentValue) {
            score += 5;
          }
        }
      });
    });

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.id) throw new Error('User not found');

      const { error: submitError } = await supabase
        .from('puzzle_progress')
        .insert({
          grid_state: grid as unknown as Json,
          user_id: user.user.id,
          score: score,
          submitted: true,
          completed_at: new Date().toISOString()
        });

      if (submitError) throw submitError;

      await fetchTotalScore(user.user.id);
      
      setIsSubmitted(true);
      toast({
        title: "Puzzle Submitted Successfully!",
        description: `Your score: ${score} points out of ${totalCells * 5} possible points. Total career score: ${totalScore + score} points`,
      });
    } catch (error) {
      console.error('Error submitting puzzle:', error);
      toast({
        title: "Error",
        description: "Failed to submit puzzle. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-600">Loading...</div>
      </div>;
  }

  if (!isAuthenticated) {
    return <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Crossword Puzzle</h1>
            <p className="text-slate-600">Sign in to start solving puzzles</p>
          </div>
          <AuthForm mode={authMode} onSubmit={handleAuth} onToggle={() => setAuthMode(authMode === "login" ? "register" : "login")} />
        </div>
      </div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[90rem] mx-auto">
        <div className="text-center mb-4">
          <p className="font-semibold text-4xl text-lime-600">Total Career Score: {totalScore} points</p>
        </div>
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <CrosswordGrid 
                  grid={grid} 
                  onCellClick={handleCellClick} 
                  onCellChange={handleCellChange} 
                  onHintRequest={handleHintRequest} 
                />
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <Leaderboard />
              
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <ClueList title="Across" clues={puzzle.across} onClueClick={() => {}} />
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <ClueList title="Down" clues={puzzle.down} onClueClick={() => {}} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
