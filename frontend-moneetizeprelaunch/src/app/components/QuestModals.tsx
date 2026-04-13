import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Share2, Star, MessageSquare, Camera, TrendingUp } from 'lucide-react';
import gemIcon from 'figma:asset/296d8aa06fd9c7e60192bc7368a4a032ec5bc17e.png';
import { completeQuest, incrementQuestProgress, getQuestById } from '../utils/questManager';

interface QuestModalProps {
  questId: number;
  onClose: () => void;
  onComplete?: () => void;
}

// Personality Quiz Modal
export function PersonalityQuizModal({ questId, onClose, onComplete }: QuestModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const quest = getQuestById(questId);

  const questions = [
    {
      question: "What's your ideal way to spend a weekend?",
      options: [
        "Exploring new places and adventures",
        "Relaxing at home with a good book",
        "Socializing with friends and family",
        "Working on a personal project"
      ]
    },
    {
      question: "Which describes your shopping style?",
      options: [
        "I research thoroughly before buying",
        "I follow my gut feeling",
        "I ask friends for recommendations",
        "I look for the best deals"
      ]
    },
    {
      question: "What motivates you most?",
      options: [
        "Achieving goals and success",
        "Helping others",
        "Learning new things",
        "Financial security"
      ]
    },
    {
      question: "How do you make decisions?",
      options: [
        "Logic and data",
        "Intuition and feelings",
        "Consulting with others",
        "Pros and cons list"
      ]
    }
  ];

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers, answerIndex];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Quiz complete
      setTimeout(() => {
        completeQuest(questId);
        onComplete?.();
        onClose();
      }, 500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-[#1a2847] to-[#0f1623] rounded-3xl p-6 w-full max-w-md border border-white/10"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-bold">Personality Quiz</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
            />
          </div>
        </div>

        {/* Question */}
        <div className="mb-6">
          <h3 className="text-white text-lg font-semibold mb-4">
            {questions[currentQuestion].question}
          </h3>

          {/* Options */}
          <div className="space-y-3">
            {questions[currentQuestion].options.map((option, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAnswer(index)}
                className="w-full text-left p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-xl text-white transition-all"
              >
                {option}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Reward Info */}
        <div className="flex items-center justify-center gap-2 text-emerald-400">
          <span className="font-bold">+{quest?.points}</span>
          <img src={gemIcon} alt="points" className="w-5 h-5" />
        </div>
      </motion.div>
    </motion.div>
  );
}

// Daily Check-in Modal
export function DailyCheckInModal({ questId, onClose, onComplete }: QuestModalProps) {
  const [checking, setChecking] = useState(false);
  const quest = getQuestById(questId);

  const handleCheckIn = () => {
    setChecking(true);
    setTimeout(() => {
      completeQuest(questId);
      onComplete?.();
      setTimeout(onClose, 1000);
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-[#1a2847] to-[#0f1623] rounded-3xl p-8 w-full max-w-md border border-white/10"
      >
        <div className="text-center">
          <motion.div
            animate={checking ? { scale: [1, 1.2, 1], rotate: [0, 360] } : {}}
            transition={{ duration: 1 }}
            className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center"
          >
            {checking ? (
              <Check className="w-10 h-10 text-white" />
            ) : (
              <span className="text-3xl">✓</span>
            )}
          </motion.div>

          <h2 className="text-white text-2xl font-bold mb-2">Daily Check-In</h2>
          <p className="text-gray-400 mb-6">
            {checking ? 'Checking in...' : 'Complete your daily check-in to earn points!'}
          </p>

          <div className="flex items-center justify-center gap-2 text-emerald-400 mb-6">
            <span className="text-2xl font-bold">+{quest?.points}</span>
            <img src={gemIcon} alt="points" className="w-6 h-6" />
          </div>

          {!checking && (
            <button
              onClick={handleCheckIn}
              className="w-full bg-white text-black py-3 rounded-full font-bold hover:bg-gray-100 transition-colors"
            >
              Check In Now
            </button>
          )}

          {checking && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-emerald-400 font-semibold"
            >
              Completed! ✨
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Share Products Modal
export function ShareProductsModal({ questId, onClose, onComplete }: QuestModalProps) {
  const quest = getQuestById(questId);
  const [shareCount, setShareCount] = useState(quest?.progress || 0);
  const required = quest?.requirement || 3;

  const handleShare = () => {
    const newCount = shareCount + 1;
    setShareCount(newCount);
    incrementQuestProgress(questId);

    if (newCount >= required) {
      setTimeout(() => {
        onComplete?.();
        onClose();
      }, 1000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-[#1a2847] to-[#0f1623] rounded-3xl p-8 w-full max-w-md border border-white/10"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-bold">Share Products</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="text-center mb-6">
          <Share2 className="w-16 h-16 mx-auto mb-4 text-blue-500" />
          <p className="text-gray-400 mb-4">
            Share {required} products to complete this quest
          </p>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Progress</span>
              <span>{shareCount} / {required}</span>
            </div>
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(shareCount / required) * 100}%` }}
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-emerald-400 mb-6">
            <span className="text-2xl font-bold">+{quest?.points}</span>
            <img src={gemIcon} alt="points" className="w-6 h-6" />
          </div>
        </div>

        {shareCount < required && (
          <button
            onClick={handleShare}
            className="w-full bg-blue-600 text-white py-3 rounded-full font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            Share a Product ({shareCount + 1}/{required})
          </button>
        )}

        {shareCount >= required && (
          <div className="text-center text-emerald-400 font-bold text-lg">
            Quest Completed! 🎉
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// Review Items Modal
export function ReviewItemsModal({ questId, onClose, onComplete }: QuestModalProps) {
  const quest = getQuestById(questId);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [reviewCount, setReviewCount] = useState(quest?.progress || 0);
  const required = quest?.requirement || 2;

  const handleSubmitReview = () => {
    if (rating === 0 || review.trim().length < 10) return;

    const newCount = reviewCount + 1;
    setReviewCount(newCount);
    incrementQuestProgress(questId);
    
    // Reset form
    setRating(0);
    setReview('');

    if (newCount >= required) {
      setTimeout(() => {
        onComplete?.();
        onClose();
      }, 1000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-[#1a2847] to-[#0f1623] rounded-3xl p-6 w-full max-w-md border border-white/10 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-bold">Review Products</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Reviews Submitted</span>
            <span>{reviewCount} / {required}</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${(reviewCount / required) * 100}%` }}
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
            />
          </div>
        </div>

        {reviewCount < required && (
          <>
            {/* Rating */}
            <div className="mb-4">
              <label className="text-white text-sm font-semibold mb-2 block">Rating</label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Review Text */}
            <div className="mb-6">
              <label className="text-white text-sm font-semibold mb-2 block">Your Review</label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share your thoughts about this product..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 min-h-[100px] resize-none focus:outline-none focus:border-purple-500/50"
                maxLength={500}
              />
              <p className="text-gray-500 text-xs mt-1">{review.length}/500 characters</p>
            </div>

            <button
              onClick={handleSubmitReview}
              disabled={rating === 0 || review.trim().length < 10}
              className="w-full bg-yellow-600 text-white py-3 rounded-full font-bold hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Review ({reviewCount + 1}/{required})
            </button>
          </>
        )}

        {reviewCount >= required && (
          <div className="text-center">
            <Check className="w-16 h-16 mx-auto mb-4 text-emerald-400" />
            <p className="text-emerald-400 font-bold text-lg mb-4">Quest Completed! 🎉</p>
            <div className="flex items-center justify-center gap-2 text-emerald-400">
              <span className="text-2xl font-bold">+{quest?.points}</span>
              <img src={gemIcon} alt="points" className="w-6 h-6" />
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// Survey Modal
export function SurveyModal({ questId, onClose, onComplete }: QuestModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const quest = getQuestById(questId);

  const surveyQuestions = [
    {
      question: "How often do you shop online?",
      type: "single",
      options: ["Daily", "Weekly", "Monthly", "Rarely"]
    },
    {
      question: "What product categories interest you most? (Select all that apply)",
      type: "multiple",
      options: ["Electronics", "Fashion", "Home & Garden", "Health & Fitness", "Books", "Sports"]
    },
    {
      question: "How important is price when making a purchase?",
      type: "single",
      options: ["Very Important", "Somewhat Important", "Not Very Important", "Not Important"]
    }
  ];

  const handleNext = (answer: string) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (currentQuestion < surveyQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Survey complete
      setTimeout(() => {
        completeQuest(questId);
        onComplete?.();
        onClose();
      }, 500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-[#1a2847] to-[#0f1623] rounded-3xl p-6 w-full max-w-md border border-white/10"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-bold">Quick Survey</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Question {currentQuestion + 1} of {surveyQuestions.length}</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${((currentQuestion + 1) / surveyQuestions.length) * 100}%` }}
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
            />
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-white text-lg font-semibold mb-4">
            {surveyQuestions[currentQuestion].question}
          </h3>

          <div className="space-y-3">
            {surveyQuestions[currentQuestion].options.map((option, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNext(option)}
                className="w-full text-left p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/50 rounded-xl text-white transition-all"
              >
                {option}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-emerald-400">
          <span className="font-bold">+{quest?.points}</span>
          <img src={gemIcon} alt="points" className="w-5 h-5" />
        </div>
      </motion.div>
    </motion.div>
  );
}

// Content Creation Modal
export function ContentCreationModal({ questId, onClose, onComplete }: QuestModalProps) {
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const quest = getQuestById(questId);

  const handlePost = () => {
    if (content.trim().length < 20) return;

    setPosting(true);
    setTimeout(() => {
      completeQuest(questId);
      onComplete?.();
      setTimeout(onClose, 1000);
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-[#1a2847] to-[#0f1623] rounded-3xl p-6 w-full max-w-md border border-white/10"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-bold">Create Content</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <Camera className="w-16 h-16 mx-auto mb-4 text-purple-500" />
          <p className="text-gray-400 text-center mb-4">
            Share your thoughts, experiences, or product recommendations!
          </p>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? Share with the community..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 min-h-[150px] resize-none focus:outline-none focus:border-purple-500/50"
            maxLength={1000}
            disabled={posting}
          />
          <p className="text-gray-500 text-xs mt-2">{content.length}/1000 characters</p>
        </div>

        <div className="flex items-center justify-center gap-2 text-emerald-400 mb-6">
          <span className="text-2xl font-bold">+{quest?.points}</span>
          <img src={gemIcon} alt="points" className="w-6 h-6" />
        </div>

        <button
          onClick={handlePost}
          disabled={content.trim().length < 20 || posting}
          className="w-full bg-purple-600 text-white py-3 rounded-full font-bold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {posting ? 'Posting...' : 'Post Content'}
        </button>

        {posting && (
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-emerald-400 text-center mt-4 font-semibold"
          >
            Quest Completed! ✨
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
}

// Portfolio Activity Modal
export function PortfolioActivityModal({ questId, onClose, onComplete }: QuestModalProps) {
  const [amount, setAmount] = useState('');
  const [participating, setParticipating] = useState(false);
  const quest = getQuestById(questId);

  const handleParticipate = () => {
    if (!amount || parseFloat(amount) < 10) return;

    setParticipating(true);
    setTimeout(() => {
      completeQuest(questId);
      onComplete?.();
      setTimeout(onClose, 1000);
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-[#1a2847] to-[#0f1623] rounded-3xl p-8 w-full max-w-md border border-white/10"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-bold">Portfolio Activity</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="text-center mb-6">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 text-blue-500" />
          <p className="text-gray-400 mb-6">
            Participate in your product portfolio to complete this quest
          </p>

          <div className="mb-6">
            <label className="text-white text-sm font-semibold mb-2 block">Investment Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-8 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                min="10"
                step="0.01"
                disabled={participating}
              />
            </div>
            <p className="text-gray-500 text-xs mt-2">Minimum: $10.00</p>
          </div>

          <div className="flex items-center justify-center gap-2 text-emerald-400 mb-6">
            <span className="text-2xl font-bold">+{quest?.points}</span>
            <img src={gemIcon} alt="points" className="w-6 h-6" />
          </div>
        </div>

        <button
          onClick={handleParticipate}
          disabled={!amount || parseFloat(amount) < 10 || participating}
          className="w-full bg-blue-600 text-white py-3 rounded-full font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {participating ? 'Processing...' : 'Participate Now'}
        </button>

        {participating && (
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-emerald-400 text-center mt-4 font-semibold"
          >
            Quest Completed! ✨
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
}
