/**
 * taskBreakdownService.ts
 * 
 * FLOW: This is the core service for the "Automatic Task Breakdown" feature.
 * It takes any content (video transcript or article text) and breaks it
 * into small, actionable learning steps optimized for ADHD students.
 * 
 * HOW IT WORKS:
 * 1. Receives content (text or video transcript) and its type
 * 2. Builds a structured prompt for the Gemini AI model
 * 3. Sends the prompt via geminiService.ts
 * 4. Parses the JSON response into TaskStep[] objects
 * 5. If Gemini is unavailable, falls back to a local heuristic splitter
 * 
 * REUSABILITY: Any new content added to the ADHD/Autism section
 * can use generateTaskBreakdown() — just pass the content string
 * and its type ('video' or 'article').
 */

import { callGemini } from './geminiService';

/**
 * Represents a single step in the task breakdown.
 * The UI renders these as a checklist for the student.
 */
export interface TaskStep {
  stepNumber: number;
  /** Type of activity: watch a segment, read text, answer a question, summarize, or take a micro-break */
  type: 'watch' | 'read' | 'answer' | 'summarize' | 'break';
  /** Short title shown in the step header, e.g. "Watch Introduction (0:00 - 2:00)" */
  title: string;
  /** Detailed description of what the student should do */
  description: string;
  /** Estimated time in minutes to complete this step */
  estimatedMinutes: number;
}

function buildPrompt(contentType: 'video' | 'article', content: string): string {
  const specificInstructions = contentType === 'video' 
    ? "translate speech to text and split into segments using topic shifts by agentic ai"
    : "just directly do the text split";

  return `convert this content into small actionable learning steps with estimated time per step.
Break the task into smaller chunks, making it easy for the student to not get distracted or lose focus.
If video, translate speech to text and split into segments using topic shifts by agentic ai.
Same for text, just directly do the text split.

Example of output format (MUST BE STRICTLY JSON):
[
  {
    "stepNumber": 1,
    "title": "watch 2 min segment",
    "description": "Watch the first 2 minutes of the video.",
    "type": "watch",
    "estimatedMinutes": 2
  },
  {
    "stepNumber": 2,
    "title": "answer 1 question",
    "description": "What was the main point of the segment?",
    "type": "answer",
    "estimatedMinutes": 1
  },
  {
    "stepNumber": 3,
    "title": "summarize in 2 points",
    "description": "Write a 2 point summary of what you learned.",
    "type": "summarize",
    "estimatedMinutes": 2
  }
]

CONTENT TYPE: ${contentType}
INSTRUCTIONS: ${specificInstructions}
CONTENT:
${content}`;
}

/**
 * Fallback: splits content into chunks locally when Gemini is unavailable.
 * Uses a simple heuristic: split by paragraphs/sentences, then
 * interleave with questions and summaries.
 */
function fallbackBreakdown(contentType: 'video' | 'article', content: string): TaskStep[] {
  // Split content into paragraphs (or by double-newlines)
  const paragraphs = content
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 20);

  const steps: TaskStep[] = [];
  let stepNum = 1;

  // Group paragraphs into chunks of ~2 paragraphs each
  for (let i = 0; i < paragraphs.length; i += 2) {
    const chunk = paragraphs.slice(i, i + 2).join(' ');
    const preview = chunk.substring(0, 80) + (chunk.length > 80 ? '...' : '');

    // Step: Read/Watch the chunk
    steps.push({
      stepNumber: stepNum++,
      type: contentType === 'video' ? 'watch' : 'read',
      title: contentType === 'video'
        ? `Watch segment ${Math.floor(i / 2) + 1}`
        : `Read section ${Math.floor(i / 2) + 1}`,
      description: `${contentType === 'video' ? 'Watch' : 'Read'} this part carefully: "${preview}"`,
      estimatedMinutes: 3
    });

    // Step: Answer a question about it
    steps.push({
      stepNumber: stepNum++,
      type: 'answer',
      title: 'Quick check',
      description: `In your own words, what was the main idea of the section you just ${contentType === 'video' ? 'watched' : 'read'}? Write 1-2 sentences.`,
      estimatedMinutes: 2
    });

    // Every 3rd chunk, add a micro-break
    if ((i / 2 + 1) % 3 === 0 && i + 2 < paragraphs.length) {
      steps.push({
        stepNumber: stepNum++,
        type: 'break',
        title: 'Micro-break',
        description: 'Stand up, stretch, take 3 deep breaths. You\'re doing great!',
        estimatedMinutes: 1
      });
    }
  }

  // Final summary step
  steps.push({
    stepNumber: stepNum++,
    type: 'summarize',
    title: 'Final summary',
    description: 'Write down the 3 most important things you learned. Keep each point to one sentence.',
    estimatedMinutes: 3
  });

  return steps;
}

/**
 * Main entry point: generates a task breakdown for any content.
 * 
 * @param contentType - 'video' for transcripts, 'article' for text
 * @param content     - The full text content or transcript
 * @returns           - Array of TaskStep objects for the UI to render
 * 
 * USAGE (for any future content):
 *   const steps = await generateTaskBreakdown('article', articleText);
 *   const steps = await generateTaskBreakdown('video', videoTranscript);
 */
export async function generateTaskBreakdown(
  contentType: 'video' | 'article',
  content: string
): Promise<TaskStep[]> {
  // Build the AI prompt
  const prompt = buildPrompt(contentType, content);

  // Try Gemini first
  const aiResponse = await callGemini(prompt);

  if (aiResponse) {
    try {
      // Clean the response: remove markdown code fences if present
      let cleaned = aiResponse.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      const parsed: TaskStep[] = JSON.parse(cleaned);

      // Validate the structure
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].stepNumber) {
        return parsed;
      }
    } catch (parseError) {
      console.error('[TaskBreakdown] Failed to parse Gemini response:', parseError);
    }
  }

  // Fallback to local heuristic if Gemini is unavailable or returns bad data
  console.log('[TaskBreakdown] Using fallback heuristic breakdown.');
  return fallbackBreakdown(contentType, content);
}
