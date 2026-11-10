import { Suspense } from "react";
import { connection } from "next/server";
import DeleteTypeButton from "@/components/types/DeleteTypeButton";
import EditTypeDialog from "@/components/types/EditTypeDialog";
import NewTypeDialog from "@/components/types/NewTypeDialog";
import TypeTile from "@/components/types/TypeTile";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MAX_CUSTOM_TYPES } from "@/lib/custom-type-options";
import { getManagedItemTypes } from "@/lib/db/item-types";
import { getCurrentUserId, getIsPro } from "@/lib/db/user";
import type { ManagedItemType } from "@/types/dashboard";

const SKELETON_ROW_COUNT = 7;

// Delete is not gated on Pro, so a former Pro user can still remove the types they made
function TypeRow({
  type,
  canEdit,
}: {
  type: ManagedItemType;
  canEdit: boolean;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      <TypeTile icon={type.icon} color={type.color} />
      <span className="min-w-0 flex-1 truncate font-medium">{type.name}</span>
      <span className="text-sm tabular-nums text-muted-foreground">
        {type.count} {type.count === 1 ? "item" : "items"}
      </span>
      {!type.isSystem && (
        <div className="flex gap-2">
          {canEdit && (
            <EditTypeDialog
              id={type.id}
              name={type.name}
              icon={type.icon}
              color={type.color}
            />
          )}
          <DeleteTypeButton id={type.id} name={type.name} />
        </div>
      )}
    </li>
  );
}

function TypesPageSkeleton() {
  return (
    <div aria-hidden className="mx-auto max-w-3xl space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="space-y-2">
        {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
          <Skeleton key={index} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

async function TypesContent() {
  await connection();
  const userId = await getCurrentUserId();
  const [types, isPro] = await Promise.all([
    getManagedItemTypes(userId),
    getIsPro(userId),
  ]);
  const builtIn = types.filter((type) => type.isSystem);
  const custom = types.filter((type) => !type.isSystem);
  const atLimit = custom.length >= MAX_CUSTOM_TYPES;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Types</h1>
        {isPro && !atLimit && <NewTypeDialog />}
      </div>

      <section aria-labelledby="custom-types" className="space-y-3">
        <h2 id="custom-types" className="text-lg font-semibold">
          Your types
        </h2>
        {!isPro && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              Custom types are a Pro feature.
            </p>
            <a
              href="/profile#plan"
              className={buttonVariants({ variant: "outline" })}
            >
              Upgrade
            </a>
          </div>
        )}
        {isPro && atLimit && (
          <p className="text-sm text-muted-foreground">
            You have {MAX_CUSTOM_TYPES} custom types, the most you can have.
            Delete one to add another.
          </p>
        )}
        {custom.length > 0 ? (
          <ul className="space-y-2">
            {custom.map((type) => (
              <TypeRow key={type.id} type={type} canEdit={isPro} />
            ))}
          </ul>
        ) : (
          isPro && (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              No custom types yet
            </p>
          )
        )}
      </section>

      <section aria-labelledby="built-in-types" className="space-y-3">
        <h2 id="built-in-types" className="text-lg font-semibold">
          Built-in types
        </h2>
        <ul className="space-y-2">
          {builtIn.map((type) => (
            <TypeRow key={type.id} type={type} canEdit={false} />
          ))}
        </ul>
      </section>
    </div>
  );
}

export default function TypesPage() {
  return (
    <Suspense fallback={<TypesPageSkeleton />}>
      <TypesContent />
    </Suspense>
  );
}
