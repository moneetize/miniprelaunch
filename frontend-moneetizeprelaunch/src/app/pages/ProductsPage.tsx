import { SectionPage } from '../components/SectionPage';
import { Eye } from 'lucide-react';

export function ProductsPage() {
  return (
    <SectionPage
      title="Hidden Products"
      points="+10"
      description="Discover exclusive and hidden products that are not visible to everyone. Unlock them by reaching certain levels!"
      color="from-cyan-500 via-blue-500 to-indigo-500"
      icon={<Eye className="text-white" />}
      content={
        <div className="space-y-6">
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-white text-lg font-semibold mb-4">How it works:</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">1.</span>
                <span>Explore different categories and collections</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">2.</span>
                <span>Find hidden products marked with a special badge</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">3.</span>
                <span>Click to reveal and earn instant points</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">4.</span>
                <span>Higher levels unlock more exclusive finds</span>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl p-4 border border-cyan-500/30 text-center">
              <p className="text-cyan-400 text-2xl font-bold mb-1">12</p>
              <p className="text-gray-400 text-sm">Hidden Products</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl p-4 border border-indigo-500/30 text-center">
              <p className="text-indigo-400 text-2xl font-bold mb-1">5</p>
              <p className="text-gray-400 text-sm">Discovered</p>
            </div>
          </div>

          <button className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-4 rounded-full font-semibold text-lg hover:from-cyan-700 hover:to-blue-700 transition-all shadow-xl">
            Start Exploring
          </button>
        </div>
      }
    />
  );
}
