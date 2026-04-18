import { callGemini } from './geminiService';

export interface ClarifiedInstruction {
  original: string;
  clarified: string[];
  tips?: string;
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
  if (!responseText) return null;

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
  }

  return null;
}
