
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const prompt = `Create a crossword puzzle themed around British culture and slang. The puzzle should be 5x5 or smaller.

Requirements:
1. Each word must be a real English word, preferably related to British culture, lifestyle, or slang
2. All words must intersect properly with shared letters
3. Grid size should be compact and not exceed 5x5
4. Include clear, easy-to-understand clues with British themes
5. Structure must be valid with proper word intersections

Return ONLY a JSON object with this exact structure (no other text):
{
  "grid": [
    [
      {"letter": "C", "number": 1}, 
      {"letter": "H", "number": null}, 
      {"letter": "A", "number": null}, 
      {"letter": "T", "number": null},
      {"letter": "", "number": null}
    ],
    [
      {"letter": "O", "number": 2}, 
      {"letter": "U", "number": null}, 
      {"letter": "T", "number": null},
      {"letter": "E", "number": null},
      {"letter": "A", "number": null}
    ]
  ],
  "across": [
    {
      "number": 1,
      "text": "A clear clue for the word (British context)",
      "length": 4
    }
  ],
  "down": [
    {
      "number": 1,
      "text": "A clear clue for the word (British context)",
      "length": 3
    }
  ]
}

Important rules:
1. Only return valid JSON, no other text or explanation
2. Empty cells should have empty strings for letters
3. Numbers should only be at the start of words
4. Each word must share at least one letter with another word
5. The grid must be a valid crossword layout
6. All clues must relate to British culture or language
7. Include the exact length of each word in the clues`;

    console.log('Sending prompt to Gemini API:', prompt);

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Gemini API error:', data);
      throw new Error(data.error?.message || 'Failed to generate crossword');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    
    try {
      // Extract JSON from the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No valid JSON found in response:', generatedText);
        throw new Error('No valid JSON found in response');
      }
      
      const puzzleData = JSON.parse(jsonMatch[0]);

      // Validate the structure
      if (!puzzleData.grid || !Array.isArray(puzzleData.grid) ||
          !puzzleData.across || !Array.isArray(puzzleData.across) ||
          !puzzleData.down || !Array.isArray(puzzleData.down)) {
        throw new Error('Invalid puzzle structure');
      }

      // Validate grid cells
      puzzleData.grid.forEach((row: any[], rowIndex: number) => {
        if (!Array.isArray(row)) throw new Error(`Invalid row at index ${rowIndex}`);
        row.forEach((cell: any, colIndex: number) => {
          if (typeof cell.letter !== 'string') {
            throw new Error(`Invalid letter at [${rowIndex},${colIndex}]`);
          }
          if (cell.number !== null && typeof cell.number !== 'number') {
            throw new Error(`Invalid number at [${rowIndex},${colIndex}]`);
          }
        });
      });

      // Validate clues
      const validateClues = (clues: any[], type: string) => {
        clues.forEach((clue: any, index: number) => {
          if (typeof clue.number !== 'number' ||
              typeof clue.text !== 'string' ||
              typeof clue.length !== 'number') {
            throw new Error(`Invalid ${type} clue at index ${index}`);
          }
        });
      };

      validateClues(puzzleData.across, 'across');
      validateClues(puzzleData.down, 'down');

      console.log('Successfully generated puzzle:', puzzleData);
      
      return new Response(JSON.stringify(puzzleData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error processing puzzle data:', error);
      throw new Error('Failed to generate valid crossword puzzle');
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
