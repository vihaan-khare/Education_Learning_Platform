import React from 'react';
import LearningLibrary from '../common/LearningLibrary';
import type { CourseType } from '../common/LearningLibrary';

const ADHD_COURSES: CourseType[] = [
  {
    id: 'core-focus-lab',
    title: 'Focus Center',
    description: 'A dedicated environment to practice attention spans and focus.',
    icon: '🎯',
    isGame: true,
    sections: []
  },
  {
    id: 'adhd-time-management',
    title: 'Time Management',
    description: 'Visual techniques for managing schedules and reducing procrastination.',
    icon: '⏳',
    sections: [
      {
        id: 'time-1',
        title: 'The Pomodoro Technique',
        type: 'article',
        content: 'Break your work into 25-minute intervals, separated by short breaks. This helps manage cognitive load.'
      }
    ]
  }
];

interface AdhdPageProps {
  onBack: () => void;
}

const AdhdPage: React.FC<AdhdPageProps> = ({ onBack }) => {
  return (
    <LearningLibrary
      profile="adhd"
      title="ADHD Learning Center"
      subtitle="Tools and strategies to help you stay focused and productive."
      coreCourses={ADHD_COURSES}
      accentColor="#f97316"
      onBack={onBack}
    />
  );
};

export default AdhdPage;
