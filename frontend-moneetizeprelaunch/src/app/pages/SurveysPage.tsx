import { SectionPage } from '../components/SectionPage';
import { BarChart3 } from 'lucide-react';

export function SurveysPage() {
  const surveys = [
    { title: 'User Experience Feedback', points: '+10', time: '3 min', status: 'New' },
    { title: 'Product Satisfaction Survey', points: '+15', time: '5 min', status: 'New' },
    { title: 'Feature Request Poll', points: '+5', time: '2 min', status: 'New' },
    { title: 'Monthly Community Check-in', points: '+20', time: '8 min', status: 'Featured' },
  ];

  return (
    <SectionPage
      title="Surveys & Polls"
      points="+10"
      description="Your opinion matters! Participate in surveys and polls to help shape the future of our platform and earn points."
      color="from-rose-500 via-pink-500 to-fuchsia-500"
      icon={<BarChart3 className="text-white" />}
      content={
        <div className="space-y-4">
          <h3 className="text-white text-lg font-semibold mb-4">Active Surveys:</h3>
          {surveys.map((survey, index) => (
            <div 
              key={index}
              className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10 hover:border-pink-500/50 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-white font-semibold">{survey.title}</h4>
                    {survey.status === 'Featured' && (
                      <span className="text-xs bg-pink-500/20 text-pink-400 px-2 py-1 rounded-full">
                        {survey.status}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">{survey.time}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">{survey.points}</span>
                  <div className="w-4 h-4 rounded bg-emerald-400/80" />
                </div>
              </div>
              <button className="w-full bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                Start Survey
              </button>
            </div>
          ))}

          <div className="bg-gradient-to-br from-pink-500/10 to-fuchsia-500/10 rounded-xl p-6 border border-pink-500/20 mt-6">
            <div className="text-center">
              <p className="text-pink-400 text-sm mb-2">🎯 This Week's Goal</p>
              <p className="text-white font-semibold">Complete 3 surveys to unlock a bonus reward!</p>
            </div>
          </div>
        </div>
      }
    />
  );
}
