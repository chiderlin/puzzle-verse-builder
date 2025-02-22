
import { GridCell } from "@/types/puzzle";

export const initializeGrid = (grid: Array<Array<{ letter: string; number: number | null; }>>) => {
  return grid.map((row) =>
    row.map((cell) => ({
      ...cell,
      isActive: false,
      isHighlighted: false,
      isRevealed: false,
      userCurrentValue: "",
    }))
  );
};

export const processLoadedGrid = (gridState: GridCell[][]) => {
  if (Array.isArray(gridState) && gridState.length > 0) {
    return gridState.map(row =>
      row.map(cell => ({
        ...cell,
        userCurrentValue: cell.userCurrentValue || ""
      }))
    );
  }
  return null;
};
