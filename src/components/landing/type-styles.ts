import {
  Code,
  File,
  Image,
  Link,
  Sparkles,
  StickyNote,
  Terminal,
  type LucideIcon,
} from "lucide-react";

export type LandingKind =
  "Snippet" | "Prompt" | "Command" | "Note" | "File" | "Image" | "Link";

export interface KindStyle {
  plural: string;
  Icon: LucideIcon;
  // The classes are written out in full so Tailwind finds them
  text: string;
  tint: string;
  edge: string;
  underline: string;
}

// The same seven colors and icons as the item types in the app
export const KIND_STYLES: Record<LandingKind, KindStyle> = {
  Snippet: {
    plural: "Snippets",
    Icon: Code,
    text: "text-[#3b82f6]",
    tint: "bg-[#3b82f6]/15 text-[#3b82f6]",
    edge: "border-l-[#3b82f6]",
    underline: "decoration-[#3b82f6]",
  },
  Prompt: {
    plural: "Prompts",
    Icon: Sparkles,
    text: "text-[#8b5cf6]",
    tint: "bg-[#8b5cf6]/15 text-[#8b5cf6]",
    edge: "border-l-[#8b5cf6]",
    underline: "decoration-[#8b5cf6]",
  },
  Command: {
    plural: "Commands",
    Icon: Terminal,
    text: "text-[#f97316]",
    tint: "bg-[#f97316]/15 text-[#f97316]",
    edge: "border-l-[#f97316]",
    underline: "decoration-[#f97316]",
  },
  Note: {
    plural: "Notes",
    Icon: StickyNote,
    text: "text-[#fde047]",
    tint: "bg-[#fde047]/15 text-[#fde047]",
    edge: "border-l-[#fde047]",
    underline: "decoration-[#fde047]",
  },
  File: {
    plural: "Files",
    Icon: File,
    text: "text-[#8b93a0]",
    tint: "bg-[#8b93a0]/15 text-[#8b93a0]",
    edge: "border-l-[#8b93a0]",
    underline: "decoration-[#8b93a0]",
  },
  Image: {
    plural: "Images",
    Icon: Image,
    text: "text-[#ec4899]",
    tint: "bg-[#ec4899]/15 text-[#ec4899]",
    edge: "border-l-[#ec4899]",
    underline: "decoration-[#ec4899]",
  },
  Link: {
    plural: "Links",
    Icon: Link,
    text: "text-[#10b981]",
    tint: "bg-[#10b981]/15 text-[#10b981]",
    edge: "border-l-[#10b981]",
    underline: "decoration-[#10b981]",
  },
};

export const LANDING_KINDS: LandingKind[] = [
  "Snippet",
  "Prompt",
  "Command",
  "Note",
  "File",
  "Image",
  "Link",
];
