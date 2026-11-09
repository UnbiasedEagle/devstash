import Link from "next/link";
import { CONTAINER, LINK_FOCUS } from "@/components/landing/classes";
import { LogoMark } from "@/components/landing/LogoMark";
import { buttonVariants } from "@/components/ui/button";

const NAV_LINK = `hidden text-muted-foreground hover:text-foreground sm:inline ${LINK_FOCUS}`;

export function LandingHeader() {
  return (
    <header className={`${CONTAINER} flex items-center justify-between py-6`}>
      <Link
        href="/"
        className={`inline-flex items-center gap-2.5 text-lg font-bold tracking-tight ${LINK_FOCUS}`}
      >
        <LogoMark />
        DevStash
      </Link>
      <nav
        aria-label="Main"
        className="flex items-center gap-7 text-[0.9375rem]"
      >
        <a href="#pricing" className={NAV_LINK}>
          Pricing
        </a>
        <Link href="/sign-in" className={NAV_LINK}>
          Sign in
        </Link>
        <Link
          href="/sign-up"
          className={buttonVariants({ className: "h-9 rounded-[10px] px-4" })}
        >
          Get started
        </Link>
      </nav>
    </header>
  );
}
