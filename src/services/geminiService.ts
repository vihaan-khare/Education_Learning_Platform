/**
 * geminiService.ts
 * 
 * FLOW: This service handles communication with the Google Gemini API.
 * It is used by taskBreakdownService.ts to generate AI-powered
 * content breakdowns for ADHD students.
 * 
 * The Gemini API key is stored in the .env file as VITE_GEMINI_API_KEY.
 * If no key is provided, the service returns null so callers can
 * fall back to a local heuristic breakdown.
 * 
 * Endpoint: Gemini 2.0 Flash (fast, cost-effective for structured output)
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Sends a prompt to the Gemini API and returns the text response.
 * Returns null if no API key is configured or if the request fails.
 */
export async function callGemini(prompt: string): Promise<string | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // If no API key is configured, return null so the caller can use a fallback
  if (!apiKey || apiKey === 'your-gemini-api-key') {
    console.warn('[GeminiService] No Gemini API key configured. Using fallback breakdown.');
    return null;
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      console.error('[GeminiService] API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    // Extract text from Gemini's response structure
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || null;
  } catch (error) {
    console.error('[GeminiService] Request failed:', error);
    return null;
  }
}
