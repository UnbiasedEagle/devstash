import type { Metadata } from "next";

// For the pages behind sign-in and the sign-in pages themselves. The robots file only stops crawling; this asks search engines to leave them out of results
export const NO_INDEX: Metadata = { robots: { index: false } };
