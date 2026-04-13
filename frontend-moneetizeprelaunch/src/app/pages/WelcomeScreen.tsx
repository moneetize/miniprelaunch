import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import SembolVariants from '../../imports/SembolVariants';
import { startScratchTeaser } from '../utils/flowManager';

export function WelcomeScreen() {
  const navigate = useNavigate();

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
      {/* Auth background */}
      <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(180deg,#5c9360_0%,#23472a_15%,#07120d_40%,#050607_100%)]">
        <div className="absolute left-1/2 top-[118px] h-[360px] w-[560px] -translate-x-1/2 rounded-full bg-black/50 blur-[92px]" />
        <div className="absolute inset-x-0 bottom-0 h-[58%] bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.78)_24%,#050607_100%)]" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 w-full h-full overflow-y-auto overflow-x-hidden">
      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 h-11 flex items-center justify-between px-9 text-white text-sm z-50">
        <div className="flex items-center gap-2">
          <span className="font-semibold">9:41</span>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3" fill="currentColor" viewBox="0 0 16 12">
            <rect width="14" height="10" x="1" y="1" rx="1.5" stroke="currentColor" fill="none" strokeWidth="1.5" />
            <rect width="3" height="3" x="2.5" y="3.5" rx="0.5" />
            <rect width="3" height="3" x="6.5" y="3.5" rx="0.5" />
            <rect width="3" height="3" x="10.5" y="3.5" rx="0.5" />
          </svg>
          <svg className="w-3.5 h-3" fill="currentColor" viewBox="0 0 16 12">
            <rect width="14" height="10" x="1" y="1" rx="1.5" stroke="currentColor" fill="none" strokeWidth="1.5" />
          </svg>
          <div className="flex items-center">
            <svg className="w-5 h-4" fill="none" viewBox="0 0 24 18">
              <rect width="18" height="12" x="1" y="3" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M20 7v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-[10px] bg-yellow-500 text-black px-1 rounded ml-0.5 font-bold">32</span>
          </div>
        </div>
      </div>

      {/* Dynamic Island */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[126px] h-[30px] bg-black rounded-full z-40 shadow-[inset_28px_0_42px_rgba(255,255,255,0.03)]" />

      {/* Content Container */}
      <div className="flex min-h-full flex-col items-center px-[15px] pb-12 pt-[106px]">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.86, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45 }}
          className="mb-[82px]"
        >
          <div className="h-[72px] w-[72px]">
            <SembolVariants />
          </div>
        </motion.div>

        {/* Welcome Text */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-[84px] text-center"
        >
          <h1 className="mb-2 text-[30px] font-black leading-none tracking-[-0.05em] text-white">
            Welcome
          </h1>
          <h2 className="mb-4 text-[30px] font-black leading-none tracking-[-0.05em] text-white">
            to Moneetize
          </h2>
          <p className="px-4 text-[14px] font-semibold leading-[1.35] text-white/48">
            Your Gateway to
          </p>
          <p className="px-4 text-[14px] font-semibold leading-[1.35] text-white/48">
            Product-Backed Income
          </p>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-[372px] space-y-[13px]"
        >
          <button
            onClick={() => {
              startScratchTeaser('register');
              navigate('/scratch-and-win');
            }}
            className="mx-auto block h-[54px] w-[158px] rounded-full bg-white text-[14px] font-black text-black shadow-[0_14px_40px_rgba(0,0,0,0.34)] transition-colors hover:bg-gray-100"
          >
            Get Started
          </button>

          <button
            onClick={() => navigate('/login')}
            className="mx-auto block h-[52px] w-[128px] rounded-full bg-white/10 text-[15px] font-black text-white/48 shadow-[0_14px_40px_rgba(0,0,0,0.34)] transition-colors hover:bg-white hover:text-black"
          >
            Sign in
          </button>
        </motion.div>
      </div>
      </div>
    </div>
  );
}
