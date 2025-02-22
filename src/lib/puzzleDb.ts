
import { supabase } from "@/integrations/supabase/client";
import { GridCell } from "@/types/puzzle";
import { Json } from "@/integrations/supabase/types";

export const loadUserProgress = async (userId: string) => {
  const { data: progress, error } = await supabase
    .from('puzzle_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('submitted', false)
    .maybeSingle();

  if (error) throw error;
  return progress;
};

export const savePuzzleProgress = async (userId: string, grid: GridCell[][], puzzleId: string | null) => {
  if (puzzleId) {
    const { error } = await supabase
      .from('puzzle_progress')
      .update({
        grid_state: grid as unknown as Json,
        last_updated: new Date().toISOString(),
      })
      .eq('id', puzzleId);

    if (error) throw error;
    return { id: puzzleId };
  } else {
    const { data, error } = await supabase
      .from('puzzle_progress')
      .insert({
        grid_state: grid as unknown as Json,
        user_id: userId,
        submitted: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

export const deleteUserPuzzles = async (userId: string, puzzleId?: string) => {
  // Delete all unsubmitted puzzles for the user
  const { error: deleteError } = await supabase
    .from('puzzle_progress')
    .delete()
    .eq('user_id', userId)
    .eq('submitted', false);

  if (deleteError) throw deleteError;

  // If specific puzzleId provided, ensure it's deleted
  if (puzzleId) {
    const { error: specificDeleteError } = await supabase
      .from('puzzle_progress')
      .delete()
      .eq('id', puzzleId);

    if (specificDeleteError) throw specificDeleteError;
  }
};

export const generateNewCrossword = async () => {
  const { data, error } = await supabase.functions.invoke('generate-crossword');
  if (error) throw error;
  return data;
};
