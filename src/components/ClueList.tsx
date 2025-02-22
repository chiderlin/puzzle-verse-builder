
interface Clue {
  number: number;
  text: string;
  isActive: boolean;
}

interface ClueListProps {
  title: string;
  clues: Clue[];
  onClueClick: (number: number) => void;
}

export const ClueList = ({ title, clues, onClueClick }: ClueListProps) => {
  return (
    <div className="animate-slide-in">
      <h2 className="text-lg font-semibold mb-3 text-slate-900">{title}</h2>
      <div className="clue-list">
        {clues.map((clue) => (
          <div
            key={clue.number}
            className={`clue-item ${clue.isActive ? "active" : ""}`}
            onClick={() => onClueClick(clue.number)}
          >
            <span className="font-medium text-slate-700">{clue.number}. </span>
            <span className="text-slate-600">{clue.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
