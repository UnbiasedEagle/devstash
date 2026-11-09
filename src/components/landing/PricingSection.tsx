import Link from "next/link";
import {
  BUTTON_BASE,
  CONTAINER,
  HEADING,
  SECTION_SPACING,
} from "@/components/landing/classes";
import { buttonVariants } from "@/components/ui/button";
import {
  FREE_COLLECTION_LIMIT,
  FREE_ITEM_LIMIT,
  PRO_MONTHLY_PRICE,
  PRO_YEARLY_PRICE,
  PRO_YEARLY_SAVINGS,
} from "@/lib/plan-limits";
import { formatSizeLimit, MAX_UPLOAD_BYTES } from "@/lib/upload-rules";

const FREE_FEATURES = [
  `${FREE_ITEM_LIMIT} items`,
  `${FREE_COLLECTION_LIMIT} collections`,
  "Search, tags, favorites and pins",
  "Image uploads",
];

// Only what exists today
const PRO_FEATURES = [
  "Unlimited items and collections",
  `File uploads up to ${formatSizeLimit(MAX_UPLOAD_BYTES.file)}`,
  "Export as JSON or ZIP with your files",
];

const PLAN = "flex flex-col rounded-2xl border border-border p-6 sm:p-8";
const PLAN_NAME = "text-[1.0625rem] font-bold";
const PRICE = "mt-3 text-5xl leading-none font-bold tracking-[-0.04em]";
const PRICE_NOTE = "mt-2 min-h-6 text-[0.9375rem] text-muted-foreground";

function Features({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 mb-8 grid gap-2.5">
      {items.map((feature) => (
        <li
          key={feature}
          className="relative pl-5 before:absolute before:top-[0.72em] before:left-0 before:h-0.5 before:w-2 before:bg-muted-foreground"
        >
          {feature}
        </li>
      ))}
    </ul>
  );
}

export function PricingSection() {
  return (
    <section
      id="pricing"
      className={`${CONTAINER} ${SECTION_SPACING} scroll-mt-6`}
    >
      <h2 className={HEADING}>Free until you outgrow it.</h2>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <section aria-labelledby="plan-free" className={PLAN}>
          <h3 id="plan-free" className={PLAN_NAME}>
            Free
          </h3>
          <p className={PRICE}>$0</p>
          <p className={PRICE_NOTE}>No card needed.</p>
          <Features items={FREE_FEATURES} />
          <Link
            href="/sign-up"
            className={buttonVariants({
              variant: "outline",
              className: `mt-auto w-full ${BUTTON_BASE}`,
            })}
          >
            Start for free
          </Link>
        </section>
        <section aria-labelledby="plan-pro" className={`${PLAN} bg-card`}>
          <h3 id="plan-pro" className={PLAN_NAME}>
            Pro
          </h3>
          <p className={PRICE}>
            ${PRO_MONTHLY_PRICE}{" "}
            <small className="text-base font-medium tracking-normal text-muted-foreground">
              per month
            </small>
          </p>
          <p className={PRICE_NOTE}>
            Or ${PRO_YEARLY_PRICE} a year, which saves ${PRO_YEARLY_SAVINGS}.
          </p>
          <Features items={PRO_FEATURES} />
          <Link
            href="/sign-up"
            className={buttonVariants({
              className: `mt-auto w-full ${BUTTON_BASE}`,
            })}
          >
            Start with Pro
          </Link>
        </section>
      </div>
    </section>
  );
}
