import { useState } from 'react';
import { RewardsScreen } from '../components/RewardsScreen';
import { useNavigate } from 'react-router';

export function RewardsPage() {
  const [currentPage, setCurrentPage] = useState(4);
  const totalPages = 5;
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
    navigate('/discovery');
  };

  const handleBack = () => {
    navigate('/onboarding-dashboard');
  };

  const handleSkip = () => {
    navigate('/discovery');
  };

  return (
    <RewardsScreen 
      currentPage={currentPage}
      totalPages={totalPages}
      onNext={handleNext}
      onBack={handleBack}
      onSkip={handleSkip}
    />
  );
}
