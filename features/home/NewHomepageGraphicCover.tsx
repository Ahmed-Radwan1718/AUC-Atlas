/**
 * Image-free, scalable graphical covers for the new homepage.
 * The four pilot covers are deliberately code-specific; adding more involves
 * extending coverDesigns and (if needed) the shared illustration vocabulary.
 */
type GraphicTheme = "foundation" | "writing" | "drafting" | "inquiry";

type GraphicCoverConfig = {
  theme: GraphicTheme;
  category: string;
  caption: string;
};

const coverDesigns: Readonly<Record<string, GraphicCoverConfig>> = {
  "CORE 1010": {
    theme: "foundation",
    category: "FOUNDATIONS",
    caption: "DISCOVER  /  CONNECT  /  QUESTION"
  },
  "RHET 1010": {
    theme: "writing",
    category: "WRITING & RHETORIC",
    caption: "READ  /  REASON  /  WRITE"
  },
  "ENGR 1005": {
    theme: "drafting",
    category: "ENGINEERING",
    caption: "FORM  /  SCALE  /  DETAIL"
  },
  "SCI 1020": {
    theme: "inquiry",
    category: "SCIENTIFIC INQUIRY",
    caption: "OBSERVE  /  TEST  /  EXPLAIN"
  }
};

export function hasGraphicCourseCover(code: string): boolean {
  return Object.prototype.hasOwnProperty.call(coverDesigns, code);
}

/** Vector artwork keeps the same crisp proportions at every card width. */
function CoverIllustration({ theme }: { theme: GraphicTheme }) {
  const shared = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.65,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const
  };

  if (theme === "foundation") {
    return (
      <svg viewBox="0 0 320 176" aria-hidden="true" {...shared}>
        <path d="M160 54c-24-17-48-19-92-14v82c39-5 71-1 92 15 21-16 53-20 92-15V40c-44-5-68-3-92 14Z" />
        <path d="M160 54v83M77 51c32-3 57 0 72 11M77 64c27-2 50 1 72 11M77 77c29-3 52 1 72 10M77 91c30-3 54 1 72 10" opacity=".68" />
        <path d="M243 51c-32-3-57 0-72 11M243 64c-27-2-50 1-72 11M243 77c-29-3-52 1-72 10M243 91c-30-3-54 1-72 10" opacity=".68" />
        <path d="M62 126c41-9 73-2 98 17 25-19 57-26 98-17M160 27v14M153 34h14M160 17l3 7-3 7-3-7 3-7Z" />
        <circle cx="160" cy="34" r="19" strokeDasharray="2 8" opacity=".55" />
        <path d="M42 87h12m212 0h12M160 149v12" opacity=".5" />
      </svg>
    );
  }
  if (theme === "writing") {
    return (
      <svg viewBox="0 0 320 176" aria-hidden="true" {...shared}>
        <path d="M87 36h121l26 26v82H87V36Z" />
        <path d="M208 36v26h26M105 60h80M105 73h60M105 87h93M105 100h82M105 113h50" opacity=".75" />
        <path d="m224 125 33-50 16 11-34 50-20 9 5-20Z" />
        <path d="m224 125 15 11M257 75l9-13c2-3 5-3 8-1l6 4c3 2 3 5 1 8l-8 13" />
        <circle cx="228" cy="131" r="2" fill="currentColor" stroke="none" />
        <path d="M66 56c-12 7-17 17-17 30M58 92h10m-10 0c0-6 3-10 8-10M62 111c-8 4-12 9-12 16" opacity=".55" />
        <path d="M64 27h16m176 120h15" strokeDasharray="3 4" opacity=".45" />
      </svg>
    );
  }
  if (theme === "drafting") {
    return (
      <svg viewBox="0 0 320 176" aria-hidden="true" {...shared}>
        <path d="m160 33 65 36v70l-65 36-65-36V69l65-36Z" />
        <path d="m95 69 65 37 65-37M160 106v69M128 52l65 36M128 88l65-36" />
        <path d="m82 64-15-8M82 143l-15 8M238 64l16-8M238 143l16 8" opacity=".6" />
        <path d="M71 59v88M61 59h18M61 147h18M249 154l12-7M249 59l12-7" opacity=".7" />
        <path d="M100 20h120M100 14v12M220 14v12" opacity=".65" />
        <path d="M113 34 102 20m105 14 11-14" opacity=".5" />
        <circle cx="160" cy="106" r="4" fill="currentColor" stroke="none" />
        <path d="M44 126h28M58 112v28m190-118h28m-14-14v28" opacity=".45" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 320 176" aria-hidden="true" {...shared}>
      <circle cx="155" cy="88" r="52" strokeDasharray="3 8" opacity=".58" />
      <path d="m102 111 51-54 44 36 38-39" />
      <circle cx="102" cy="111" r="7" fill="var(--atlas-graphic-bg)" />
      <circle cx="153" cy="57" r="7" fill="var(--atlas-graphic-bg)" />
      <circle cx="197" cy="93" r="7" fill="var(--atlas-graphic-bg)" />
      <circle cx="235" cy="54" r="7" fill="var(--atlas-graphic-bg)" />
      <path d="M79 124c0 25 32 39 68 39M247 98c6 31-11 52-41 58" opacity=".65" />
      <path d="M70 64h24M82 52v24M244 120h25M256 108v24" opacity=".6" />
      <circle cx="155" cy="88" r="70" strokeDasharray="1 11" opacity=".4" />
      <path d="M131 88h12m24 0h13M155 63v-9M155 121v-10" opacity=".48" />
    </svg>
  );
}

export default function NewHomepageGraphicCover({ code }: { code: string }) {
  const design = coverDesigns[code];
  if (!design) return null;

  return (
    <div className={"homepagenew-course-cover homepagenew-graphic-cover homepagenew-graphic-" + design.theme}
      aria-hidden="true">
      <div className="homepagenew-graphic-top">
        <span>{design.category}</span>
        <span>AUC ATLAS</span>
      </div>
      <div className="homepagenew-graphic-art">
        <CoverIllustration theme={design.theme} />
      </div>
      <div className="homepagenew-graphic-bottom">
        <span>{design.caption}</span>
        <span className="homepagenew-graphic-index">{code.replace(/[^0-9]/g, "")}</span>
      </div>
    </div>
  );
}
