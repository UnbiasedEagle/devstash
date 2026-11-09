import { CONTAINER } from "@/components/landing/classes";
import { KIND_STYLES, LANDING_KINDS } from "@/components/landing/type-styles";

export function KindsRow() {
  return (
    <div className={CONTAINER}>
      <ul className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
        {LANDING_KINDS.map((kind) => {
          const { Icon, text, plural } = KIND_STYLES[kind];
          return (
            <li
              key={kind}
              className="inline-flex items-center gap-2 font-semibold"
            >
              <Icon className={`size-5 ${text}`} />
              {plural}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
