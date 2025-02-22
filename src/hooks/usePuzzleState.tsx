
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GridCell, Puzzle } from "@/types/puzzle";
import { Json } from "@/integrations/supabase/types";

export const defaultPuzzle: Puzzle = {
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
  ]
};

export const usePuzzleState = (isAuthenticated: boolean) => {
  const [puzzle, setPuzzle] = useState<Puzzle>(defaultPuzzle);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPuzzleId, setCurrentPuzzleId] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [grid, setGrid] = useState<GridCell[][]>(
    defaultPuzzle.grid.map((row) =>
      row.map((cell) => ({
        ...cell,
        isActive: false,
        isHighlighted: false,
        isRevealed: false,
        userCurrentValue: "",
      }))
    )
  );

  const loadSavedProgress = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.id) throw new Error('User not found');

      const { data: progress, error } = await supabase
        .from('puzzle_progress')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('submitted', false)
        .maybeSingle();

      if (error) throw error;

      if (progress && progress.grid_state) {
        const loadedGrid = progress.grid_state as unknown as GridCell[][];
        if (Array.isArray(loadedGrid) && loadedGrid.length > 0) {
          const processedGrid = loadedGrid.map(row =>
            row.map(cell => ({
              ...cell,
              userCurrentValue: cell.userCurrentValue || ""
            }))
          );
          setGrid(processedGrid);
          setCurrentPuzzleId(progress.id);
          toast({
            title: "Progress Loaded",
            description: "Your previous game progress has been restored.",
          });
        }
      } else {
        await generateNewPuzzle();
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
      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.id) throw new Error('User not found');

      if (currentPuzzleId) {
        const { error: updateError } = await supabase
          .from('puzzle_progress')
          .update({
            grid_state: grid as unknown as Json,
            last_updated: new Date().toISOString(),
          })
          .eq('id', currentPuzzleId);

        if (updateError) throw updateError;
      } else {
        const { data: newPuzzle, error: insertError } = await supabase
          .from('puzzle_progress')
          .insert({
            grid_state: grid as unknown as Json,
            user_id: user.user.id,
            submitted: false
          })
          .select()
          .single();

        if (insertError) throw insertError;
        if (newPuzzle) {
          setCurrentPuzzleId(newPuzzle.id);
        }
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

  const generateNewPuzzle = async () => {
    try {
      setIsGenerating(true);

      // Get current user
      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.id) throw new Error('User not found');

      // Delete all unsubmitted puzzles for the user
      const { error: deleteError } = await supabase
        .from('puzzle_progress')
        .delete()
        .eq('user_id', user.user.id)
        .eq('submitted', false);

      if (deleteError) throw deleteError;

      // Also explicitly delete the puzzle with the specific ID if it exists
      if (currentPuzzleId) {
        const { error: specificDeleteError } = await supabase
          .from('puzzle_progress')
          .delete()
          .eq('id', currentPuzzleId);

        if (specificDeleteError) throw specificDeleteError;
      }
      
      setCurrentPuzzleId(null);
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

  useEffect(() => {
    if (isAuthenticated) {
      loadSavedProgress();
    }
  }, [isAuthenticated]);

  return {
    puzzle,
    grid,
    setGrid,
    isGenerating,
    isSaving,
    saveProgress,
    generateNewPuzzle,
  };
};
