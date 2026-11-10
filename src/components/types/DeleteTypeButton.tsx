"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { deleteItemType } from "@/actions/item-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DeleteTypeButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    try {
      const result = await deleteItemType(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Type deleted");
      setOpen(false);
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="text-destructive"
        aria-label={`Delete ${name}`}
        onClick={() => setOpen(true)}
      >
        <Trash2 />
      </Button>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!pending) setOpen(nextOpen);
        }}
      >
        <DialogContent>
          <DialogTitle>Delete type?</DialogTitle>
          <DialogDescription>
            &quot;{name}&quot; will be permanently deleted. A type that still
            has items can&apos;t be deleted.
          </DialogDescription>
          <DialogFooter className="max-sm:flex-row max-sm:*:flex-1">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={handleDelete}
            >
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              {pending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
