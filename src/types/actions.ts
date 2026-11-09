// Lets the client offer more than the message, such as an Upgrade button for the free plan limit
export type ActionErrorCode = "free_limit";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: ActionErrorCode };
