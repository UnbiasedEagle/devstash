import {
  KIND_STYLES,
  type LandingKind,
} from "@/components/landing/type-styles";

interface KindPillProps {
  kind: LandingKind;
  withIcon?: boolean;
}

export function KindPill({ kind, withIcon = false }: KindPillProps) {
  const { Icon, tint } = KIND_STYLES[kind];
  return (
    <span
      className={`inline-flex items-center gap-1.5 justify-self-start rounded-full px-3 py-0.5 text-[0.8125rem] font-semibold ${tint}`}
    >
      {withIcon && <Icon className="size-3.5" />}
      {kind}
    </span>
  );
}
