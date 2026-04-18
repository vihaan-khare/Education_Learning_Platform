import React, { useState } from 'react';
import { clarifyInstruction } from '../../services/instructionClarifierService';
import type { ClarifiedInstruction } from '../../services/instructionClarifierService';

interface InstructionClarifierProps {
  rawInstruction: string;
}

const InstructionClarifier: React.FC<InstructionClarifierProps> = ({ rawInstruction }) => {
  const [loading, setLoading] = useState(false);
  const [clarifiedData, setClarifiedData] = useState<ClarifiedInstruction | null>(null);

  const handleClarify = async () => {
    setLoading(true);
    const result = await clarifyInstruction(rawInstruction);
    if (result) {
      setClarifiedData(result);
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.rawSection}>
        <span style={styles.label}>Teacher's Instruction:</span>
        <p style={styles.rawText}>"{rawInstruction}"</p>
      </div>

      {!clarifiedData && (
        <button
          onClick={handleClarify}
          disabled={loading}
          style={{ ...styles.clarifyButton, ...(loading ? styles.disabledBtn : {}) }}
        >
          {loading ? '⏳ Analyzing & Paraphrasing...' : '✨ Clarify Instruction (AI)'}
        </button>
      )}

      {clarifiedData && (
        <div className="animate-fade-in" style={styles.clarifiedSection}>
          <div style={styles.clarifiedHeader}>
            <span>✓</span> AI Translated Steps:
          </div>
          <ul style={styles.stepList}>
            {clarifiedData.clarified.map((step, i) => (
              <li key={i} style={styles.stepItem}>
                <div style={styles.stepBullet}>{i + 1}</div>
                <div style={styles.stepText}>{step}</div>
              </li>
            ))}
          </ul>
          {clarifiedData.tips && (
            <div style={styles.tipBox}>
              <strong>Tip:</strong> {clarifiedData.tips}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    marginBottom: '1rem',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  rawSection: {
    marginBottom: '1rem'
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#718096',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  rawText: {
    fontSize: '1.1rem',
    color: '#2d3748',
    margin: '0.5rem 0 0 0',
    fontStyle: 'italic',
    lineHeight: 1.5
  },
  clarifyButton: {
    width: '100%',
    padding: '0.85rem',
    backgroundColor: '#ebf8ff',
    color: '#2b6cb0',
    border: '2px dashed #90cdf4',
    borderRadius: '0.5rem',
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  disabledBtn: {
    opacity: 0.7,
    cursor: 'not-allowed'
  },
  clarifiedSection: {
    marginTop: '1.5rem',
    backgroundColor: '#f0fff4',
    border: '1px solid #9ae6b4',
    borderRadius: '0.5rem',
    padding: '1.25rem',
  },
  clarifiedHeader: {
    color: '#276749',
    fontWeight: 700,
    fontSize: '1.05rem',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  stepList: {
    listStyleType: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  stepItem: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-start'
  },
  stepBullet: {
    width: '24px',
    height: '24px',
    backgroundColor: '#48bb78',
    color: '#ffffff',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    flexShrink: 0
  },
  stepText: {
    color: '#2d3748',
    lineHeight: 1.5,
    paddingTop: '0.1rem'
  },
  tipBox: {
    marginTop: '1.25rem',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '0.35rem',
    padding: '0.75rem',
    color: '#4a5568',
    fontSize: '0.9rem'
  }
};

export default InstructionClarifier;
