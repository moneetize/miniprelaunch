import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';
import gemIcon from 'figma:asset/296d8aa06fd9c7e60192bc7368a4a032ec5bc17e.png';

interface ToastData {
  questId: number;
  points: number;
  title: string;
}

export function QuestToast() {
  const [toast, setToast] = useState<ToastData | null>(null);

  useEffect(() => {
    const handleQuestComplete = (event: CustomEvent<ToastData>) => {
      setToast(event.detail);
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        setToast(null);
      }, 3000);
    };

    window.addEventListener('questCompleted', handleQuestComplete as EventListener);

    return () => {
      window.removeEventListener('questCompleted', handleQuestComplete as EventListener);
    };
  }, []);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.8 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
        >
          <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl p-4 shadow-2xl border border-emerald-400/30 min-w-[300px]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-sm">Quest Completed!</h3>
                <p className="text-emerald-100 text-xs">{toast.title.replace(/\\n/g, ' ')}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-white font-bold text-lg">+{toast.points}</span>
                <img src={gemIcon} alt="points" className="w-6 h-6" />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
