
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
    const prompt = `Generate a 5x5 crossword puzzle with the following requirements:
    1. The puzzle should be 5x5 in size
    2. Words should be 3-5 letters long
    3. Words must intersect properly sharing common letters
    4. Each word should connect to at least one other word
    5. Use common English words that are easily recognizable
    6. Each clue should be clear and appropriate for casual players
    7. Return the result in JSON format with this structure:
    {
      "grid": [
        [{"letter": "A", "number": 1}, {"letter": "P", "number": null}, {"letter": "T", "number": null}, {"letter": "", "number": 2}, {"letter": "", "number": null}],
        [{"letter": "R", "number": 3}, {"letter": "I", "number": null}, {"letter": "D", "number": null}, {"letter": "E", "number": null}, {"letter": "", "number": null}],
        [{"letter": "T", "number": null}, {"letter": "", "number": null}, {"letter": "", "number": null}, {"letter": "", "number": null}, {"letter": "", "number": null}],
        [{"letter": "", "number": 4}, {"letter": "", "number": null}, {"letter": "", "number": null}, {"letter": "", "number": null}, {"letter": "", "number": null}],
        [{"letter": "", "number": null}, {"letter": "", "number": null}, {"letter": "", "number": null}, {"letter": "", "number": null}, {"letter": "", "number": null}]
      ],
      "across": [
        {"number": 1, "text": "Small apartment"},
        {"number": 3, "text": "Take a horse journey"},
        {"number": 4, "text": "Your clue here"}
      ],
      "down": [
        {"number": 1, "text": "Part of the body"},
        {"number": 2, "text": "Your clue here"}
      ]
    }
    Make sure all words are properly connected and make sense as a crossword puzzle.`;

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

      // Ensure all cells have the required properties
      puzzleData.grid = puzzleData.grid.map((row: any[]) =>
        row.map((cell: any) => ({
          letter: cell.letter || "",
          number: cell.number || null,
        }))
      );

      console.log('Successfully generated puzzle:', puzzleData);
    } catch (error) {
      console.error('Error parsing puzzle data:', error);
      throw new Error('Failed to parse generated crossword data');
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
