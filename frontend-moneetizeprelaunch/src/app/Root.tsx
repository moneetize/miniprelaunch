import { Outlet } from 'react-router';

export default function Root() {
  return (
    <div className="min-h-[100dvh] w-full overflow-x-hidden bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-800 sm:flex sm:items-center sm:justify-center sm:p-4">
      <div className="relative mx-auto min-h-[100dvh] w-full max-w-[430px] overflow-hidden bg-[#0a0e1a] shadow-2xl sm:h-[min(100dvh,932px)] sm:min-h-0 sm:rounded-3xl sm:border sm:border-white/10">
        <Outlet />
      </div>
    </div>
  );
}
