import { Layers } from "lucide-react";
import { StashPreview } from "@/components/auth/StashPreview";

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-purple-500 text-white">
        <Layers className="size-5" />
      </div>
      <span className="text-lg font-semibold">DevStash</span>
    </div>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid flex-1 lg:grid-cols-2">
      <section className="hidden flex-col justify-between border-r bg-card p-12 lg:flex">
        <Brand />
        <div className="flex max-w-md flex-col gap-8">
          <p className="text-3xl font-semibold tracking-tight text-balance">
            Snippets, commands, prompts and links, one search away.
          </p>
          <StashPreview />
        </div>
        <p className="text-sm text-muted-foreground">
          Stop digging through old chats, notes and bash history.
        </p>
      </section>
      <section className="flex flex-col justify-center px-4 py-10 sm:px-8">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
          <div className="lg:hidden">
            <Brand />
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
