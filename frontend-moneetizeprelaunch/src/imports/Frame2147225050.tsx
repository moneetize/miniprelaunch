import svgPaths from "./svg-log8tmtvcj";

function Symbol() {
  return (
    <div className="absolute inset-[22.47%]" data-name="Symbol">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 46.2504 46.2487">
        <g id="Symbol">
          <path d={svgPaths.p3a600080} fill="url(#paint0_linear_179_1847)" id="<" />
          <path d={svgPaths.p2967a000} fill="var(--fill-0, #0E0F12)" id=">" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_179_1847" x1="46.2504" x2="16.2473" y1="23.1254" y2="23.1244">
            <stop stopColor="#0E0F12" />
            <stop offset="1" stopColor="white" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex flex-col gap-[32px] items-center relative shrink-0 text-center w-full">
      <div className="font-['Bricolage_Grotesque:96pt_ExtraBold',sans-serif] font-extrabold leading-[0.9] relative shrink-0 text-[48px] text-white w-full" style={{ fontVariationSettings: "'opsz' 96, 'wdth' 100" }}>
        <p className="mb-0">Welcome</p>
        <p>to Moneetize</p>
      </div>
      <div className="font-['Rethink_Sans:Medium',sans-serif] font-medium leading-[1.25] relative shrink-0 text-[20px] text-[rgba(255,255,255,0.6)] w-full">
        <p className="mb-0">Your Gateway to</p>
        <p>Product-Backed Income</p>
      </div>
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-center relative shrink-0 w-[275px]">
      <div className="bg-white content-stretch flex gap-[10px] h-[60px] items-center justify-center px-[32px] py-[24px] relative rounded-[100px] shrink-0" data-name="Main buttons">
        <div className="flex flex-col font-['Rethink_Sans:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#0e0f12] text-[16px] text-center whitespace-nowrap">
          <p className="leading-[1.1]">Create an Account</p>
        </div>
      </div>
      <div className="content-stretch flex h-[60px] items-center justify-center px-[32px] py-[24px] relative rounded-[100px] shrink-0 w-[199px]" data-name="Main buttons">
        <div className="flex flex-col font-['Rethink_Sans:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[16px] text-center text-white whitespace-nowrap">
          <p className="leading-[1.1]">Sign in</p>
        </div>
      </div>
    </div>
  );
}

export default function Frame2() {
  return (
    <div className="content-stretch flex flex-col items-center justify-between px-[16px] py-[120px] relative size-full">
      <div className="overflow-clip relative shrink-0 size-[84px]" data-name="Sembol variants">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 84 84">
          <path d={svgPaths.p1d031980} fill="var(--fill-0, white)" id="BG Form" />
        </svg>
        <Symbol />
      </div>
      <Frame1 />
      <Frame />
    </div>
  );
}