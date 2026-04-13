import { SectionPage } from '../components/SectionPage';
import { UserPlus } from 'lucide-react';

export function SignupPage() {
  return (
    <SectionPage
      title="Signing Up"
      points="+10"
      description="Create your account and start your journey. Get rewarded just for joining our community!"
      color="from-blue-500 via-purple-500 to-pink-500"
      icon={<UserPlus className="text-white" />}
      content={
        <div className="space-y-6">
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-white text-lg font-semibold mb-3">What you get:</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">✓</span>
                <span>Instant 10 points bonus</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">✓</span>
                <span>Access to exclusive features</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">✓</span>
                <span>Personalized recommendations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">✓</span>
                <span>Track your progress and rewards</span>
              </li>
            </ul>
          </div>
          
          <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-full font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-xl">
            Complete Signup
          </button>
        </div>
      }
    />
  );
}
