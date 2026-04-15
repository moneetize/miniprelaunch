import { Outlet } from 'react-router';

export default function Root() {
  return (
    <div className="fixed inset-0 flex h-[100dvh] w-[100dvw] items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-800">
      {/* Mobile Container */}
      <div className="relative h-full min-h-0 w-full max-w-full overflow-hidden rounded-none border-0 bg-[#0a0e1a] shadow-2xl sm:max-h-[932px] sm:max-w-[430px] md:rounded-3xl md:border md:border-white/10">
        <Outlet />
      </div>
    </div>
  );
}
