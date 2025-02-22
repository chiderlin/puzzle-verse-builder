
export interface GridCell {
  letter: string;
  number: number | null;
  isActive: boolean;
  isHighlighted: boolean;
  isRevealed: boolean;
  isPartialHint?: boolean;
  userCurrentValue?: string;
}

export interface Clue {
  number: number;
  text: string;
  length: number;
}

export interface Puzzle {
  grid: Array<Array<{ letter: string; number: number | null; }>>;
  across: Clue[];
  down: Clue[];
}
