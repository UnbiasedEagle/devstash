import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";
import { FREE_ITEM_LIMIT } from "@/lib/plan-limits";
import { PAGE_TITLE } from "@/lib/site-copy";

const DESCRIPTION = `Keep your snippets, commands, prompts, notes, files and links in one place and find them with one search. Free for up to ${FREE_ITEM_LIMIT} items.`;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "DevStash",
    url: "/",
    title: PAGE_TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: DESCRIPTION,
  },
};

export default function Home() {
  return <LandingPage />;
}
