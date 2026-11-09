import { toast } from "sonner";
import type { ActionResult } from "@/types/actions";

type FailedAction = Extract<ActionResult<unknown>, { success: false }>;

const PLAN_HREF = "/profile#plan";
const UPGRADE_TOAST_MS = 10_000;

// The free plan limit gets an Upgrade button. It opens the plan card in a new tab so whatever is typed in the open form isn't lost, and the toast stays longer so a keyboard user can reach the button
export function showActionError(failed: FailedAction) {
  if (failed.code !== "free_limit") {
    toast.error(failed.error);
    return;
  }
  toast.error(failed.error, {
    duration: UPGRADE_TOAST_MS,
    action: {
      label: "Upgrade",
      onClick: () => window.open(PLAN_HREF, "_blank", "noopener"),
    },
  });
}
