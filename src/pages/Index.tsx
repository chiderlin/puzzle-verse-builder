
import { useState, useEffect } from "react";
import { CrosswordGrid } from "@/components/CrosswordGrid";
import { ClueList } from "@/components/ClueList";
import { AuthForm } from "@/components/AuthForm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SaveIcon } from "lucide-react";

const defaultPuzzle = {
  grid: [
    [
      { letter: "C", number: 1 }, 
      { letter: "H", number: null }, 
      { letter: "A", number: null }, 
      { letter: "T", number: null },
      { letter: "", number: null }
    ],
    [
      { letter: "O", number: 2 }, 
      { letter: "U", number: null }, 
      { letter: "T", number: null },
      { letter: "E", number: 3 },
      { letter: "A", number: null }
    ],
    [
      { letter: "T", number: null }, 
      { letter: "B", number: 4 }, 
      { letter: "I", number: null }, 
      { letter: "A", number: null },
      { letter: "", number: null }
    ],
    [
      { letter: "", number: null }, 
      { letter: "I", number: null }, 
      { letter: "M", number: null }, 
      { letter: "", number: null },
      { letter: "", number: null }
    ],
    [
      { letter: "", number: null }, 
      { letter: "T", number: null }, 
      { letter: "", number: null }, 
      { letter: "", number: null },
      { letter: "", number: null }
    ]
  ],
  across: [
    { number: 1, text: "To have a friendly conversation (British slang)", length: 4 },
    { number: 2, text: "Morning beverage served at 4 o'clock (British tradition)", length: 3 },
    { number: 3, text: "Drink made from leaves (British staple)", length: 3 },
    { number: 4, text: "To consume food or drink", length: 3 }
  ],
  down: [
    { number: 1, text: "A warm, comfortable house (British term)", length: 3 },
    { number: 2, text: "A traditional British pub", length: 5 },
    { number: 3, text: "Another word for 'yes' in British English", length: 3 }
  ],
};

