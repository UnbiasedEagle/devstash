import Link from "next/link";
import { CONTAINER, LINK_FOCUS } from "@/components/landing/classes";

export function LandingFooter() {
  return (
    <footer className="border-t border-border py-7 text-[0.9375rem] text-muted-foreground">
      <div className={`${CONTAINER} flex flex-wrap justify-between gap-4`}>
        <span>DevStash</span>
        <nav aria-label="Account" className="flex gap-6">
          <Link
            href="/sign-in"
            className={`hover:text-foreground ${LINK_FOCUS}`}
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className={`hover:text-foreground ${LINK_FOCUS}`}
          >
            Create an account
          </Link>
        </nav>
      </div>
    </footer>
  );
}
