import React, { useState, useEffect } from 'react';
import { generatePredictableSequence } from '../../services/predictabilityEngineService';
import type { PredictableSequence, QuizQuestion } from '../../services/predictabilityEngineService';

interface PredictableEngineProps {
  sectionId: string;
  title: string;
  type: 'video' | 'article';
  content: string;
  embedUrl?: string;
  sourceLink?: string;
  sourceLinkLabel?: string;
  onComplete?: () => void;
  onBackToLibrary: () => void;
  hideBackBtn?: boolean;
}

const STAGES = ['intro', 'content', 'reinforcement', 'completion'] as const;
type Stage = typeof STAGES[number];

const PredictabilityEngine: React.FC<PredictableEngineProps> = ({
  sectionId, title, type, content, embedUrl, sourceLink, sourceLinkLabel, onComplete, onBackToLibrary, hideBackBtn
}) => {
  const [sequence, setSequence] = useState<PredictableSequence | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeStageIndex, setActiveStageIndex] = useState(0);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const activeStage: Stage = STAGES[activeStageIndex];

  useEffect(() => {
    setSequence(null);
    setActiveStageIndex(0);
    setSelectedAnswers({});
    setSubmitted(false);
    setScore(0);
  }, [sectionId]);

  const handleStart = async () => {
    if (!content) return;
    setLoading(true);
    try {
      const result = await generatePredictableSequence(type, content);
      setSequence(result);
    } catch (err) {
      console.error('[PredictabilityEngine] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const nextStage = () => {
    if (activeStageIndex < STAGES.length - 1) {
      setActiveStageIndex(prev => prev + 1);
    }
  };

  const handleSubmitQuiz = () => {
    if (!sequence) return;
    const questions: QuizQuestion[] = sequence.reinforcement.quizQuestions;
    let correct = 0;
    questions.forEach((q, i) => {
      if (selectedAnswers[i] === q.correctIndex) correct++;
    });
    setScore(correct);
    setSubmitted(true);
    // Passed the quiz, user can now go to completion step.
  };

  const handleRetryQuiz = () => {
    setSelectedAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  const allAnswered = sequence
    ? Object.keys(selectedAnswers).length === sequence.reinforcement.quizQuestions.length
    : false;

  const passed = sequence
    ? score >= Math.ceil(sequence.reinforcement.quizQuestions.length / 2)
    : false;

  if (!sequence) {
    return (
      <div style={s.container}>
        <div style={s.startCard}>
          <h2 style={s.heading}>{title}</h2>
          <p style={s.muted}>
            This lesson follows a strict structured flow:<br />
            <strong>Intro → Content → Quiz → Completion</strong>
          </p>
          <button style={s.btn} onClick={handleStart} disabled={loading || !content}>
            {loading ? '⏳ Building Lesson...' : '▶ Begin Structured Lesson'}
          </button>
          {!hideBackBtn && (
            <button style={{...s.btnSecondary, marginTop: '0.75rem'}} onClick={onBackToLibrary}>
              ← Home
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={s.container}>
      {/* Stage Progress Bar */}
      <div style={s.stageBar}>
        {STAGES.map((stage, idx) => {
          const past = idx < activeStageIndex;
          const active = idx === activeStageIndex;
          return (
            <div key={stage} style={{
              ...s.stagePill,
              ...(active ? s.stagePillActive : {}),
              ...(past ? s.stagePillDone : {}),
            }}>
              {past ? '✓' : idx + 1}. {stage.charAt(0).toUpperCase() + stage.slice(1)}
            </div>
          );
        })}
      </div>

      {/* Back to Library — always visible unless hidden */}
      {!hideBackBtn && (
        <button style={s.backLink} onClick={onBackToLibrary}>
          ← Home
        </button>
      )}

      <div style={s.card}>

        {/* ── PHASE 1: INTRO ── */}
        {activeStage === 'intro' && (
          <div style={s.phase}>
            <div style={s.phaseTag}>Step 1 of 4 — Intro</div>
            <h3 style={s.phaseTitle}>{sequence.intro.title}</h3>
            <p style={s.phaseText}>{sequence.intro.text}</p>
            <button style={s.btn} onClick={nextStage}>Continue →</button>
          </div>
        )}

        {/* ── PHASE 2: CONTENT ── */}
        {activeStage === 'content' && (
          <div style={s.phase}>
            <div style={s.phaseTag}>Step 2 of 4 — Content</div>
            <h3 style={s.phaseTitle}>{sequence.contentInstructions.title}</h3>
            <p style={s.phaseText}>{sequence.contentInstructions.text}</p>

            <div style={s.mediaBox}>
              {type === 'video' && embedUrl ? (
                <div style={s.videoWrapper}>
                  <iframe
                    src={embedUrl}
                    title={title}
                    style={s.iframe}
                    allowFullScreen
                  />
                </div>
              ) : (
                <div style={s.articleBox}>
                  {content
                    ? <p style={s.articleText}>{content}</p>
                    : <p style={s.muted}>Loading article...</p>
                  }
                </div>
              )}
            </div>

            {sourceLink && (
              <a href={sourceLink} target="_blank" rel="noopener noreferrer" style={s.link}>
                {sourceLinkLabel || 'View Source ↗'}
              </a>
            )}

            <button style={{...s.btn, marginTop: '1.5rem'}} onClick={nextStage}>
              I've finished this content →
            </button>
          </div>
        )}

        {/* ── PHASE 3: QUIZ ── */}
        {activeStage === 'reinforcement' && (
          <div style={s.phase}>
            <div style={s.phaseTag}>Step 3 of 4 — Knowledge Check</div>
            <h3 style={s.phaseTitle}>{sequence.reinforcement.title}</h3>
            <p style={s.muted}>Answer all questions to proceed. You need at least {Math.ceil(sequence.reinforcement.quizQuestions.length / 2)} correct.</p>

            {sequence.reinforcement.quizQuestions.map((q: QuizQuestion, qi: number) => (
              <div key={qi} style={s.questionBlock}>
                <p style={s.questionText}><strong>Q{qi + 1}:</strong> {q.question}</p>
                <div style={s.optionList}>
                  {q.options.map((opt, oi) => {
                    const isSelected = selectedAnswers[qi] === oi;
                    const isCorrect = q.correctIndex === oi;
                    let optStyle = { ...s.option };
                    if (submitted) {
                      if (isCorrect) optStyle = { ...optStyle, ...s.optionCorrect };
                      else if (isSelected && !isCorrect) optStyle = { ...optStyle, ...s.optionWrong };
                    } else if (isSelected) {
                      optStyle = { ...optStyle, ...s.optionSelected };
                    }
                    return (
                      <div
                        key={oi}
                        style={optStyle}
                        onClick={() => {
                          if (!submitted) setSelectedAnswers(prev => ({ ...prev, [qi]: oi }));
                        }}
                      >
                        <span style={s.optionLetter}>{String.fromCharCode(65 + oi)}</span>
                        {opt}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {!submitted ? (
              <button
                style={{ ...s.btn, ...(allAnswered ? {} : s.btnDisabled) }}
                onClick={handleSubmitQuiz}
                disabled={!allAnswered}
              >
                Submit Quiz
              </button>
            ) : (
              <div style={passed ? s.scoreBannerPass : s.scoreBannerFail}>
                <strong>{passed ? '🎉 Great job!' : '📚 Keep going!'}</strong>
                &nbsp; You scored {score}/{sequence.reinforcement.quizQuestions.length}.
                {passed
                  ? ' You can continue to the final step.'
                  : ' Review the answers highlighted above and try again.'}
              </div>
            )}

            {submitted && passed && (
              <button style={{ ...s.btn, marginTop: '1rem' }} onClick={nextStage}>
                Continue to Completion →
              </button>
            )}
            {submitted && !passed && (
              <button style={{ ...s.btnSecondary, marginTop: '1rem' }} onClick={handleRetryQuiz}>
                Retry Quiz
              </button>
            )}
          </div>
        )}

        {/* ── PHASE 4: COMPLETION ── */}
        {activeStage === 'completion' && (
          <div style={s.phase}>
            <div style={s.phaseTag}>Step 4 of 4 — Complete</div>
            <div style={s.successBadge}>🏆 Lesson Completed!</div>
            <h3 style={s.phaseTitle}>{sequence.completion.title}</h3>
            <ul style={s.summaryList}>
              {sequence.completion.summaryPoints.map((pt, i) => (
                <li key={i} style={s.summaryItem}>✓ {pt}</li>
              ))}
            </ul>
            {!hideBackBtn ? (
              <button style={{ ...s.btn, backgroundColor: '#38a169', marginTop: '1.5rem', width: '100%' }} onClick={() => { if (onComplete) onComplete(); onBackToLibrary(); }}>
                ← Home
              </button>
            ) : (
              <button style={{ ...s.btn, backgroundColor: '#38a169', marginTop: '1.5rem', width: '100%' }} onClick={() => { if (onComplete) onComplete(); }}>
                Complete Module →
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: '100%',
  },
  startCard: {
    backgroundColor: '#fff',
    borderRadius: '1rem',
    padding: '2.5rem',
    border: '2px dashed #a0aec0',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  heading: {
    fontSize: '1.5rem',
    fontWeight: 700,
    margin: 0,
    color: '#1a202c',
  },
  muted: {
    color: '#718096',
    fontSize: '0.95rem',
    margin: 0,
    lineHeight: 1.6,
  },
  btn: {
    padding: '0.75rem 2rem',
    backgroundColor: '#4299e1',
    color: '#fff',
    border: 'none',
    borderRadius: '0.5rem',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  btnSecondary: {
    padding: '0.75rem 2rem',
    backgroundColor: '#edf2f7',
    color: '#4a5568',
    border: 'none',
    borderRadius: '0.5rem',
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer',
  },
  btnDisabled: {
    backgroundColor: '#a0aec0',
    cursor: 'not-allowed',
  },
  backLink: {
    background: 'none',
    border: 'none',
    color: '#4299e1',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
    padding: 0,
    alignSelf: 'flex-start',
    marginBottom: '0.25rem',
  },
  stageBar: {
    display: 'flex',
    gap: '0.5rem',
    backgroundColor: '#fff',
    padding: '0.5rem',
    borderRadius: '0.5rem',
    border: '1px solid #e2e8f0',
  },
  stagePill: {
    flex: 1,
    textAlign: 'center',
    padding: '0.5rem 0.25rem',
    borderRadius: '0.25rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#a0aec0',
    backgroundColor: '#f7fafc',
  },
  stagePillActive: {
    backgroundColor: '#ebf8ff',
    color: '#2b6cb0',
    border: '1px solid #90cdf4',
  },
  stagePillDone: {
    backgroundColor: '#f0fff4',
    color: '#38a169',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '1rem',
    padding: '2rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  },
  phase: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  phaseTag: {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#718096',
    textTransform: 'uppercase',
    letterSpacing: '0.075em',
  },
  phaseTitle: {
    fontSize: '1.4rem',
    fontWeight: 700,
    color: '#2b6cb0',
    margin: 0,
  },
  phaseText: {
    fontSize: '1.05rem',
    lineHeight: 1.7,
    color: '#4a5568',
    margin: 0,
  },
  mediaBox: {
    borderRadius: '0.5rem',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
  },
  videoWrapper: {
    position: 'relative',
    paddingBottom: '56.25%',
    height: 0,
  },
  iframe: {
    position: 'absolute',
    top: 0, left: 0,
    width: '100%', height: '100%',
    border: 'none',
  },
  articleBox: {
    padding: '1.5rem',
    maxHeight: '380px',
    overflowY: 'auto',
  },
  articleText: {
    lineHeight: 1.8,
    color: '#2d3748',
    margin: 0,
  },
  link: {
    color: '#2b6cb0',
    fontWeight: 500,
    textDecoration: 'none',
    fontSize: '0.9rem',
  },
  questionBlock: {
    backgroundColor: '#f7fafc',
    borderRadius: '0.75rem',
    padding: '1.25rem',
    border: '1px solid #e2e8f0',
  },
  questionText: {
    fontSize: '1rem',
    color: '#2d3748',
    marginBottom: '0.75rem',
    lineHeight: 1.5,
  },
  optionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.7rem 1rem',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.95rem',
    color: '#2d3748',
    transition: 'border-color 0.15s, background 0.15s',
  },
  optionSelected: {
    borderColor: '#4299e1',
    backgroundColor: '#ebf8ff',
    color: '#2b6cb0',
  },
  optionCorrect: {
    borderColor: '#38a169',
    backgroundColor: '#f0fff4',
    color: '#276749',
  },
  optionWrong: {
    borderColor: '#e53e3e',
    backgroundColor: '#fff5f5',
    color: '#c53030',
  },
  optionLetter: {
    fontWeight: 700,
    minWidth: '22px',
    color: '#a0aec0',
  },
  scoreBannerPass: {
    padding: '1rem',
    backgroundColor: '#f0fff4',
    border: '1px solid #9ae6b4',
    borderRadius: '0.5rem',
    color: '#276749',
    fontSize: '1rem',
  },
  scoreBannerFail: {
    padding: '1rem',
    backgroundColor: '#fffaf0',
    border: '1px solid #fbd38d',
    borderRadius: '0.5rem',
    color: '#9c4221',
    fontSize: '1rem',
  },
  successBadge: {
    fontSize: '1.75rem',
    textAlign: 'center',
    padding: '1rem',
    backgroundColor: '#f0fff4',
    borderRadius: '0.75rem',
    border: '2px solid #9ae6b4',
  },
  summaryList: {
    listStyleType: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  summaryItem: {
    padding: '0.75rem 1rem',
    backgroundColor: '#f0fff4',
    color: '#276749',
    borderRadius: '0.5rem',
    fontWeight: 500,
  },
};

export default PredictabilityEngine;
