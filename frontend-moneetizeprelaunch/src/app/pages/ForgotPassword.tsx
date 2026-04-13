import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { AtSign } from 'lucide-react';
import SembolVariants from '../../imports/SembolVariants';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

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

      <div className="min-h-full px-[15px] pb-12 pt-[106px] sm:px-6">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.86, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45 }}
          className="mb-[170px] flex justify-center"
        >
          <div className="h-[72px] w-[72px]">
            <SembolVariants />
          </div>
        </motion.div>

        {!isSubmitted ? (
          <>
            {/* Title */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-[24px] text-center"
            >
              <h1 className="mb-[12px] text-[22px] font-black leading-none tracking-[-0.04em] text-white">Forgot Password</h1>
              <p className="mx-auto max-w-[320px] text-center text-[14px] font-semibold leading-[1.35] text-white/48">
                Enter your email address to receive a reset link and regain access to your account.
              </p>
            </motion.div>

            {/* Form */}
            <motion.form
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              onSubmit={handleSubmit}
              className="mx-auto w-full max-w-[372px]"
            >
              {/* Email Input */}
              <div className="relative">
                <div className="absolute left-[18px] top-1/2 z-10 -translate-y-1/2 text-white/68">
                  <AtSign className="h-[18px] w-[18px]" />
                </div>
                <input
                  type="email"
                  placeholder="user@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-[54px] w-full rounded-full border border-white/5 bg-[#181a1d]/90 pl-[46px] pr-5 text-[14px] font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_18px_40px_rgba(0,0,0,0.32)] outline-none transition-colors placeholder:text-white/45 focus:border-white/14"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="mx-auto mt-[171px] block h-[54px] w-[130px] rounded-full bg-white text-[14px] font-black text-black shadow-[0_14px_40px_rgba(0,0,0,0.34)] transition-colors hover:bg-gray-100"
              >
                Continue
              </button>
            </motion.form>
          </>
        ) : (
          /* Success Message */
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center max-w-md mx-auto"
          >
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-white text-2xl sm:text-3xl font-bold mb-4">Check Your Email</h2>
            <p className="text-gray-300 text-sm sm:text-base mb-8 px-4">
              We've sent password reset instructions to <span className="text-white font-semibold">{email}</span>
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mx-auto block h-[54px] w-[150px] rounded-full bg-white text-[14px] font-black text-black shadow-[0_14px_40px_rgba(0,0,0,0.34)] transition-colors hover:bg-gray-100"
            >
              Back to Login
            </button>
          </motion.div>
        )}
      </div>
      </div>
    </div>
  );
}
