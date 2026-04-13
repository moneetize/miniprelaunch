import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { useEffect } from 'react';
import Logotype from '../../imports/Logotype';

export function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-navigate to welcome screen after 4 seconds
    const timer = setTimeout(() => {
      navigate('/welcome');
    }, 4000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-black flex items-center justify-center px-6 sm:px-8">
      <div className="relative">
        {/* Glowing background effect */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/30 rounded-full blur-[120px]"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: [0, 0.6, 0.4],
            scale: [0.5, 1.3, 1.2]
          }}
          transition={{ 
            duration: 1.5,
            ease: "easeOut"
          }}
        />
        
        {/* Logo with zoom and pulse animation */}
        <motion.div
          className="relative mx-auto overflow-hidden"
          style={{ width: '200px', height: '50px' }}
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ 
            opacity: 1,
            scale: [0.3, 1.1, 1, 1.05, 1, 1.05, 1],
          }}
          transition={{ 
            duration: 4,
            ease: "easeInOut",
            times: [0, 0.3, 0.4, 0.6, 0.7, 0.9, 1],
            repeat: Infinity,
            repeatDelay: 0
          }}
        >
          <div className="absolute top-0 left-0 origin-top-left" style={{ transform: 'scale(0.38)' }}>
            <Logotype />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