interface GridCell {
  letter: string;
  number: number | null;
  isActive: boolean;
  isHighlighted: boolean;
  isRevealed: boolean;
  isPartialHint?: boolean;
}

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [puzzle, setPuzzle] = useState(defaultPuzzle);
  const { toast } = useToast();
  const [activeClue, setActiveClue] = useState<{ direction: "across" | "down"; number: number } | null>(null);
  
  const [grid, setGrid] = useState<GridCell[][]>(
    defaultPuzzle.grid.map((row) =>
      row.map((cell) => ({
        ...cell,
        isActive: false,
        isHighlighted: false,
        isRevealed: false,
      }))
    )
  );

  const loadSavedProgress = async () => {
    try {
      const { data: progress, error } = await supabase
        .from('puzzle_progress')
        .select('grid_state')
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // No rows returned
          throw error;
        }
        return;
      }

      if (progress?.grid_state) {
        const loadedGrid = progress.grid_state as unknown as GridCell[][];
        if (Array.isArray(loadedGrid) && loadedGrid.length > 0) {
          setGrid(loadedGrid);
          toast({
            title: "Progress Loaded",
            description: "Your previous game progress has been restored.",
          });
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
      toast({
        title: "Error",
        description: "Failed to load saved progress",
        variant: "destructive",
      });
    }
  };

  const saveProgress = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Error",
        description: "Please sign in to save your progress",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
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
            grid_state: grid as unknown as Json,
            last_updated: new Date().toISOString(),
          })
          .eq('id', existingProgress.id);
      } else {
        await supabase
          .from('puzzle_progress')
          .insert({
            grid_state: grid as unknown as Json,
            user_id: (await supabase.auth.getUser()).data.user?.id,
          });
      }

      toast({
        title: "Progress Saved",
        description: "Your game progress has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving progress:', error);
      toast({
        title: "Error",
        description: "Failed to save progress",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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
      loadSavedProgress().then(() => {
        if (!grid.length) {
          generateNewPuzzle();
        }
      });
    }
  }, [isAuthenticated]);

  const generateNewPuzzle = async () => {
    try {
      setIsGenerating(true);
      setPuzzle({ grid: [], across: [], down: [] });
      setGrid([]);
      
      const { data, error } = await supabase.functions.invoke('generate-crossword');
      
      if (error) throw error;

      const acrossWithLengths = data.across.map((clue: any) => {
        const row = data.grid.findIndex((r: any[]) => 
          r.some((cell: any) => cell.number === clue.number)
        );
        const col = data.grid[row].findIndex((cell: any) => 
          cell.number === clue.number
        );
        let length = 0;
        let currentCol = col;
        while (currentCol < data.grid[row].length && data.grid[row][currentCol].letter) {
          length++;
          currentCol++;
        }
        return { ...clue, length };
      });

      const downWithLengths = data.down.map((clue: any) => {
        const row = data.grid.findIndex((r: any[]) => 
          r.some((cell: any) => cell.number === clue.number)
        );
        const col = data.grid[row].findIndex((cell: any) => 
          cell.number === clue.number
        );
        let length = 0;
        let currentRow = row;
        while (currentRow < data.grid.length && data.grid[currentRow][col].letter) {
          length++;
          currentRow++;
        }
        return { ...clue, length };
      });

      setPuzzle({
        ...data,
        across: acrossWithLengths,
        down: downWithLengths
      });

      const getWordAt = (startRow: number, startCol: number, direction: "across" | "down"): string => {
        let word = "";
        let row = startRow;
        let col = startCol;
        
        while (row < data.grid.length && col < data.grid[row].length && data.grid[row][col].letter) {
          word += data.grid[row][col].letter;
          if (direction === "across") col++;
          else row++;
        }
        
        return word;
      };

      const generateScatteredHints = (word: string): boolean[] => {
        const length = word.length;
        const hints = new Array(length).fill(false);
        
        if (length === 3) {
          const randomSkip = Math.floor(Math.random() * 3);
          for (let i = 0; i < 3; i++) {
            if (i !== randomSkip) hints[i] = true;
          }
          return hints;
        }

        const numHints = Math.floor(Math.random() * 2) + 2;
        const availablePositions = Array.from({length}, (_, i) => i);
        
        const endPos = Math.random() < 0.5 ? 0 : length - 1;
        hints[endPos] = true;
        availablePositions.splice(availablePositions.indexOf(endPos), 1);

        for (let i = 1; i < numHints && availablePositions.length > 0; i++) {
          const validPositions = availablePositions.filter(pos => 
            !hints[pos - 1] && !hints[pos + 1]
          );
          
          if (validPositions.length === 0) break;
          
          const randomIndex = Math.floor(Math.random() * validPositions.length);
          const pos = validPositions[randomIndex];
          hints[pos] = true;
          availablePositions.splice(availablePositions.indexOf(pos), 1);
        }

        return hints;
      };

      const processedGrid = data.grid.map((row: any[], rowIndex: number) =>
        row.map((cell: any, colIndex: number) => {
          let isHint = false;

          if (cell.number) {
            const acrossWord = getWordAt(rowIndex, colIndex, "across");
            if (acrossWord.length > 1) {
              const acrossHints = generateScatteredHints(acrossWord);
              if (acrossHints[0]) isHint = true;
            }

            const downWord = getWordAt(rowIndex, colIndex, "down");
            if (downWord.length > 1) {
              const downHints = generateScatteredHints(downWord);
              if (downHints[0]) isHint = true;
            }
          } else {
            let isPartOfWord = false;
            let relativePos = 0;

            if (colIndex > 0 && data.grid[rowIndex][colIndex - 1].letter) {
              isPartOfWord = true;
              let col = colIndex;
              while (col > 0 && data.grid[rowIndex][col - 1].letter) {
                col--;
                relativePos++;
              }
              const word = getWordAt(rowIndex, col, "across");
              const hints = generateScatteredHints(word);
              if (hints[relativePos]) isHint = true;
            }

            if (rowIndex > 0 && data.grid[rowIndex - 1][colIndex].letter) {
              isPartOfWord = true;
              let row = rowIndex;
              while (row > 0 && data.grid[row - 1][colIndex].letter) {
                row--;
                relativePos++;
              }
              const word = getWordAt(row, colIndex, "down");
              const hints = generateScatteredHints(word);
              if (hints[relativePos]) isHint = true;
            }
          }

          return {
            ...cell,
            isActive: false,
            isHighlighted: false,
            isRevealed: false,
            isPartialHint: isHint,
          };
        })
      );

      setGrid(processedGrid);

      toast({
        title: "New Puzzle Generated",
        description: "Start solving! Random letter hints are provided for each word.",
      });
    } catch (error) {
      console.error('Error generating puzzle:', error);
      toast({
        title: "Error",
        description: "Failed to generate new puzzle",
        variant: "destructive",
      });
      setPuzzle(defaultPuzzle);
      setGrid(defaultPuzzle.grid.map((row) =>
        row.map((cell) => ({
          ...cell,
          isActive: false,
          isHighlighted: false,
          isRevealed: false,
        }))
      ));
    } finally {
      setIsGenerating(false);
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
              disabled={isGenerating}
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Generating...
                </span>
              ) : (
                "Generate New Puzzle"
              )}
            </Button>
            <Button
              onClick={saveProgress}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <SaveIcon className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Progress"}
            </Button>
          </div>
        </div>

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
                  onClueClick={(number) => handleClueClick("across", number)}
                />
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <ClueList
                  title="Down"
                  clues={puzzle.down}
                  onClueClick={(number) => handleClueClick("down", number)}
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
