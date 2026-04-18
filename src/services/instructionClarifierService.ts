import { callGemini } from './geminiService';

export interface ClarifiedInstruction {
  original: string;
  clarified: string[];
  tips?: string;
}

/**
 * A fallback logic that generates a "simulated" AI breakdown if the real API is down.
 * This ensures the UI remains functional and demonstratable.
 */
function getMockClarification(vague: string): ClarifiedInstruction {
  return {
    original: vague,
    clarified: [
      "Identify the specific topic or entity mentioned in the prompt.",
      "Gather exactly three key facts or pieces of data regarding this topic.",
      "Organize the information into a structure with a clear beginning, middle, and end.",
      "Ensure the final output is between 150 and 200 words in length.",
      "Review the draft to remove any figurative language or metaphors."
    ],
    tips: "Mock AI: Focusing on literal constraints helps reduce cognitive load."
  };
}

/**
 * Sends a vague teacher instruction to Gemini to be broken down into literal, 
 * unambiguous steps tailored for neurodivergent (e.g. autistic) processing.
 */
export async function clarifyInstruction(vagueInstruction: string): Promise<ClarifiedInstruction | null> {
  const prompt = `You are an expert at translating vague, neurotypical teacher assignments into clear, literal, and unambiguous steps.
Many students taking this course have exact, literal thinking styles (such as those on the autism spectrum) and struggle with open-ended or ambiguous commands like "write about your feelings" or "make it sound better".

Task: Take the following raw teacher instruction and break it down into a highly specific, step-by-step checklist. Remove all ambiguity.
Provide specific quantities, explicit actions, and clear bounds.

Raw Instruction: "${vagueInstruction}"

Return EXACTLY a JSON string conforming to this format:
{
  "clarified": [ "step 1...", "step 2..." ],
  "tips": "Optional single sentence encouraging tip for the student"
}
OUTPUT ONLY VALID JSON. No markdown wrappers.`;

  const responseText = await callGemini(prompt);
  
  // If callGemini fails (e.g. no API key), use the mock fallback instead of returning null
  if (!responseText) {
    console.info('[InstructionClarifierService] API unavailable. Using mock fallback.');
    return getMockClarification(vagueInstruction);
  }

  try {
    let cleaned = responseText.trim();
    if (cleaned.startsWith('\`\`\`')) {
      cleaned = cleaned.replace(/^\`\`\`(?:json)?\n?/, '').replace(/\n?\`\`\`$/, '');
    }

    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed.clarified)) {
      return {
        original: vagueInstruction,
        clarified: parsed.clarified,
        tips: parsed.tips
      };
    }
  } catch (err) {
    console.error('[InstructionClarifierService] Failed to parse response:', err);
    return getMockClarification(vagueInstruction);
  }

  return getMockClarification(vagueInstruction);
}
