import React from 'react';
import { useNavigate } from 'react-router-dom';
import GamePlayer from '../common/GamePlayer';

const LearningDisability: React.FC = () => {
  const navigate = useNavigate();

  return (
    <GamePlayer 
      mode="dyslexia" 
      title="Dyslexia & Literacy Lab" 
      onBack={() => navigate('/home')} 
    />
  );
};

export default LearningDisability;
