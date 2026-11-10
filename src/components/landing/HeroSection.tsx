import Link from "next/link";
import { BUTTON_BASE, CONTAINER } from "@/components/landing/classes";
import { ItemDrawerPicture } from "@/components/landing/ItemDrawerPicture";
import { SearchPicture } from "@/components/landing/SearchPicture";
import { buttonVariants } from "@/components/ui/button";
import { FREE_ITEM_LIMIT } from "@/lib/plan-limits";
import { HEADLINE } from "@/lib/site-copy";

export function HeroSection() {
  return (
    <div className={`${CONTAINER} pt-[clamp(1.5rem,4vw,3rem)]`}>
      {/* The pictures are decoration: each hides itself, and this says what they show */}
      <div className="grid items-center gap-8 xl:grid-cols-[27rem_minmax(0,1fr)] xl:gap-12">
        <div>
          <h1 className="text-[clamp(2.6rem,4.2vw,3.75rem)] leading-[1.02] font-bold tracking-[-0.04em] text-balance">
            {HEADLINE}
          </h1>
          <p className="mt-5 max-w-136 text-[1.1875rem] text-muted-foreground">
            DevStash keeps your snippets, commands, prompts, notes and links in
            one place and finds them with one search.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              href="/sign-up"
              className={buttonVariants({ className: BUTTON_BASE })}
            >
              Start for free
            </Link>
            <span className="text-[0.9375rem] text-muted-foreground">
              Free for up to {FREE_ITEM_LIMIT} items. No card needed.
            </span>
          </div>
        </div>

        {/* Layered only when the column is wide enough for both pictures to overlap just their empty edges */}
        <div className="relative grid items-start gap-4 lg:grid-cols-2 xl:block xl:h-136">
          <ItemDrawerPicture className="xl:absolute xl:top-0 xl:left-0 xl:w-104" />
          <SearchPicture className="xl:absolute xl:top-52 xl:right-0 xl:w-90" />
        </div>
      </div>
      <p className="sr-only">
        Example of DevStash: a search for &quot;debounce&quot; finds a snippet,
        a note and a link, and the snippet opens in a drawer with highlighted
        code and a copy button.
      </p>
    </div>
  );
}
