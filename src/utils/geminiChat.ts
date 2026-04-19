export interface Message {
  sender: 'ai' | 'user';
  text: string;
}

export async function askGemini(
  userText: string,
  history: Message[],
  systemPromptOverride?: string
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your-gemini-api-key') {
    return "My AI responses are unavailable right now. Please check your Gemini API key configuration.";
  }

  const systemPrompt = systemPromptOverride || `You are a compassionate, voice-first AI learning assistant. 
Rules:
- Keep responses SHORT (2-3 sentences max) because they will be read aloud.
- Never use bullet points, markdown, or special characters — plain spoken language only.
- Be warm, clear, and encouraging.
- You help users navigate the learning platform, answer questions about their modules, and provide support.`;

  // Squash contiguous messages of the same role (Gemini API requires strict alternating roles)
  const squashedHistory: { role: string, parts: { text: string }[] }[] = [];
  for (const m of history.slice(-6)) {
    const role = m.sender === 'ai' ? 'model' : 'user';
    if (squashedHistory.length > 0 && squashedHistory[squashedHistory.length - 1].role === role) {
      squashedHistory[squashedHistory.length - 1].parts[0].text += '\n' + m.text;
    } else {
      squashedHistory.push({ role, parts: [{ text: m.text }] });
    }
  }

  const models = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.0-flash-lite', 'gemini-flash-latest'];
  let lastErrorData = null;
  let lastStatus = null;
  let hitRateLimit = false;

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: squashedHistory,
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        return text.replace(/[*_`#\-]/g, '').trim();
      } else {
        lastStatus = res.status;
        lastErrorData = await res.json().catch(() => null);
        console.warn(`[Gemini] Model ${model} failed with ${res.status}. Trying next...`);
        
        if (res.status === 429) hitRateLimit = true;

        // If it's a 400 Bad Request, our JSON payload is genuinely malformed, so stop retrying.
        // Ignore 404s (model not found) as just missing fallback options.
        if (res.status === 400) {
          break;
        }
      }
    } catch (err) {
      console.error(`[Gemini] Exception with model ${model}:`, err);
    }
  }

  console.error('[Gemini] All models exhausted. Last error:', lastStatus, lastErrorData);
  if (hitRateLimit) {
    return "I am currently receiving too many requests. Google's API limit has been reached. Please try again in 30 seconds.";
  }
  return `I encountered a configuration issue with the AI system (Error ${lastStatus}). Please contact the admin.`;
}
