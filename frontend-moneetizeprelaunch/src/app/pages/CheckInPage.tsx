import { SectionPage } from '../components/SectionPage';
import { Calendar } from 'lucide-react';

export function CheckInPage() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const checkedDays = [true, true, true, false, false, false, false];

  return (
    <SectionPage
      title="Daily Check-in"
      points="+2"
      description="Visit every day to earn points and build your streak! The longer your streak, the more bonus rewards you unlock."
      color="from-green-500 via-emerald-500 to-teal-500"
      icon={<Calendar className="text-white" />}
      content={
        <div className="space-y-6">
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-white text-lg font-semibold mb-4 text-center">This Week</h3>
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <span className="text-gray-400 text-xs">{day}</span>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    checkedDays[index] 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-white/10 text-gray-500'
                  }`}>
                    {checkedDays[index] ? '✓' : index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl p-6 border border-emerald-500/20">
            <div className="text-center">
              <p className="text-emerald-400 text-3xl font-bold mb-2">3</p>
              <p className="text-gray-300">Day Streak</p>
            </div>
          </div>

          <button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-full font-semibold text-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-xl">
            Check In Today
          </button>
        </div>
      }
    />
  );
}
