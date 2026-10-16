"use client";

import { useState, type ReactNode } from "react";
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
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        data-collapsed={!desktopOpen}
        className={cn(
          "group/sidebar fixed inset-y-0 left-0 z-40 w-64 shrink-0 overflow-hidden border-r border-border bg-background transition-transform md:static md:translate-x-0 md:transition-[width]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
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
              onClick={() => setMobileOpen((open) => !open)}
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
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
