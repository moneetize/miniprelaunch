import { ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import gemIcon from 'figma:asset/296d8aa06fd9c7e60192bc7368a4a032ec5bc17e.png';
import { getSelectedAvatarImage } from '../utils/avatarUtils';

interface RewardsScreenProps {
  currentPage: number;
  totalPages: number;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

interface PointAction {
  points: string;
  label: string;
  className: string;
}

const pointActions: PointAction[] = [
  { label: 'Referring\na friend', points: '5', className: 'left-1 top-3 h-[118px] w-[118px] -rotate-[15deg]' },
  { label: 'Sharing\nwith a friend', points: '10', className: 'right-1 top-3 h-[118px] w-[118px] rotate-[16deg]' },
  { label: 'Signing\nup', points: '10', className: 'left-[-26px] top-[128px] h-[132px] w-[132px] rotate-[4deg]' },
  { label: 'Performing\na first-time action', points: '5', className: 'left-1/2 top-[78px] z-20 h-[190px] w-[190px] -translate-x-1/2 rotate-[7deg]' },
  { label: 'Daily\ncheck-in', points: '2', className: 'right-[-28px] top-[128px] h-[132px] w-[132px] -rotate-[8deg]' },
  { label: 'Taking a personality\nquiz', points: '5-30', className: 'left-0 top-[258px] h-[180px] w-[180px] -rotate-[2deg]' },
  { label: 'Discovering hidden\nproducts', points: '10', className: 'right-0 top-[258px] h-[180px] w-[180px] -rotate-[13deg]' },
  { label: 'Product portfolio\nperformance', points: '10', className: 'left-1/2 top-[425px] h-[172px] w-[172px] -translate-x-1/2 -rotate-[8deg]' },
];

export function RewardsScreen({ currentPage, totalPages, onNext, onBack, onSkip }: RewardsScreenProps) {
  return (
    <div className="absolute inset-0 h-full w-full overflow-y-auto bg-[#0a0e1a] text-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="mx-auto min-h-full w-full max-w-md overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(45,66,94,0.28),rgba(10,14,26,0)_34%),#0a0e1a]">
        <div className="sticky top-0 z-50 h-11 bg-[#0a0e1a]/80 backdrop-blur-sm">
          <div className="flex h-full items-center justify-between px-4 text-sm text-white">
            <div className="flex items-center gap-2">
              <span className="font-semibold">9:41</span>
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-3 w-4" fill="currentColor" viewBox="0 0 16 12">
                <rect width="14" height="10" x="1" y="1" rx="1.5" stroke="currentColor" fill="none" strokeWidth="1.5" />
                <rect width="3" height="3" x="2.5" y="3.5" rx="0.5" />
                <rect width="3" height="3" x="6.5" y="3.5" rx="0.5" />
                <rect width="3" height="3" x="10.5" y="3.5" rx="0.5" />
              </svg>
              <div className="flex items-center gap-0.5">
                <div className="h-1 w-1 rounded-full bg-yellow-400" />
                <div className="flex h-3.5 w-3.5 items-center justify-center rounded-sm border-2 border-white">
                  <div className="h-2 w-full rounded-sm bg-yellow-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 px-3 pb-12">
          <div className="flex items-center justify-between pt-5">
            <button
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors hover:bg-white/14"
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-bold text-white">
              {currentPage} <span className="text-white/62">/ {totalPages}</span>
            </span>
          </div>

          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.55 }}
            className="mt-2 flex justify-center"
          >
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.05, 1],
              }}
              transition={{
                rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
              }}
              className="relative h-20 w-20 overflow-hidden rounded-full"
            >
              <img src={getSelectedAvatarImage()} alt="AI Avatar" className="h-full w-full object-cover drop-shadow-2xl" />
            </motion.div>
          </motion.div>

          <motion.section
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mt-5 text-center"
          >
            <h1 className="text-[21px] font-black leading-tight text-white">Your rewards, Your Progress</h1>
            <p className="mx-auto mt-3 max-w-[310px] text-[12px] font-medium leading-relaxed text-white/62">
              Our point system rewards you for actions like sharing, completing surveys, exploring products, and more you engage, the more you unlock - levels, perks, and real rewards you can actually claim.
            </p>
          </motion.section>

          <motion.section
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="relative mx-auto mt-5 flex h-[58px] max-w-[356px] items-center justify-between overflow-hidden rounded-[14px] border border-white/10 bg-white/8 px-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_18px_52px_rgba(0,0,0,0.36)]"
          >
            <div>
              <p className="text-[11px] font-semibold text-white/62">Balance:</p>
              <p className="text-[18px] font-black text-white">10 pts</p>
            </div>
            <motion.div
              animate={{
                y: [0, -5, 0],
                rotate: [0, 4, -4, 0],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="relative h-12 w-12"
            >
              <motion.div
                className="absolute inset-0 rounded-full bg-emerald-400/65 blur-xl"
                animate={{ scale: [1, 1.24, 1], opacity: [0.55, 0.82, 0.55] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <img src={gemIcon} alt="Gem" className="relative h-full w-full object-contain" />
            </motion.div>
          </motion.section>

          <motion.section
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="-mx-3 mt-5 min-h-[430px] overflow-hidden text-center"
          >
            <h2 className="text-[13px] font-black leading-[1.25] text-white">
              Status Up
              <br />
              to Unlock Rewards!
            </h2>

            <div className="relative mx-auto mt-3 h-[294px] max-w-[420px]">
              <div className="absolute left-[-78px] top-[86px] h-40 w-40 rounded-full bg-[radial-gradient(circle,#8ed3ff_0%,rgba(84,163,255,0.54)_45%,rgba(84,163,255,0)_76%)] blur-sm opacity-80" />
              <div className="absolute right-[-78px] top-[86px] h-40 w-40 rounded-full bg-[radial-gradient(circle,#8ff0a8_0%,rgba(97,255,141,0.52)_45%,rgba(97,255,141,0)_76%)] blur-sm opacity-80" />
              <div className="absolute left-1/2 top-3 h-[212px] w-[212px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_50%_28%,rgba(255,236,141,0.9)_0%,rgba(249,179,43,0.96)_38%,rgba(219,88,0,0.96)_74%)] shadow-[0_0_46px_rgba(252,187,43,0.58)]">
                <div className="absolute inset-4 rounded-full border-[3px] border-orange-700/45" />
                <div className="absolute inset-x-0 top-[76px] text-center">
                  <p className="text-[34px] font-black leading-none text-orange-800">02</p>
                  <p className="mt-1 text-[17px] font-black text-orange-800">Level</p>
                </div>
                <div className="absolute -bottom-16 left-1/2 h-24 w-[92px] -translate-x-1/2 bg-[linear-gradient(180deg,rgba(250,187,43,0.34),rgba(250,187,43,0))]" />
              </div>
              <div className="absolute left-1/2 top-[226px] -translate-x-1/2 rounded-full border border-white/12 bg-white/10 px-6 py-2.5 text-[11px] font-black text-[#f5bf57] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_32px_rgba(0,0,0,0.28)]">
                Rookie
              </div>
            </div>

            <div className="space-y-5 text-center">
              <div>
                <p className="text-[12px] font-black text-white">Requirement</p>
                <p className="mt-1 text-[10px] font-semibold text-white/70">Sign up</p>
              </div>
              <div>
                <p className="text-[12px] font-black text-white">Unlocks</p>
                <p className="mt-1 text-[10px] font-semibold text-white/70">Access to Wishlist &amp; profile</p>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="-mx-4 mt-4 min-h-[650px] overflow-hidden px-0"
          >
            <h2 className="mb-6 text-center text-[15px] font-black text-white">How to Earn Points</h2>
            <div className="relative h-[610px]">
              {pointActions.map((action, index) => (
                <PointBubble key={action.label} action={action} index={index} />
              ))}
            </div>
          </motion.section>

          <motion.div
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.58 }}
            className="mx-auto mt-2 w-full max-w-[220px] space-y-4"
          >
            <button
              onClick={onNext}
              className="w-full rounded-full bg-white py-3.5 text-[13px] font-black text-black shadow-xl transition-colors hover:bg-gray-100"
            >
              Next
            </button>
            {onSkip && (
              <button
                onClick={onSkip}
                className="w-full text-sm font-semibold text-white/72 transition-colors hover:text-white"
              >
                Skip now
              </button>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

interface PointBubbleProps {
  action: PointAction;
  index: number;
}

function PointBubble({ action, index }: PointBubbleProps) {
  return (
    <button
      type="button"
      className={`group absolute rounded-full focus:outline-none focus:ring-2 focus:ring-white/30 ${action.className}`}
      aria-label={`Earn ${action.points} points: ${action.label.replace(/\n/g, ' ')}`}
    >
      <motion.span
        animate={{
          x: [0, index % 2 === 0 ? 14 : -13, index % 3 === 0 ? -9 : 8, 0],
          y: [0, index % 2 === 0 ? -18 : 16, index % 3 === 0 ? 12 : -11, 0],
          rotate: [0, index % 2 === 0 ? 2.8 : -2.4, index % 3 === 0 ? -1.8 : 1.7, 0],
          scale: [1, 1.055, 0.98, 1],
        }}
        transition={{
          duration: 4.8 + index * 0.38,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: index * 0.11,
        }}
        whileHover={{ scale: 1.06 }}
        className="flex h-full w-full flex-col items-center justify-center rounded-full border border-[#343760] bg-[radial-gradient(circle_at_50%_38%,#2d2d66_0%,#171842_60%,#10112c_100%)] p-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_42px_rgba(0,0,0,0.36)] transition-shadow group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_22px_54px_rgba(143,240,168,0.18)]"
        style={{ transformOrigin: '50% 50%', willChange: 'transform' }}
      >
        <span className="mb-2 flex items-center gap-1 text-base font-black text-[#8ff0a8]">
          +{action.points}
          <img src={gemIcon} alt="Gem" className="h-6 w-6" />
        </span>
        <span className="whitespace-pre-line text-[10px] font-medium leading-tight text-white/62 sm:text-sm">
          {action.label}
        </span>
      </motion.span>
    </button>
  );
}
