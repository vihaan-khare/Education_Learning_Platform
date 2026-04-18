import React from 'react';
import { useNavigate } from 'react-router-dom';
import GamePlayer from '../common/GamePlayer';

const Dyslexia: React.FC = () => {
  const navigate = useNavigate();

  return (
    <GamePlayer 
      mode="dyslexia" 
      title="Dyslexia" 
      onBack={() => navigate('/home')} 
    />
  );
};

export default Dyslexia;
