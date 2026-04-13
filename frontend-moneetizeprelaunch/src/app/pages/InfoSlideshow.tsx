import { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
  id: number;
  title: string;
  description: string;
  icon: string;
}

const slides: Slide[] = [
  {
    id: 1,
    title: 'Discover Hidden Products',
    description: 'Explore tokenized products curated just for you. From tech to lifestyle, find opportunities that match your interests and investment style.',
    icon: '🎯',
  },
  {
    id: 2,
    title: 'Earn Real Rewards',
    description: 'Every action counts. Share insights, complete surveys, and engage with products to earn points that unlock exclusive perks and rewards.',
    icon: '💎',
  },
  {
    id: 3,
    title: 'Build Your Portfolio',
    description: 'Track your progress and watch your investments grow. Our AI helps you make smarter decisions based on real-time data and trends.',
    icon: '📊',
  },
  {
    id: 4,
    title: 'Join a Community',
    description: 'Connect with like-minded individuals, form teams, and compete on leaderboards. Share strategies and grow together.',
    icon: '🤝',
  },
  {
    id: 5,
    title: 'Level Up Your Status',
    description: 'Climb the ranks from Rookie to Elite. Unlock new features, badges, and exclusive access as you progress through the levels.',
    icon: '🏆',
  },
];

export function InfoSlideshow() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance every 7 seconds
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      if (currentSlide < slides.length - 1) {
        setDirection(1);
        setCurrentSlide((prev) => prev + 1);
      }
    }, 7000);

    return () => clearInterval(timer);
  }, [currentSlide, isPaused]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide(currentSlide + 1);
      setIsPaused(true);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(currentSlide - 1);
      setIsPaused(true);
    }
  };

  const handleDotClick = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
    setIsPaused(true);
  };

  const handleSkip = () => {
    navigate('/onboarding-interests');
  };

  const handleContinue = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide(currentSlide + 1);
      setIsPaused(true);
    } else {
      navigate('/onboarding-interests');
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-gradient-to-b from-[#0a0e1a] via-[#0f1623] to-[#0a0e1a]">
      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 h-11 flex items-center justify-between px-4 sm:px-6 text-white text-sm z-50">
        <span className="font-semibold">9:41</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 bg-white/80 rounded-sm" />
          <div className="w-4 h-3 bg-white/80 rounded-sm" />
          <div className="w-6 h-3 bg-white/80 rounded-sm" />
        </div>
      </div>

      {/* Page Indicator & Skip Button */}
      <div className="absolute top-14 sm:top-16 left-0 right-0 flex items-center justify-between px-4 sm:px-6 z-40">
        <span className="text-white text-base sm:text-lg font-semibold">
          {currentSlide + 1} <span className="text-white/60">/ {slides.length}</span>
        </span>
        <button
          onClick={handleSkip}
          className="text-white/80 hover:text-white text-sm sm:text-base font-medium transition-colors"
        >
          Skip
        </button>
      </div>

      <div className="pt-28 sm:pt-32 pb-8 sm:pb-12 px-6 sm:px-8 h-full flex flex-col">
        {/* Slide Content */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative overflow-hidden">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="absolute inset-0 flex flex-col items-center justify-center px-4"
            >
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="text-8xl sm:text-9xl mb-8 sm:mb-12"
              >
                {slides[currentSlide].icon}
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-center px-2"
              >
                {slides[currentSlide].title}
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-400 text-sm sm:text-base leading-relaxed text-center max-w-md"
              >
                {slides[currentSlide].description}
              </motion.p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={handlePrevious}
            disabled={currentSlide === 0}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              currentSlide === 0
                ? 'bg-white/5 text-white/30 cursor-not-allowed'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Dot Indicators */}
          <div className="flex items-center justify-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`h-2 rounded-full transition-all ${
                  currentSlide === index
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={currentSlide === slides.length - 1}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              currentSlide === slides.length - 1
                ? 'bg-white/5 text-white/30 cursor-not-allowed'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Continue Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <button
            onClick={handleContinue}
            className="w-full bg-white text-black py-3.5 sm:py-4 rounded-full font-semibold text-base sm:text-lg hover:bg-gray-100 transition-colors shadow-xl"
          >
            {currentSlide === slides.length - 1 ? 'Get Started' : 'Continue'}
          </button>
        </motion.div>

        {/* Auto-advance indicator */}
        {!isPaused && currentSlide < slides.length - 1 && (
          <div className="mt-4 flex items-center justify-center">
            <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white/40"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 7, ease: 'linear' }}
                key={currentSlide}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}