/**
 * AutismPage.tsx — Neurodivergent learning library
 * 
 * Includes the Course Catalog, the rigid PredictabilityEngine,
 * and the Instruction Clarifier AI feature.
 */

import React, { useState, useEffect } from 'react';
import PredictabilityEngine from './PredictabilityEngine';
import InstructionClarifier from './InstructionClarifier';

interface CourseSectionType {
  id: string;
  title: string;
  type: 'video' | 'article';
  embedUrl?: string;
  sourceLink: string;
  sourceLinkLabel: string;
  content: string;
  usePredictabilityEngine?: boolean;
}

interface CourseType {
  id: string;
  title: string;
  description: string;
  icon: string;
  sections: CourseSectionType[];
  assignments?: string[];
}

interface AutismPageProps {
  onBack?: () => void;
}

const SAMPLE_NEURO_TRANSCRIPT = `Neurodiversity refers to the variation in the human brain regarding sociability, learning, attention, mood, and other mental functions. It is a concept where neurological differences are recognized and respected as any other human variation. Conditions like ADHD, Autism, Dyspraxia, and Dyslexia are natural variations. Embracing neurodiversity means understanding these differences.`;

const INITIAL_SECTIONS: CourseSectionType[] = [
  {
    id: 'video-neuro-overview',
    title: '📺 Video: Understanding Neurodiversity',
    type: 'video',
    embedUrl: 'https://www.youtube.com/embed/YtvP5A5OHpU',
    sourceLink: 'https://www.youtube.com/watch?v=YtvP5A5OHpU',
    sourceLinkLabel: 'Watch on YouTube ↗',
    content: SAMPLE_NEURO_TRANSCRIPT,
    usePredictabilityEngine: true,
  },
  {
    id: 'article-neuro-wiki',
    title: '📄 Article: Understanding Neurodiversity',
    type: 'article',
    sourceLink: 'https://en.wikipedia.org/wiki/Neurodiversity',
    sourceLinkLabel: 'Read full article on Wikipedia ↗',
    content: '', // Fetched
    usePredictabilityEngine: true,
  }
];

const LEARNING_COURSES: CourseType[] = [
  {
    id: 'course-foundations',
    title: 'Foundations of Learning',
    description: 'A comprehensive introduction to cognitive styles.',
    icon: '🧩',
    sections: INITIAL_SECTIONS,
    assignments: []
  },
  {
    id: 'course-creative-writing',
    title: 'Creative Writing Workshop',
    description: 'Practice translating teacher instructions and breaking down writing assignments.',
    icon: '📝',
    sections: [],
    assignments: [
      "Write a short page about what you did over the summer and make it sound exciting.",
      "Fix up your essay so it flows better and has a better conclusion.",
      "Just be creative and do a presentation on an animal."
    ]
  },
  {
    id: 'course-sensory',
    title: 'Sensory Processing Deep Dive',
    description: 'Understanding sensory overload and practical regulation strategies.',
    icon: '🎧',
    sections: [] 
  }
];

