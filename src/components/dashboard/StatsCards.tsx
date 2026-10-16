import { collections, itemTypes, items } from "@/lib/mock-data";

interface Stat {
  label: string;
  value: number;
}

const totalItems = itemTypes.reduce((sum, type) => sum + type.count, 0);

const stats: Stat[] = [
  { label: "Items", value: totalItems },
  { label: "Collections", value: collections.length },
  {
    label: "Favorite items",
    value: items.filter((item) => item.isFavorite).length,
  },
  {
    label: "Favorite collections",
    value: collections.filter((collection) => collection.isFavorite).length,
  },
];

export default function StatsCards() {
  return (
    <section
      aria-label="Stash overview"
      className="overflow-hidden rounded-xl border border-border bg-card"
    >
      <dl className="grid grid-cols-2 divide-border max-lg:divide-y lg:grid-cols-4 lg:divide-x">
        {stats.map(({ label, value }) => (
          <div key={label} className="px-5 py-4 max-lg:odd:border-r">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-3xl font-semibold tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="border-t border-border px-5 py-4">
        <div
          role="img"
          aria-label="Items by type"
          className="flex h-2 gap-0.5 overflow-hidden rounded-full"
        >
          {itemTypes.map((type) => (
            <div
              key={type.id}
              className="min-w-1"
              style={{ flexGrow: type.count, backgroundColor: type.color }}
            />
          ))}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          {itemTypes.map((type) => (
            <li key={type.id} className="flex items-center gap-2">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: type.color }}
              />
              {type.name}
              <span className="tabular-nums text-foreground/70">
                {type.count}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
