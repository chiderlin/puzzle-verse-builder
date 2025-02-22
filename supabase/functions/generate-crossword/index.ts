
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
    const prompt = `Generate a 3x3 crossword puzzle with the following format:
    1. Three words going across
    2. Two words going down
    3. Each word should be 3 letters long
    4. Words should be common English words
    5. Words should intersect properly
    6. Return the result in JSON format with this structure:
    {
      "grid": [
        [{"letter": "", "number": 1}, {"letter": "", "number": 2}, {"letter": ""}],
        [{"letter": "", "number": 3}, {"letter": ""}, {"letter": ""}],
        [{"letter": "", "number": 4}, {"letter": ""}, {"letter": ""}]
      ],
      "across": [
        {"number": 1, "text": "clue for first word"},
        {"number": 3, "text": "clue for second word"},
        {"number": 4, "text": "clue for third word"}
      ],
      "down": [
        {"number": 1, "text": "clue for first vertical word"},
        {"number": 2, "text": "clue for second vertical word"}
      ]
    }`;

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
      throw new Error(data.error?.message || 'Failed to generate crossword');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    let puzzleData;
    
    try {
      // Extract JSON from the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      puzzleData = JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error parsing JSON:', error);
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
