import { Layers } from "lucide-react";

interface LogoMarkProps {
  className?: string;
}

// The same mark as the sidebar: a rounded square with the layers icon
export function LogoMark({ className = "size-8" }: LogoMarkProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-purple-500 text-white ${className}`}
    >
      <Layers className="size-[62%]" />
    </span>
  );
}
