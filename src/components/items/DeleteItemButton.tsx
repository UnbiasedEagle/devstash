"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { deleteItem } from "@/actions/items";
import { useItemDrawer } from "@/components/items/ItemDrawer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DeleteItemButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const { closeDrawer } = useItemDrawer();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [deleted, setDeleted] = useState(false);

  async function handleDelete() {
    setPending(true);
    try {
      const result = await deleteItem(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setDeleted(true);
      toast.success("Item deleted");
      closeDrawer();
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
        size="sm"
        className="text-destructive"
        onClick={() => setOpen(true)}
      >
        <Trash2 aria-hidden />
        Delete
      </Button>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!pending && !deleted) setOpen(nextOpen);
        }}
      >
        <DialogContent>
          <DialogTitle>Delete item?</DialogTitle>
          <DialogDescription>
            &quot;{title}&quot; will be permanently deleted. This can&apos;t be
            undone.
          </DialogDescription>
          <DialogFooter className="max-sm:flex-row max-sm:*:flex-1">
            <Button
              variant="outline"
              disabled={pending || deleted}
              onClick={() => setOpen(false)}
              autoFocus
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={pending || deleted}
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
