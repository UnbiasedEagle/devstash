import Link from "next/link";
import {
  BUTTON_BASE,
  CONTAINER,
  SECTION_MARGIN,
} from "@/components/landing/classes";
import { buttonVariants } from "@/components/ui/button";

export function ClosingSection() {
  return (
    <div className={`${SECTION_MARGIN} border-t border-border`}>
      <div
        className={`${CONTAINER} flex flex-wrap items-end justify-between gap-8 py-[clamp(3.5rem,8vw,6rem)]`}
      >
        <h2 className="max-w-[16ch] text-[clamp(2.25rem,5vw,4rem)] leading-[1.05] font-bold tracking-[-0.03em] text-balance">
          Your next snippet shouldn&apos;t end up in a chat.
        </h2>
        <Link
          href="/sign-up"
          className={buttonVariants({ className: BUTTON_BASE })}
        >
          Start for free
        </Link>
      </div>
    </div>
  );
}
