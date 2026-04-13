import svgPaths from "./svg-0cx4c174uz";
import imgEllipse7563 from "figma:asset/eab35d6bc501cd6c1c11a5c552719de680e7edd8.png";
import imgRectangle346253503 from "figma:asset/7202f4b531c68e5cbb782a32917e1fd389412ba5.png";
import { imgRectangle346253502 } from "./svg-bun96";

function Left() {
  return (
    <div className="flex-[1_0_0] h-[60px] min-h-px min-w-px relative" data-name="Left">
      <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex gap-[4px] items-center justify-center px-[42px] py-[12px] relative size-full">
          <div className="h-[14px] relative shrink-0 w-[35px]" data-name="Time">
            <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center leading-[0] left-1/2 overflow-hidden text-[17px] text-center text-ellipsis text-white top-1/2 tracking-[-0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
              <p className="leading-[14px]">9:41</p>
            </div>
          </div>
          <div className="relative shrink-0 size-[14px]" data-name="Location">
            <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[12px] top-1/2" data-name="Vector">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
                <path d={svgPaths.pd277f80} fill="var(--fill-0, white)" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Lens() {
  return (
    <div className="absolute left-[98px] size-[12px] top-[12px]" data-name="Lens">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="Lens">
          <circle cx="6" cy="6" fill="var(--fill-0, #0E101F)" id="Ellipse 1" r="6" />
          <circle cx="6" cy="6" fill="var(--fill-0, #01031A)" id="Ellipse 2" r="4.90909" />
          <g filter="url(#filter0_f_179_1205)" id="Ellipse 3">
            <ellipse cx="6" cy="3.27273" fill="var(--fill-0, white)" fillOpacity="0.1" rx="2.72727" ry="1.09091" />
          </g>
          <g filter="url(#filter1_f_179_1205)" id="Ellipse 4">
            <ellipse cx="6" cy="8.18182" fill="var(--fill-0, white)" fillOpacity="0.1" rx="2.72727" ry="1.63636" />
          </g>
        </g>
        <defs>
          <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="4.18182" id="filter0_f_179_1205" width="7.45455" x="2.27273" y="1.18182">
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
            <feGaussianBlur result="effect1_foregroundBlur_179_1205" stdDeviation="0.5" />
          </filter>
          <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="5.27273" id="filter1_f_179_1205" width="7.45455" x="2.27273" y="5.54545">
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
            <feGaussianBlur result="effect1_foregroundBlur_179_1205" stdDeviation="0.5" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}

function DynamicIsland() {
  return (
    <div className="bg-black h-[36px] overflow-clip relative rounded-[32px] shrink-0 w-[122px]" data-name="Dynamic Island">
      <Lens />
    </div>
  );
}

function Signal() {
  return (
    <div className="absolute inset-[7.14%_-2.78%_3.57%_0]" data-name="Signal">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.5 12.5">
        <g id="Signal">
          <path d={svgPaths.p32b81f0} fill="var(--fill-0, white)" id="Vector" />
          <path d={svgPaths.pa041880} fill="var(--fill-0, white)" id="Vector_2" />
          <path d={svgPaths.p29615c00} fill="var(--fill-0, white)" id="Vector_3" opacity="0.2" />
          <path d={svgPaths.pdcf4a00} fill="var(--fill-0, white)" id="Vector_4" opacity="0.2" />
        </g>
      </svg>
    </div>
  );
}

function Right() {
  return (
    <div className="flex-[1_0_0] h-[60px] min-h-px min-w-px relative" data-name="Right">
      <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex gap-[10px] items-center justify-center px-[28px] py-[12px] relative size-full">
          <div className="h-[14px] relative shrink-0 w-[18px]" data-name="Network">
            <Signal />
          </div>
          <div className="h-[14px] relative shrink-0 w-[18px]" data-name="Data">
            <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[11.14px] left-1/2 top-[calc(50%+0.27px)] w-[19.261px]" data-name="Vector">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.2612 11.1401">
                <path d={svgPaths.p26da1d80} fill="var(--fill-0, white)" id="Vector" />
              </svg>
            </div>
          </div>
          <div className="h-[14px] relative shrink-0 w-[27px]" data-name="Battery">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 27 14">
              <g id="Vector" opacity="0.3">
                <path d={svgPaths.p33066e00} fill="var(--fill-0, white)" />
                <path d={svgPaths.p241a6080} fill="var(--fill-0, white)" />
              </g>
            </svg>
            <div className="absolute inset-[0_63.41%_0_0]" data-name="Vector">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.87925 14">
                <path d={svgPaths.p14c441c0} fill="var(--fill-0, #F7CE45)" id="Vector" />
              </svg>
            </div>
            <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['SF_Pro:Bold',sans-serif] font-bold justify-center leading-[0] left-[13px] text-[11px] text-black text-center top-[7px] tracking-[-0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
              <p className="leading-[14px]">32</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute h-[20px] left-[0.53px] top-0 w-[18.851px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.851 20.0003">
        <g id="Group 1484578273">
          <path d={svgPaths.pa418380} fill="url(#paint0_radial_165_839)" id="Vector 22" opacity="0.2" />
          <path d={svgPaths.p31fe8800} fill="url(#paint1_linear_165_839)" id="Vector 12" opacity="0.5" />
          <path d={svgPaths.p2fd54300} fill="url(#paint2_linear_165_839)" id="Vector 14" opacity="0.6" stroke="url(#paint3_linear_165_839)" strokeWidth="0.176991" />
          <path d={svgPaths.p345cc600} fill="url(#paint4_linear_165_839)" id="Vector 16" opacity="0.5" stroke="url(#paint5_linear_165_839)" strokeWidth="0.176991" />
          <path d={svgPaths.p6974900} fill="url(#paint6_linear_165_839)" id="Vector 19" opacity="0.4" />
          <path d={svgPaths.p1cb41f00} fill="url(#paint7_linear_165_839)" id="Vector 20" opacity="0.3" stroke="url(#paint8_linear_165_839)" strokeWidth="0.176991" />
          <path d={svgPaths.p2d132780} fill="url(#paint9_linear_165_839)" id="Vector 21" opacity="0.3" stroke="url(#paint10_linear_165_839)" strokeWidth="0.176991" />
          <path d={svgPaths.p3aae7480} fill="url(#paint11_linear_165_839)" id="Vector 17" opacity="0.5" stroke="url(#paint12_linear_165_839)" strokeWidth="0.176991" />
          <path d={svgPaths.p38b76f00} fill="url(#paint13_linear_165_839)" id="Vector 18" opacity="0.4" />
          <path d={svgPaths.p168de000} fill="url(#paint14_linear_165_839)" id="Vector 15" opacity="0.6" stroke="url(#paint15_linear_165_839)" strokeWidth="0.176991" />
          <path d={svgPaths.p23d31f00} fill="url(#paint16_linear_165_839)" id="Vector 13" opacity="0.4" stroke="url(#paint17_linear_165_839)" strokeWidth="0.353982" />
        </g>
        <defs>
          <radialGradient cx="0" cy="0" gradientTransform="translate(9.55844 9.99308) rotate(-90) scale(6.62979 6.54867)" gradientUnits="userSpaceOnUse" id="paint0_radial_165_839" r="1">
            <stop stopColor="#8FE7A1" />
            <stop offset="1" stopColor="#8FE7A1" stopOpacity="0" />
          </radialGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_165_839" x1="9.38145" x2="9.38145" y1="0.00195329" y2="7.78956">
            <stop stopColor="#8FE7A1" />
            <stop offset="1" stopColor="#8FE7A1" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint2_linear_165_839" x1="9.55645" x2="1.76884" y1="-2.74772e-07" y2="6.37168">
            <stop offset="0.35" stopColor="#8FE7A1" />
            <stop offset="1" stopColor="#8FE7A1" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint3_linear_165_839" x1="9.55645" x2="1.59185" y1="-5.62033e-07" y2="6.46018">
            <stop offset="0.35" stopColor="#9FFFB3" />
            <stop offset="1" stopColor="#9FFFB3" stopOpacity="0" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint4_linear_165_839" x1="1.68337" x2="0.00195334" y1="6.37175" y2="15.7523">
            <stop stopColor="#8FE7A1" />
            <stop offset="1" stopColor="#8FE7A1" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint5_linear_165_839" x1="0.444431" x2="-3.97928" y1="5.13281" y2="7.21812">
            <stop offset="0.45" stopColor="#9FFFB3" />
            <stop offset="1" stopColor="#9FFFB3" stopOpacity="0" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint6_linear_165_839" x1="2.54867" x2="9.30469" y1="9.29168" y2="18.5888">
            <stop offset="0.1" stopColor="#8FE7A1" />
            <stop offset="1" stopColor="#8FE7A1" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint7_linear_165_839" x1="-1.82652e-07" x2="9.64571" y1="15.7526" y2="19.7896">
            <stop stopColor="#8FE7A1" />
            <stop offset="1" stopColor="#8FE7A1" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint8_linear_165_839" x1="-2.68963e-07" x2="9.74928" y1="15.4871" y2="19.7375">
            <stop offset="0.45" stopColor="#9FFFB3" />
            <stop offset="1" stopColor="#9FFFB3" stopOpacity="0" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint9_linear_165_839" x1="18.851" x2="9.55894" y1="15.6641" y2="20.0888">
            <stop stopColor="#8FE7A1" />
            <stop offset="1" stopColor="#8FE7A1" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint10_linear_165_839" x1="18.851" x2="9.88757" y1="15.6641" y2="20.5974">
            <stop offset="0.45" stopColor="#9FFFB3" />
            <stop offset="1" stopColor="#9FFFB3" stopOpacity="0" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint11_linear_165_839" x1="17.1187" x2="18.755" y1="6.37371" y2="15.7708">
            <stop stopColor="#8FE7A1" />
            <stop offset="1" stopColor="#8FE7A1" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint12_linear_165_839" x1="18.3941" x2="22.8991" y1="5.13477" y2="7.32081">
            <stop offset="0.45" stopColor="#9FFFB3" />
            <stop offset="1" stopColor="#9FFFB3" stopOpacity="0" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint13_linear_165_839" x1="16.3717" x2="9.55757" y1="9.29197" y2="18.407">
            <stop offset="0.1" stopColor="#8FE7A1" />
            <stop offset="1" stopColor="#8FE7A1" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint14_linear_165_839" x1="9.55818" x2="17.3604" y1="0.00195285" y2="6.44753">
            <stop offset="0.35" stopColor="#8FE7A1" />
            <stop offset="1" stopColor="#8FE7A1" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint15_linear_165_839" x1="9.55818" x2="17.5383" y1="0.00195256" y2="6.53758">
            <stop offset="0.35" stopColor="#9FFFB3" />
            <stop offset="1" stopColor="#9FFFB3" stopOpacity="0" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint16_linear_165_839" x1="9.37949" x2="9.37949" y1="7.70084" y2="18.3203">
            <stop offset="0.2" stopColor="#8FE7A1" />
            <stop offset="1" stopColor="#8FE7A1" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint17_linear_165_839" x1="9.55649" x2="9.3795" y1="18.5858" y2="7.78934">
            <stop offset="0.45" stopColor="#9FFFB3" />
            <stop offset="1" stopColor="#9FFFB3" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute h-[20px] left-[0.53px] mix-blend-plus-lighter top-0 w-[18.851px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.851 20.0003">
        <g id="Group 1484578274" style={{ mixBlendMode: "plus-lighter" }}>
          <path d={svgPaths.pa418380} fill="url(#paint0_radial_165_1227)" id="Vector 22" opacity="0.2" />
          <path d={svgPaths.p31fe8800} fill="url(#paint1_linear_165_1227)" id="Vector 12" opacity="0.5" />
          <path d={svgPaths.p2fd54300} fill="url(#paint2_linear_165_1227)" id="Vector 14" opacity="0.6" stroke="url(#paint3_linear_165_1227)" strokeWidth="0.176991" />
          <path d={svgPaths.p345cc600} fill="url(#paint4_linear_165_1227)" id="Vector 16" opacity="0.5" stroke="url(#paint5_linear_165_1227)" strokeWidth="0.176991" />
          <path d={svgPaths.p6974900} fill="url(#paint6_linear_165_1227)" id="Vector 19" opacity="0.4" />
          <path d={svgPaths.p1cb41f00} fill="url(#paint7_linear_165_1227)" id="Vector 20" opacity="0.3" stroke="url(#paint8_linear_165_1227)" strokeWidth="0.176991" />
          <path d={svgPaths.p2d132780} fill="url(#paint9_linear_165_1227)" id="Vector 21" opacity="0.3" stroke="url(#paint10_linear_165_1227)" strokeWidth="0.176991" />
          <path d={svgPaths.p3aae7480} fill="url(#paint11_linear_165_1227)" id="Vector 17" opacity="0.5" stroke="url(#paint12_linear_165_1227)" strokeWidth="0.176991" />
          <path d={svgPaths.p38b76f00} fill="url(#paint13_linear_165_1227)" id="Vector 18" opacity="0.4" />
          <path d={svgPaths.p168de000} fill="url(#paint14_linear_165_1227)" id="Vector 15" opacity="0.6" stroke="url(#paint15_linear_165_1227)" strokeWidth="0.176991" />
          <path d={svgPaths.p23d31f00} fill="url(#paint16_linear_165_1227)" id="Vector 13" opacity="0.4" stroke="url(#paint17_linear_165_1227)" strokeWidth="0.353982" />
        </g>
        <defs>
          <radialGradient cx="0" cy="0" gradientTransform="translate(9.55844 9.99308) rotate(-90) scale(6.62979 6.54867)" gradientUnits="userSpaceOnUse" id="paint0_radial_165_1227" r="1">
            <stop stopColor="#8FE7A1" />
            <stop offset="1" stopColor="#8FE7A1" stopOpacity="0" />
          </radialGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_165_1227" x1="9.38145" x2="9.38145" y1="0.00195329" y2="7.78956">
            <stop stopColor="#8FE7A1" />
            <stop offset="1" stopColor="#8FE7A1" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint2_linear_165_1227" x1="9.55645" x2="1.76884" y1="-2.74772e-07" y2="6.37168">
            <stop offset="0.35" stopColor="#8FE7A1" />
            <stop offset="1" stopColor="#8FE7A1" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint3_linear_165_1227" x1="9.55645" x2="1.59185" y1="-5.62033e-07" y2="6.46018">
            <stop offset="0.35" stopColor="#9FFFB3" />
            <stop offset="1" stopColor="#9FFFB3" stopOpacity="0" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint4_linear_165_1227" x1="1.68337" x2="0.00195334" y1="6.37175" y2="15.7523">
            <stop stopColor="#8FE7A1" />
            <stop offset="1" stopColor="#8FE7A1" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint5_linear_165_1227" x1="0.444431" x2="-3.97928" y1="5.13281" y2="7.21812">
            <stop offset="0.45" stopColor="#9FFFB3" />
            <stop offset="1" stopColor="#9FFFB3" stopOpacity="0" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint6_linear_165_1227" x1="2.54867" x2="9.30469" y1="9.29168" y2="18.5888">
            <stop offset="0.1" stopColor="#8FE7A1" />
            <stop offset="1" stopColor="#8FE7A1" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint7_linear_165_1227" x1="-1.82652e-07" x2="9.64571" y1="15.7526" y2="19.7896">
            <stop stopColor="#8FE7A1" />
            <stop offset="1" stopColor="#8FE7A1" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint8_linear_165_1227" x1="-2.68963e-07" x2="9.74928" y1="15.4871" y2="19.7375">
            <stop offset="0.45" stopColor="#9FFFB3" />
            <stop offset="1" stopColor="#9FFFB3" stopOpacity="0" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint9_linear_165_1227" x1="18.851" x2="9.55894" y1="15.6641" y2="20.0888">
            <stop stopColor="#8FE7A1" />
            <stop offset="1" stopColor="#8FE7A1" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint10_linear_165_1227" x1="18.851" x2="9.88757" y1="15.6641" y2="20.5974">
            <stop offset="0.45" stopColor="#9FFFB3" />
            <stop offset="1" stopColor="#9FFFB3" stopOpacity="0" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint11_linear_165_1227" x1="17.1187" x2="18.755" y1="6.37371" y2="15.7708">
            <stop stopColor="#8FE7A1" />
            <stop offset="1" stopColor="#8FE7A1" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint12_linear_165_1227" x1="18.3941" x2="22.8991" y1="5.13477" y2="7.32081">
            <stop offset="0.45" stopColor="#9FFFB3" />
            <stop offset="1" stopColor="#9FFFB3" stopOpacity="0" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint13_linear_165_1227" x1="16.3717" x2="9.55757" y1="9.29197" y2="18.407">
            <stop offset="0.1" stopColor="#8FE7A1" />
            <stop offset="1" stopColor="#8FE7A1" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint14_linear_165_1227" x1="9.55818" x2="17.3604" y1="0.00195285" y2="6.44753">
            <stop offset="0.35" stopColor="#8FE7A1" />
            <stop offset="1" stopColor="#8FE7A1" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint15_linear_165_1227" x1="9.55818" x2="17.5383" y1="0.00195256" y2="6.53758">
            <stop offset="0.35" stopColor="#9FFFB3" />
            <stop offset="1" stopColor="#9FFFB3" stopOpacity="0" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint16_linear_165_1227" x1="9.37949" x2="9.37949" y1="7.70084" y2="18.3203">
            <stop offset="0.2" stopColor="#8FE7A1" />
            <stop offset="1" stopColor="#8FE7A1" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint17_linear_165_1227" x1="9.55649" x2="9.3795" y1="18.5858" y2="7.78934">
            <stop offset="0.45" stopColor="#9FFFB3" />
            <stop offset="1" stopColor="#9FFFB3" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Frame7() {
  return (
    <div className="relative shadow-[0px_0px_16px_0px_rgba(143,231,161,0.4),0px_0px_32px_0px_rgba(143,231,161,0.4),0px_8px_10px_0px_rgba(0,0,0,0.25)] shrink-0 size-[20px]">
      <Group />
      <Group1 />
      <div className="absolute h-[20px] left-[0.53px] top-0 w-[18.85px]" data-name="Union">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.8496 19.9998">
          <g id="Union" opacity="0.6">
            <path d={svgPaths.p134aeb00} fill="url(#paint0_radial_165_1133)" style={{ mixBlendMode: "screen" }} />
            <path d={svgPaths.p134aeb00} fill="url(#paint1_radial_165_1133)" style={{ mixBlendMode: "soft-light" }} />
          </g>
          <defs>
            <radialGradient cx="0" cy="0" gradientTransform="translate(9.42478 9.99991) rotate(90) scale(9.99991 9.42478)" gradientUnits="userSpaceOnUse" id="paint0_radial_165_1133" r="1">
              <stop stopColor="#8FE7A1" />
              <stop offset="1" stopColor="#8FE7A1" stopOpacity="0" />
            </radialGradient>
            <radialGradient cx="0" cy="0" gradientTransform="translate(9.42478) rotate(90) scale(19.9998 18.8496)" gradientUnits="userSpaceOnUse" id="paint1_radial_165_1133" r="1">
              <stop stopColor="white" />
              <stop offset="0.7" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative rounded-[100px] shadow-[0px_24px_60px_0px_rgba(0,0,0,0.4)] w-[85px]" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 85 40\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'0.10000000149011612\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(-3.3452e-14 4 -8.5 2.4493e-16 42.5 0.00021696)\\'><stop stop-color=\\'rgba(255,255,255,1)\\' offset=\\'0.2\\'/><stop stop-color=\\'rgba(255,255,255,0.4)\\' offset=\\'1\\'/></radialGradient></defs></svg>')" }}>
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex gap-[6px] items-center justify-center p-[10px] relative size-full">
          <p className="font-['Rethink_Sans:Bold',sans-serif] font-bold leading-none relative shrink-0 text-[#8fe7a1] text-[12px] whitespace-nowrap">397</p>
          <Frame7 />
        </div>
      </div>
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col h-[40px] items-start justify-center min-h-px min-w-px relative">
      <Frame2 />
    </div>
  );
}

function Frame1() {
  return (
    <div className="bg-white content-stretch flex gap-[10px] items-center pl-[4px] pr-[16px] py-[4px] relative rounded-[100px] shadow-[0px_24px_60px_0px_rgba(0,0,0,0.4)] shrink-0">
      <div className="relative shrink-0 size-[32px]">
        <img alt="" className="absolute block max-w-none size-full" height="32" src={imgEllipse7563} width="32" />
      </div>
      <p className="font-['Rethink_Sans:Bold',sans-serif] font-bold leading-[1.1] relative shrink-0 text-[#0e0f12] text-[14px] whitespace-nowrap">Jess Wu</p>
    </div>
  );
}

function MaskGroup() {
  return (
    <div className="absolute contents left-[4px] top-[4px]" data-name="Mask group">
      <div className="absolute left-[4px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0px_0px] mask-size-[32px_32px] size-[32px] top-[4px]" data-name="Rectangle 34625350 2" style={{ maskImage: `url('${imgRectangle346253502}')` }}>
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgRectangle346253503} />
      </div>
    </div>
  );
}

function MaskGroup1() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0" data-name="Mask group">
      <div className="col-1 mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0px_0px] mask-size-[32px_32px] ml-0 mt-0 relative row-1 size-[32px]" data-name="Rectangle 34625350 2" style={{ maskImage: `url('${imgRectangle346253502}')` }}>
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgRectangle346253503} />
      </div>
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex gap-[10px] h-full items-center justify-center overflow-clip relative rounded-[1000px] shadow-[0px_24px_60px_0px_rgba(0,0,0,0.4)] shrink-0 w-[40px]" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 40 40\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'0.10000000149011612\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(-1.5742e-14 4 -4 2.4493e-16 20 0.00021696)\\'><stop stop-color=\\'rgba(255,255,255,1)\\' offset=\\'0.2\\'/><stop stop-color=\\'rgba(255,255,255,0.4)\\' offset=\\'1\\'/></radialGradient></defs></svg>')" }}>
      <MaskGroup />
      <MaskGroup1 />
    </div>
  );
}

function ChatBubble24DpE3E3E3Fill0Wght400Grad0Opsz() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="chat_bubble_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="chat_bubble_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24">
          <path d={svgPaths.p30b21580} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex items-center justify-center p-[10px] relative rounded-[100px] shadow-[0px_24px_60px_0px_rgba(0,0,0,0.4)] shrink-0 size-[40px]" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 40 40\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'0.10000000149011612\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(-1.5742e-14 4 -4 2.4493e-16 20 0.00021696)\\'><stop stop-color=\\'rgba(255,255,255,1)\\' offset=\\'0.2\\'/><stop stop-color=\\'rgba(255,255,255,0.4)\\' offset=\\'1\\'/></radialGradient></defs></svg>')" }}>
      <ChatBubble24DpE3E3E3Fill0Wght400Grad0Opsz />
    </div>
  );
}

