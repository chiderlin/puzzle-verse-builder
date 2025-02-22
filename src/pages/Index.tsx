
import { useState, useEffect } from "react";
import { CrosswordGrid } from "@/components/CrosswordGrid";
import { ClueList } from "@/components/ClueList";
import { AuthForm } from "@/components/AuthForm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

export default function Index() {
  const [puzzle, setPuzzle] = useState(defaultPuzzle);
  const [gameGrid, setGameGrid] = useState<any[][]>([]);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const { toast } = useToast();

  useEffect(() => {
    setGameGrid(
      puzzle.grid.map((row) =>
        row.map((cell) => ({
          ...cell,
          isActive: false,
          isHighlighted: false,
          isRevealed: false,
        }))
      )
    );
  }, [puzzle]);

  const handleCellClick = (row: number, col: number) => {
    setGameGrid((prevGrid) =>
      prevGrid.map((gridRow, rowIndex) =>
        gridRow.map((cell, colIndex) => ({
          ...cell,
          isActive: rowIndex === row && colIndex === col,
          isHighlighted:
            rowIndex === row || colIndex === col
              ? cell.letter !== ""
              : false,
        }))
      )
    );
  };

  const handleCellChange = (row: number, col: number, value: string) => {
    setGameGrid((prevGrid) =>
      prevGrid.map((gridRow, rowIndex) =>
        gridRow.map((cell, colIndex) => {
          if (rowIndex === row && colIndex === col) {
            return {
              ...cell,
              isRevealed: false,
              isPartialHint: false,
              value,
            };
          }
          return cell;
        })
      )
    );
  };

  const handleHintRequest = async (row: number, col: number) => {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use hints",
        variant: "destructive",
      });
      return;
    }

    setGameGrid((prevGrid) =>
      prevGrid.map((gridRow, rowIndex) =>
        gridRow.map((cell, colIndex) => {
          if (rowIndex === row && colIndex === col) {
            return {
              ...cell,
              isPartialHint: true,
            };
          }
          return cell;
        })
      )
    );
  };

  const handleRevealGrid = async () => {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to reveal the solution",
        variant: "destructive",
      });
      return;
    }

    setGameGrid((prevGrid) =>
      prevGrid.map((row) =>
        row.map((cell) => ({
          ...cell,
          isRevealed: true,
        }))
      )
    );
  };

  const handleAuthSubmit = async (email: string, password: string) => {
    try {
      if (authMode === "login") {
        await supabase.auth.signInWithPassword({ email, password });
      } else {
        await supabase.auth.signUp({ email, password });
      }
    } catch (error) {
      console.error("Auth error:", error);
      throw error;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-2/3">
          <CrosswordGrid
            grid={gameGrid}
            onCellClick={handleCellClick}
            onCellChange={handleCellChange}
            onHintRequest={handleHintRequest}
          />
          <div className="mt-4 flex justify-center">
            <Button onClick={handleRevealGrid}>Reveal Solution</Button>
          </div>
        </div>
        <div className="w-full md:w-1/3">
          <AuthForm 
            mode={authMode}
            onSubmit={handleAuthSubmit}
            onToggle={() => setAuthMode(authMode === "login" ? "register" : "login")}
          />
          <div className="mt-8">
            <ClueList across={puzzle.across} down={puzzle.down} />
          </div>
        </div>
      </div>
    </div>
  );
}
