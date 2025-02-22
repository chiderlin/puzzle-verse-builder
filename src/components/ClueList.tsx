
interface Clue {
  number: number;
  text: string;
  isActive?: boolean;
  length?: number;
}

interface ClueListProps {
  across: Clue[];
  down: Clue[];
}

export const ClueList = ({ across, down }: ClueListProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-3">Across</h2>
        <ul className="space-y-2">
          {across.map((clue) => (
            <li 
              key={clue.number}
              className={`
                p-2 rounded
                ${clue.isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}
                transition-colors
              `}
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
      
      <div>
        <h2 className="text-lg font-semibold mb-3">Down</h2>
        <ul className="space-y-2">
          {down.map((clue) => (
            <li 
              key={clue.number}
              className={`
                p-2 rounded
                ${clue.isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}
                transition-colors
              `}
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
    </div>
  );
};
