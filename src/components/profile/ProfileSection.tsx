interface ProfileSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function ProfileSection({
  title,
  description,
  children,
}: ProfileSectionProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}