const AutismPage: React.FC<AutismPageProps> = ({ onBack }) => {
  const [sections, setSections] = useState<CourseSectionType[]>(INITIAL_SECTIONS);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>(INITIAL_SECTIONS[0].id);
  const [completedCourses, setCompletedCourses] = useState<Set<string>>(new Set());

  const handleLessonComplete = (courseId: string) => {
    setCompletedCourses(prev => new Set(prev).add(courseId));
  };

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/Neurodiversity');
        const data = await res.json();
        const articleText = data.extract || 'Could not load article content.';

        setSections(prev =>
          prev.map(s =>
            s.id === 'article-neuro-wiki' ? { ...s, content: articleText } : s
          )
        );
      } catch (err) {
        console.error('[AutismPage] Failed to fetch Wikipedia article:', err);
      }
    };
    fetchArticle();
  }, []);

  if (!selectedCourseId) {
    return (
      <div style={styles.page}>
        <header style={styles.header}>
          {onBack && (
            <button style={styles.backButton} onClick={onBack}>
              ⬅ Back to Learning Paths
            </button>
          )}
          <h1 style={styles.courseTitle}>Learning Library</h1>
          <p style={styles.courseSubtitle}>Select a module to begin</p>
        </header>

        <div style={styles.catalogGrid}>
          {LEARNING_COURSES.map(course => (
            <div 
              key={course.id} 
              style={styles.courseCardOverview} 
              onClick={() => {
                const hasSections = course.sections.length > 0;
                const hasAssignments = course.assignments && course.assignments.length > 0;

                if (hasSections || hasAssignments) {
                  setSelectedCourseId(course.id);
                  if (hasSections) {
                    const mergedSections = course.sections.map(sec => {
                      const fetchedSec = sections.find(s => s.id === sec.id);
                      return fetchedSec && fetchedSec.content ? { ...sec, content: fetchedSec.content } : sec;
                    });
                    setSections(mergedSections);
                    setActiveSection(mergedSections[0].id);
                  }
                } else {
                  alert('This course module is coming soon!');
                }
              }}
            >
              <div style={styles.courseIcon}>{course.icon}</div>
              <h2 style={styles.courseCardTitle}>{course.title}</h2>
              <p style={styles.courseCardDesc}>{course.description}</p>
              
              {completedCourses.has(course.id) && (
                <div style={styles.completedTag}>✓ Completed</div>
              )}

              {course.sections.length === 0 && (!course.assignments || course.assignments.length === 0) && (
                <span style={styles.comingSoonBadge}>Coming Soon</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activeCourse = LEARNING_COURSES.find(c => c.id === selectedCourseId) || LEARNING_COURSES[0];
  const hasSections = activeCourse.sections.length > 0;
  const hasAssignments = activeCourse.assignments && activeCourse.assignments.length > 0;

  return (
    <div style={styles.page}>
      <button style={styles.backButton} onClick={() => setSelectedCourseId(null)}>
        ⬅ Back to Library
      </button>

      <header style={styles.header}>
        <h1 style={styles.courseTitle}>{activeCourse.title}</h1>
        <p style={styles.courseSubtitle}>
          A structured learning experience.
        </p>
      </header>

      {hasSections && (
        <>
          <div style={styles.tabBar}>
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                style={{
                  ...styles.tab,
                  ...(activeSection === section.id ? styles.tabActive : {}),
                }}
              >
                {section.title}
              </button>
            ))}
          </div>

          {sections.map(section => {
            if (section.id !== activeSection) return null;

            return (
              <div key={section.id} style={styles.sectionContainer}>
                {section.usePredictabilityEngine ? (
                  <PredictabilityEngine 
                    sectionId={section.id}
                    title={section.title}
                    type={section.type}
                    content={section.content}
                    embedUrl={section.embedUrl}
                    sourceLink={section.sourceLink}
                    sourceLinkLabel={section.sourceLinkLabel}
                    onComplete={() => handleLessonComplete(activeCourse.id)}
                    onBackToLibrary={() => setSelectedCourseId(null)}
                  />
                ) : (
                  <div style={styles.contentCard}>
                    {section.type === 'video' && section.embedUrl ? (
                      <div style={styles.videoWrapper}>
                        <iframe
                          src={section.embedUrl}
                          title={section.title}
                          style={styles.videoIframe}
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div style={styles.articleContent}>
                        {section.content ? <p style={styles.articleText}>{section.content}</p> : <p>Loading...</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* Render raw teacher assignments with the new Clarifier component */}
      {hasAssignments && (
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#2d3748' }}>
            Course Assignments
          </h2>
          {activeCourse.assignments!.map((instruction, idx) => (
            <InstructionClarifier key={idx} rawInstruction={instruction} />
          ))}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f0f4f8',
    fontFamily: "'Inter', system-ui, sans-serif",
    color: '#2d3748',
    padding: '2rem',
    maxWidth: '900px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
    paddingBottom: '1.5rem',
    borderBottom: '2px solid #e2e8f0',
  },
  courseTitle: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#1a202c',
    margin: '0 0 0.5rem 0',
  },
  courseSubtitle: {
    fontSize: '1rem',
    color: '#718096',
    margin: 0,
  },
  catalogGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem',
    marginTop: '2rem'
  },
  courseCardOverview: {
    backgroundColor: '#ffffff',
    borderRadius: '1rem',
    padding: '2rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative'
  },
  courseIcon: {
    fontSize: '3rem',
    marginBottom: '1rem'
  },
  courseCardTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#2d3748',
    marginBottom: '0.5rem',
    marginTop: 0
  },
  courseCardDesc: {
    fontSize: '0.95rem',
    color: '#718096',
    flex: 1
  },
  completedTag: {
    marginTop: '0.5rem',
    color: '#38a169',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    backgroundColor: '#f0fff4',
    padding: '0.25rem 0.75rem',
    borderRadius: '1rem'
  },
  comingSoonBadge: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    backgroundColor: '#edf2f7',
    color: '#718096',
    padding: '0.25rem 0.75rem',
    borderRadius: '1rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase'
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#4299e1',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: '1.5rem',
    padding: 0,
    fontSize: '1rem'
  },
  tabBar: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.5rem',
  },
  tab: {
    flex: 1,
    padding: '0.85rem 1rem',
    borderRadius: '0.5rem',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    color: '#4a5568',
    fontWeight: 500,
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'background-color 0.15s, border-color 0.15s',
  },
  tabActive: {
    backgroundColor: '#ebf4ff',
    borderColor: '#90cdf4',
    color: '#2b6cb0',
    fontWeight: 600,
  },
  sectionContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  contentCard: {
    backgroundColor: '#ffffff',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  videoWrapper: {
    position: 'relative',
    paddingBottom: '56.25%',
    height: 0,
  },
  videoIframe: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: 'none',
  },
  articleContent: {
    padding: '1.5rem',
  },
  articleText: {
    lineHeight: 1.8,
    fontSize: '1.05rem',
    color: '#2d3748',
    margin: 0,
  }
};

export default AutismPage;
