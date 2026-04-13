import { SectionPage } from '../components/SectionPage';
import { PenTool } from 'lucide-react';

export function ContentPage() {
  const contentTypes = [
    { type: 'Photo Upload', points: '+5', icon: '📸' },
    { type: 'Video Review', points: '+10', icon: '🎥' },
    { type: 'Blog Post', points: '+15', icon: '✍️' },
    { type: 'Tutorial', points: '+20', icon: '🎓' },
  ];

  return (
    <SectionPage
      title="Content Creation"
      points="+5"
      description="Share your creativity! Upload photos, videos, reviews, and more. The community loves original content."
      color="from-yellow-500 via-orange-500 to-red-500"
      icon={<PenTool className="text-white" />}
      content={
        <div className="space-y-4">
          <h3 className="text-white text-lg font-semibold mb-4">Create Content:</h3>
          {contentTypes.map((content, index) => (
            <div 
              key={index}
              className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10 hover:border-yellow-500/50 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{content.icon}</span>
                  <span className="text-white font-medium">{content.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">{content.points}</span>
                  <div className="w-4 h-4 rounded bg-emerald-400/80" />
                </div>
              </div>
            </div>
          ))}

          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl p-6 border border-yellow-500/20 mt-6">
            <p className="text-yellow-400 text-center text-sm">
              💡 Pro tip: High-quality content can earn bonus points!
            </p>
          </div>
        </div>
      }
    />
  );
}
