
interface Clue {
  number: number;
  text: string;
  isActive?: boolean;
  length?: number;
}

interface ClueListProps {
  title: string;
  clues: Clue[];
  onClueClick: (number: number) => void;
}

export const ClueList = ({ title, clues = [], onClueClick }: ClueListProps) => {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <ul className="space-y-2">
        {(clues || []).map((clue) => (
          <li 
            key={clue.number}
            className={`
              cursor-pointer p-2 rounded
              ${clue.isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}
              transition-colors
            `}
            onClick={() => onClueClick(clue.number)}
          >
            <div className="flex gap-2 items-baseline">
              <span className="font-medium text-gray-700">{clue.number}.</span>
              <span className="flex-1">{clue.text}</span>
              <span className="text-sm text-gray-500">({clue.length || '?'})</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
