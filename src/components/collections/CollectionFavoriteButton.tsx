"use client";

import { Star } from "lucide-react";
import { useOptimistic, useRef, useTransition } from "react";
import { toast } from "sonner";
import { setCollectionFavorite } from "@/actions/collections";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CollectionFavoriteButton({
  id,
  name,
  isFavorite,
  className,
}: {
  id: string;
  name: string;
  isFavorite: boolean;
  className?: string;
}) {
  const [optimisticFavorite, setOptimisticFavorite] = useOptimistic(isFavorite);
  const [pending, startTransition] = useTransition();
  // `pending` only updates on the next render, so two clicks in one tick would both pass it
  const inFlight = useRef(false);

  // Not `disabled`: that turns off pointer events, so a second click would fall through to the card link underneath
  function toggle() {
    if (inFlight.current) return;
    inFlight.current = true;
    const next = !optimisticFavorite;
    startTransition(async () => {
      setOptimisticFavorite(next);
      try {
        const result = await setCollectionFavorite(id, next);
        if (!result.success) toast.error(result.error);
      } catch {
        toast.error("Something went wrong. Try again.");
      } finally {
        inFlight.current = false;
      }
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={className}
      aria-label={`Favorite ${name}`}
      aria-pressed={optimisticFavorite}
      aria-disabled={pending || undefined}
      onClick={toggle}
    >
      <Star
        aria-hidden
        className={cn(optimisticFavorite && "fill-yellow-500 text-yellow-500")}
      />
    </Button>
  );
}
