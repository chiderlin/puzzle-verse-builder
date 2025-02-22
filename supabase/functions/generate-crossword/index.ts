
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
    const prompt = `Generate a crossword puzzle with these requirements:
    1. Create an irregularly shaped crossword puzzle (not necessarily square)
    2. Words can be of varying lengths (3-8 letters)
    3. Words must intersect properly sharing common letters
    4. Each word must connect to at least one other word
    5. Use common English words that are easily recognizable
    6. Each clue should be clear and appropriate for casual players
    7. The grid should be compact but can take any shape needed
    8. Return the result in JSON format with this structure:
    {
      "grid": [
        [{"letter": "C", "number": 1}, {"letter": "A", "number": null}, {"letter": "T", "number": null}],
        [{"letter": "O", "number": 2}, {"letter": "W", "number": null}, {"letter": "L", "number": null}],
        [{"letter": "W", "number": null}, {"letter": "", "number": null}, {"letter": "", "number": null}]
      ],
      "across": [
        {"number": 1, "text": "A feline pet"},
        {"number": 2, "text": "A nocturnal bird"}
      ],
      "down": [
        {"number": 1, "text": "A bovine female"}
      ]
    }
    
    Important rules:
    1. Make sure all words are properly connected
    2. The grid should be as compact as possible
    3. Empty cells should be represented with empty strings
    4. Each word must share at least one letter with another word
    5. Numbers should only appear at the start of words`;

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
    let puzzleData;
    
    try {
      // Extract JSON from the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No valid JSON found in response:', generatedText);
        throw new Error('No valid JSON found in response');
      }
      puzzleData = JSON.parse(jsonMatch[0]);

      // Validate the puzzle structure
      if (!puzzleData.grid || !puzzleData.across || !puzzleData.down) {
        throw new Error('Invalid puzzle structure');
      }

      // Clean up the grid data
      puzzleData.grid = puzzleData.grid.map((row: any[]) =>
        row.map((cell: any) => ({
          letter: cell.letter || "",
          number: cell.number || null,
        }))
      );

      // Validate word connections
      const hasConnections = puzzleData.grid.some((row: any[], rowIndex: number) =>
        row.some((cell: any, colIndex: number) => {
          if (!cell.letter) return false;
          
          // Check adjacent cells for connections
          const hasUp = rowIndex > 0 && puzzleData.grid[rowIndex - 1][colIndex]?.letter;
          const hasDown = rowIndex < puzzleData.grid.length - 1 && puzzleData.grid[rowIndex + 1][colIndex]?.letter;
          const hasLeft = colIndex > 0 && row[colIndex - 1]?.letter;
          const hasRight = colIndex < row.length - 1 && row[colIndex + 1]?.letter;
          
          return (hasUp || hasDown) && (hasLeft || hasRight);
        })
      );

      if (!hasConnections) {
        throw new Error('Generated puzzle lacks proper word connections');
      }

      console.log('Successfully generated puzzle:', puzzleData);
    } catch (error) {
      console.error('Error processing puzzle data:', error);
      throw new Error('Failed to generate valid crossword puzzle');
    }

    return new Response(JSON.stringify(puzzleData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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
