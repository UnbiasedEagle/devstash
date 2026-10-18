"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  topBar: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
}

export default function DashboardShell({
  topBar,
  sidebar,
  children,
}: DashboardShellProps) {
  const [desktopOpen, setDesktopOpen] = useState(true);
  const pathname = usePathname();
  // Remembering the path the drawer opened on closes it on navigation without an effect
  const [mobileOpenPath, setMobileOpenPath] = useState<string | null>(null);
  const mobileOpen = mobileOpenPath === pathname;

  useEffect(() => {
    if (!mobileOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpenPath(null);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  return (
    <div className="flex h-dvh">
      {mobileOpen && (
        <div
          aria-hidden
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpenPath(null)}
        />
      )}
      <aside
        data-collapsed={!desktopOpen}
        className={cn(
          "group/sidebar fixed inset-y-0 left-0 z-40 h-dvh w-64 shrink-0 overflow-hidden border-r border-border bg-background transition-[transform,visibility] md:static md:h-auto md:translate-x-0 md:transition-[width]",
          mobileOpen ? "translate-x-0" : "-translate-x-full max-md:invisible",
          desktopOpen ? "md:w-64" : "md:w-14",
        )}
      >
        {sidebar}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-16 items-center border-b border-border">
          <div className="flex h-full items-center border-r border-border px-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open sidebar"
              onClick={() => setMobileOpenPath(mobileOpen ? null : pathname)}
            >
              <PanelLeft />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex"
              aria-label="Toggle sidebar"
              onClick={() => setDesktopOpen((open) => !open)}
            >
              <PanelLeft />
            </Button>
          </div>
          {topBar}
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
