import { SectionPage } from '../components/SectionPage';
import { Brain } from 'lucide-react';

export function QuizPage() {
  const quizzes = [
    { title: 'Your Style Profile', points: '+10', duration: '5 min' },
    { title: 'Product Preferences', points: '+15', duration: '7 min' },
    { title: 'Shopping Habits', points: '+20', duration: '10 min' },
    { title: 'Advanced Personality', points: '+30', duration: '15 min' },
  ];

  return (
    <SectionPage
      title="Personality Quiz"
      points="+5-30"
      description="Take fun quizzes to help us understand you better and get personalized recommendations. Earn more points for longer quizzes!"
      color="from-purple-500 via-pink-500 to-rose-500"
      icon={<Brain className="text-white" />}
      content={
        <div className="space-y-4">
          <h3 className="text-white text-lg font-semibold mb-4">Available Quizzes:</h3>
          {quizzes.map((quiz, index) => (
            <div 
              key={index}
              className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10 hover:border-purple-500/50 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-semibold">{quiz.title}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">{quiz.points}</span>
                  <div className="w-4 h-4 rounded bg-emerald-400/80" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">{quiz.duration}</span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-500 text-sm">Not started</span>
              </div>
            </div>
          ))}
        </div>
      }
    />
  );
}
