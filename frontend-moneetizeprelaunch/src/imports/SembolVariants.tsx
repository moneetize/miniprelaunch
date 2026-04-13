import svgPaths from "./svg-4be0jeh6ne";

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

export default function SembolVariants() {
  return (
    <div className="relative size-full" data-name="Sembol variants">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 84 84">
        <path d={svgPaths.p1d031980} fill="var(--fill-0, white)" id="BG Form" />
      </svg>
      <Symbol />
    </div>
  );
}