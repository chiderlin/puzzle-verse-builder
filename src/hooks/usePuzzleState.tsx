
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { GridCell, Puzzle } from "@/types/puzzle";
import { supabase } from "@/integrations/supabase/client";
import { defaultPuzzle } from "@/data/defaultPuzzle";
import { loadUserProgress, savePuzzleProgress, deleteUserPuzzles, generateNewCrossword } from "@/lib/puzzleDb";
import { initializeGrid, processLoadedGrid } from "@/utils/puzzleUtils";

export const usePuzzleState = (isAuthenticated: boolean) => {
  const [puzzle, setPuzzle] = useState<Puzzle>(defaultPuzzle);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPuzzleId, setCurrentPuzzleId] = useState<string | null>(null);
  const { toast } = useToast();
  const [grid, setGrid] = useState<GridCell[][]>(initializeGrid(defaultPuzzle.grid));

  const loadSavedProgress = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.id) throw new Error('User not found');

      const progress = await loadUserProgress(user.user.id);

      if (progress && progress.grid_state) {
        const processedGrid = processLoadedGrid(progress.grid_state as unknown as GridCell[][]);
        if (processedGrid) {
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

      const result = await savePuzzleProgress(user.user.id, grid, currentPuzzleId);
      if (result && !currentPuzzleId) {
        setCurrentPuzzleId(result.id);
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

      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.id) throw new Error('User not found');

      await deleteUserPuzzles(user.user.id, currentPuzzleId);
      
      setCurrentPuzzleId(null);
      setPuzzle({ grid: [], across: [], down: [] });
      setGrid([]);
      
      const data = await generateNewCrossword();
      
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

      const processedGrid = data.grid.map((row: any[], rowIndex: number) =>
        row.map((cell: any, colIndex: number) => ({
          ...cell,
          isActive: false,
          isHighlighted: false,
          isRevealed: false,
          isPartialHint: false,
        }))
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
      setGrid(initializeGrid(defaultPuzzle.grid));
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
