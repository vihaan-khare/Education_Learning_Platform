/**
 * predictabilityEngineService.ts
 * 
 * FLOW: This service implements the "Predictability Engine" specifically for ADHD students.
 * ADHD students benefit from a highly structured, predictable learning flow with zero unexpected variations.
 * 
 * It maps ANY given content (video transcript or article) into a predefined 4-step sequence:
 * 1. Intro -> AI summary of what will be learned
 * 2. Content -> Instructions on how to consume the content
 * 3. Reinforcement -> A reflection question to reinforce learning
 * 4. Completion -> A summary checklist or closing thought.
 */

import { callGemini } from './geminiService';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface PredictableSequence {
  intro: {
    title: string;
    text: string;
  };
  contentInstructions: {
    title: string;
    text: string;
  };
  reinforcement: {
    title: string;
    quizQuestions: QuizQuestion[];
  };
  completion: {
    title: string;
    summaryPoints: string[];
  };
}

function buildPrompt(contentType: 'video' | 'article', content: string): string {
  return `You are an educational AI. Generate a structured 4-step learning sequence for a student.

Content Type: ${contentType}
Content:
${content}

Generate EXACTLY this JSON structure:
{
  "intro": {
    "title": "Short catchy intro title",
    "text": "1-2 sentences explaining what the student is about to learn."
  },
  "contentInstructions": {
    "title": "Watch the Video" or "Read the Article",
    "text": "One specific instruction on what to pay attention to."
  },
  "reinforcement": {
    "title": "Knowledge Check",
    "quizQuestions": [
      {
        "question": "Question 1 based on the content?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctIndex": 0
      },
      {
        "question": "Question 2 based on the content?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctIndex": 2
      },
      {
        "question": "Question 3 based on the content?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctIndex": 1
      }
    ]
  },
  "completion": {
    "title": "Great Job!",
    "summaryPoints": ["Key takeaway 1", "Key takeaway 2", "Key takeaway 3"]
  }
}

IMPORTANT: correctIndex must be the 0-based index of the correct answer in the options array.
OUTPUT ONLY VALID JSON. No markdown wrappers.`;
}

/**
 * Fallback local generator if Gemini is unavailable
 */
function getFallbackSequence(contentType: 'video' | 'article', content: string): PredictableSequence {
  // Simple heuristic to extract a pseudo-topic from the content for the mock quiz
  const words = content.split(' ').filter(w => w.length > 5);
  const keyword1 = words[Math.floor(Math.random() * Math.min(words.length, 10))] || 'the main topic';
  const keyword2 = words[Math.floor(Math.random() * Math.min(words.length, 20))] || 'this concept';
  
  return {
    intro: {
      title: "Welcome to the Lesson",
      text: `We are going to learn about "${keyword1}" and related ideas today. Please get ready to focus.`
    },
    contentInstructions: {
      title: contentType === 'video' ? "Watch the Video" : "Read the Article",
      text: `Please pay close attention to the explanations surrounding ${keyword2}.`
    },
    reinforcement: {
      title: "Knowledge Check (Mock AI)",
      quizQuestions: [
        {
          question: `Based on the lesson, what is the best way to define "${keyword1}"?`,
          options: ["It is unrelated to the topic", `It represents a core part of ${keyword2}`, "It is only a historical footnote", "It has no meaning here"],
          correctIndex: 1
        },
        {
          question: `Why is it important to understand the concept of ${keyword2}?`,
          options: ["It is not important", "For entertainment only", "To better understand the structural foundations of this lesson", "To pass a test"],
          correctIndex: 2
        },
        {
          question: "When reviewing this material, what should you focus on?",
          options: ["Ignore the details", `How ${keyword1} connects to the larger picture`, "Give up", "Watch unrelated videos"],
          correctIndex: 1
        }
      ]
    },
    completion: {
      title: "Excellent Progress!",
      summaryPoints: [
        `You completed the lesson on ${keyword1}.`,
        "You practiced focusing.",
        "You answered the mock dynamic questions successfully!"
      ]
    }
  };
}

export async function generatePredictableSequence(
  contentType: 'video' | 'article',
  content: string
): Promise<PredictableSequence> {
  const prompt = buildPrompt(contentType, content);

  const aiResponse = await callGemini(prompt);

  if (aiResponse) {
    try {
      let cleaned = aiResponse.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      const parsed: PredictableSequence = JSON.parse(cleaned);

      if (parsed.intro && parsed.contentInstructions && parsed.reinforcement && parsed.completion) {
        return parsed;
      }
    } catch (error) {
      console.error('[PredictabilityEngine] Failed to parse Gemini response:', error);
    }
  }

  console.log('[PredictabilityEngine] Using fallback sequence.');
  return getFallbackSequence(contentType, content);
}

export interface ValidationResult {
  isCorrect: boolean;
  feedback: string;
}

/**
 * Validates a user's typed response to the reinforcement question using the LLM.
 */
export async function validateReinforcementAnswer(
  question: string,
  userAnswer: string,
  contentContext: string
): Promise<ValidationResult> {
  const prompt = `You are a supportive tutor grading a student's answer. The student might have focus issues, so be extremely encouraging.

Content Context:
${contentContext}

Question Asked: ${question}
Student's Answer: ${userAnswer}

Task: Evaluate the student's answer. 
1. Is it a reasonable attempt at answering the question based on the context?
2. If yes, respond with isCorrect: true and a short, encouraging feedback.
3. If no, respond with isCorrect: false and a gentle hint on how they can improve their answer. Do not be harsh.

Return EXACTLY a JSON string conforming to this format:
{
  "isCorrect": boolean,
  "feedback": "string"
}
OUTPUT ONLY VALID JSON. No markdown wrappers.`;

  const aiResponse = await callGemini(prompt);

  if (aiResponse) {
    try {
      let cleaned = aiResponse.trim();
      if (cleaned.startsWith('\`\`\`')) {
        cleaned = cleaned.replace(/^\`\`\`(?:json)?\n?/, '').replace(/\n?\`\`\`$/, '');
      }

      const parsed: ValidationResult = JSON.parse(cleaned);
      if (typeof parsed.isCorrect === 'boolean' && parsed.feedback) {
        return parsed;
      }
    } catch (parseError) {
      console.error('[PredictabilityEngine] Failed to parse validation result:', parseError);
    }
  }

  // Fallback to simple length heuristic if AI is down
  const isReasonableLength = userAnswer.trim().length > 10;
  return {
    isCorrect: isReasonableLength,
    feedback: isReasonableLength 
      ? 'Great job reflecting on the material!' 
      : 'Please write a bit more to fully explore the question.'
  };
}
