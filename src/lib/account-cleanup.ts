import "server-only";
import { APIError } from "better-auth/api";
import { deleteBillingAccount } from "@/lib/billing-cleanup";
import { deleteObjects, listObjectKeys } from "@/lib/storage";

const STORAGE_ERROR =
  "Could not delete your files. Try again in a moment, or contact support.";

// The trailing slash matters: without it one user's id could match the start of another's
function prefixesFor(userId: string): string[] {
  return [`files/${userId}/`, `pending/${userId}/`];
}

// Lists a page, deletes it and moves on, until nothing is left under either prefix
async function emptyPrefix(prefix: string): Promise<void> {
  let token: string | undefined;
  do {
    const page = await listObjectKeys(prefix, token);
    await deleteObjects(page.keys);
    token = page.nextToken;
  } while (token);
}

export async function deleteUserFiles(userId: string): Promise<void> {
  for (const prefix of prefixesFor(userId)) {
    await emptyPrefix(prefix);
    // An upload that finished in another tab during the sweep would be left behind with no row to find it later, so the account only goes once a second look finds nothing
    const { keys } = await listObjectKeys(prefix);
    if (keys.length > 0) {
      throw new Error(`Files appeared under ${prefix} during cleanup`);
    }
  }
}

// Better Auth runs one hook before an account is deleted, so billing and storage go together. Billing is first: a storage failure then stops the deletion and can simply be retried, whereas the other order could delete someone's files and then fail on Stripe
export async function deleteAccountData(user: { id: string }): Promise<void> {
  await deleteBillingAccount(user);
  try {
    await deleteUserFiles(user.id);
  } catch (error) {
    console.error("Failed to delete a user's files before account deletion", {
      userId: user.id,
      error,
    });
    throw new APIError("INTERNAL_SERVER_ERROR", { message: STORAGE_ERROR });
  }
}
