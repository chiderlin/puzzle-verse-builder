
import { Puzzle } from "@/types/puzzle";

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
