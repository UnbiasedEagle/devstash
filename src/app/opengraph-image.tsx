import { ImageResponse } from "next/og";
import { KIND_STYLES, LANDING_KINDS } from "@/components/landing/type-styles";
import { HEADLINE, PAGE_TITLE } from "@/lib/site-copy";

export const alt = PAGE_TITLE;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The image generator can't use the page's web font, so it uses its own built-in sans. It takes Tailwind classes through `tw`, so the type colors come from the same lookup as the page
export default function Image() {
  return new ImageResponse(
    <div tw="flex h-full w-full flex-col justify-between bg-[#14161a] p-20 text-[#e9ebee]">
      <div tw="flex items-center">
        <div tw="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7c5cf0]">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
            <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
            <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
          </svg>
        </div>
        <div tw="ml-5 text-4xl">DevStash</div>
      </div>
      <div tw="flex text-[88px] leading-[1.05]">{HEADLINE}</div>
      <div tw="flex text-3xl">
        {LANDING_KINDS.map((kind) => (
          <div key={kind} tw={`mr-9 flex ${KIND_STYLES[kind].text}`}>
            {KIND_STYLES[kind].plural}
          </div>
        ))}
      </div>
    </div>,
    { ...size },
  );
}
