import { SectionPage } from '../components/SectionPage';
import { Zap } from 'lucide-react';

export function ActionsPage() {
  const actions = [
    { name: 'Share with a friend', points: '+5' },
    { name: 'Like a product', points: '+2' },
    { name: 'Write a review', points: '+10' },
    { name: 'Follow a brand', points: '+3' },
  ];

  return (
    <SectionPage
      title="First-Time Actions"
      points="+5"
      description="Complete these actions for the first time to earn bonus points and unlock new features!"
      color="from-orange-500 via-red-500 to-pink-500"
      icon={<Zap className="text-white" />}
      content={
        <div className="space-y-4">
          <h3 className="text-white text-lg font-semibold mb-4">Available Actions:</h3>
          {actions.map((action, index) => (
            <div 
              key={index}
              className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10 flex items-center justify-between hover:border-orange-500/50 transition-all cursor-pointer"
            >
              <span className="text-white font-medium">{action.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">{action.points}</span>
                <div className="w-4 h-4 rounded bg-emerald-400/80" />
              </div>
            </div>
          ))}
        </div>
      }
    />
  );
}
