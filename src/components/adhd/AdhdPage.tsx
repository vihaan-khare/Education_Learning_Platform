import React from 'react';
import GamePlayer from '../common/GamePlayer';

interface AdhdPageProps {
  onBack: () => void;
}

const AdhdPage: React.FC<AdhdPageProps> = ({ onBack }) => {
  return (
    <GamePlayer 
      mode="adhd" 
      title="ADHD Focus & Learning Center" 
      onBack={onBack} 
    />
  );
};

export default AdhdPage;
