import React from 'react';
import { useNavigate } from 'react-router-dom';
import LearningLibrary from '../common/LearningLibrary';
import type { CourseType } from '../common/LearningLibrary';

const DYSLEXIA_COURSES: CourseType[] = [
  {
    id: 'core-literacy-lab',
    title: 'Literacy Lab',
    description: 'Our primary interactive game for phonics and word recognition.',
    icon: '📚',
    isGame: true,
    sections: []
  },
  {
    id: 'dys-reading-strategies',
    title: 'Reading Strategies',
    description: 'Techniques for decoding complex words and improving fluency.',
    icon: '📖',
    sections: [
      {
        id: 'strat-1',
        title: 'Introduction to Decoding',
        type: 'article',
        content: 'Decoding is the ability to apply your knowledge of letter-sound relationships, including knowledge of letter patterns, to correctly pronounce written words.'
      }
    ]
  }
];

const Dyslexia: React.FC = () => {
  const navigate = useNavigate();

  return (
    <LearningLibrary
      profile="learning" // Internal key is 'learning', but labels show 'Dyslexia'
      title="Dyslexia Learning Center"
      subtitle="Master reading and writing through interactive tools."
      coreCourses={DYSLEXIA_COURSES}
      accentColor="#38bdf8"
      onBack={() => navigate('/home')}
    />
  );
};

export default Dyslexia;
