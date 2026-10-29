"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { deleteCollection } from "@/actions/collections";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DeleteCollectionButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [deleted, setDeleted] = useState(false);

  async function handleDelete() {
    setPending(true);
    try {
      const result = await deleteCollection(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setDeleted(true);
      toast.success("Collection deleted");
      router.replace("/collections");
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
          <DialogTitle>Delete collection?</DialogTitle>
          <DialogDescription>
            &quot;{name}&quot; will be permanently deleted. Its items are kept
            and will no longer belong to a collection.
          </DialogDescription>
          <DialogFooter className="max-sm:flex-row max-sm:*:flex-1">
            <Button
              variant="outline"
              disabled={pending || deleted}
              onClick={() => setOpen(false)}
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