function Frame5() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[5px] h-[40px] items-center justify-end min-h-px min-w-px relative">
      <Frame />
      <Frame3 />
    </div>
  );
}

function Frame6() {
  return (
    <div className="bg-[rgba(0,0,0,0)] relative rounded-[1000px] shadow-[0px_24px_60px_0px_rgba(0,0,0,0.4)] shrink-0 w-full">
      <div className="flex flex-row items-center overflow-x-auto overflow-y-clip size-full">
        <div className="content-stretch flex items-center p-[4px] relative w-full">
          <div className="content-stretch flex items-center justify-center p-[14px] relative rounded-[100px] shrink-0" data-name="Tab">
            <div className="flex flex-col font-['Rethink_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[12px] text-white whitespace-nowrap">
              <p className="leading-[1.25]">Feed</p>
            </div>
          </div>
          <div className="bg-[rgba(255,255,255,0.1)] content-stretch flex items-center justify-center p-[14px] relative rounded-[100px] shrink-0" data-name="Tab">
            <div className="flex flex-col font-['Rethink_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[12px] text-white whitespace-nowrap">
              <p className="leading-[1.25]">Network</p>
            </div>
          </div>
          <div className="content-stretch flex items-center justify-center p-[14px] relative rounded-[100px] shrink-0" data-name="Tab">
            <div className="flex flex-col font-['Rethink_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[12px] text-white whitespace-nowrap">
              <p className="leading-[1.25]">Saved</p>
            </div>
          </div>
          <div className="content-stretch flex items-center justify-center p-[14px] relative rounded-[100px] shrink-0" data-name="Tab">
            <div className="flex flex-col font-['Rethink_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[12px] text-white whitespace-nowrap">
              <p className="leading-[1.25]">Leader Board</p>
            </div>
          </div>
          <div className="content-stretch flex items-center justify-center p-[14px] relative rounded-[100px] shrink-0" data-name="Inactive">
            <div className="flex flex-col font-['Rethink_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[12px] text-white whitespace-nowrap">
              <p className="leading-[1.25]">Quests</p>
            </div>
          </div>
          <div className="content-stretch flex items-center justify-center p-[14px] relative rounded-[100px] shrink-0" data-name="Active">
            <div className="flex flex-col font-['Rethink_Sans:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[12px] text-white whitespace-nowrap">
              <p className="leading-[1.25]">Gameplay</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Frame8() {
  return (
    <div className="backdrop-blur-[0px] bg-gradient-to-b content-stretch flex flex-col from-black items-end relative size-full to-[rgba(0,0,0,0)]">
      <div className="content-stretch flex h-[60px] items-center justify-center relative shrink-0 w-full" data-name="Status bar/iPhone 15/Pro">
        <Left />
        <DynamicIsland />
        <Right />
      </div>
      <div className="relative shrink-0 w-full" data-name="Profile header">
        <div className="flex flex-row items-center size-full">
          <div className="content-stretch flex gap-[10px] items-center px-[16px] py-[4px] relative w-full">
            <Frame4 />
            <Frame1 />
            <Frame5 />
          </div>
        </div>
      </div>
      <div className="relative shrink-0 w-full" data-name="Profile Tabs component">
        <div className="content-stretch flex flex-col items-start p-[16px] relative w-full">
          <Frame6 />
        </div>
      </div>
    </div>
  );
}