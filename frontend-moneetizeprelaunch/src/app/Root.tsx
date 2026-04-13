import { Outlet } from 'react-router';

export default function Root() {
  return (
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-800 overflow-hidden flex items-center justify-center">
      {/* Mobile Container */}
      <div className="relative w-full h-full max-w-[430px] max-h-[932px] bg-[#0a0e1a] shadow-2xl overflow-hidden rounded-none md:rounded-3xl border-0 md:border md:border-white/10">
        <Outlet />
      </div>
    </div>
  );
}