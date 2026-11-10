import { revalidatePath } from "next/cache";

export function revalidateItemViews() {
  revalidatePath("/dashboard");
  revalidatePath("/items/[type]", "page");
  revalidatePath("/search");
  revalidatePath("/tags");
  revalidatePath("/tags/[name]", "page");
  revalidatePath("/collections");
  revalidatePath("/collections/[id]", "page");
  revalidatePath("/profile");
  revalidatePath("/types");
}
