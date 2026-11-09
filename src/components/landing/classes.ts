export const CONTAINER =
  "mx-auto w-[min(70rem,100%-2rem)] sm:w-[min(70rem,100%-3rem)]";

export const SECTION_SPACING = "pt-[clamp(4.5rem,9vw,7.5rem)]";
export const SECTION_MARGIN = "mt-[clamp(4.5rem,9vw,7.5rem)]";

export const HEADING =
  "text-[clamp(2rem,4.2vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.03em] text-balance max-w-[18ch]";

export const SUBHEADING = "mt-4 max-w-[34rem] text-muted-foreground";

// Solid, so a picture that overlaps another one hides it instead of showing through
export const PICTURE_BG = "bg-[#101216]";

// A piece of the interface drawn on the page. It is decoration, so each picture hides itself from assistive technology
export const PICTURE = `overflow-hidden rounded-2xl border border-border ${PICTURE_BG} text-[0.9375rem]`;

export const CHIP = "rounded-md bg-card px-2 py-px text-xs";

export const BUTTON_BASE = "h-11 rounded-[10px] px-5 text-base font-semibold";

// The browser's own outline is thin, so plain links get the same visible focus as the buttons
export const LINK_FOCUS =
  "rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground";
