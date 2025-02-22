
import { Button } from "@/components/ui/button";
import { SaveIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";

interface PuzzleControlsProps {
  onSignOut: () => void;
  onGenerateNew: () => void;
  onSaveProgress: () => void;
  onRevealAnswer: () => void;
  onHideAnswer: () => void;
  isGenerating: boolean;
  isSaving: boolean;
}

export const PuzzleControls = ({
  onSignOut,
  onGenerateNew,
  onSaveProgress,
  onRevealAnswer,
  onHideAnswer,
  isGenerating,
  isSaving
}: PuzzleControlsProps) => {
  const [showingAnswers, setShowingAnswers] = useState(false);

  const handleToggleAnswers = () => {
    setShowingAnswers(!showingAnswers);
    if (!showingAnswers) {
      onRevealAnswer();
    } else {
      onHideAnswer();
    }
  };

  return (
    <div className="text-center mb-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Crossword Puzzle</h1>
      <p className="text-slate-600">Challenge your mind with our daily crossword</p>
      <div className="flex justify-center gap-4 mt-4">
        <Button
          variant="outline"
          onClick={onSignOut}
        >
          Sign Out
        </Button>
        <Button
          onClick={onGenerateNew}
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
          onClick={onSaveProgress}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          <SaveIcon className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Progress"}
        </Button>
        <Button
          onClick={handleToggleAnswers}
          variant="secondary"
          className="flex items-center gap-2"
        >
          {showingAnswers ? (
            <>
              <EyeOffIcon className="h-4 w-4" />
              Hide Answer
            </>
          ) : (
            <>
              <EyeIcon className="h-4 w-4" />
              Show Answer
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
