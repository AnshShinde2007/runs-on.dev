export function Section({ title, children }) {
  return (
    <section className="mt-14 first:mt-0">
      <h2 className="font-(family-name:--font-mono) text-xs font-medium tracking-[0.14em] text-(--color-muted) uppercase">
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-(--color-ink)">{children}</div>
    </section>
  );
}

export function Quote({ children }) {
  return (
    <p className="border border-(--color-rule) bg-(--color-card) p-4 text-sm leading-relaxed">
      {children}
    </p>
  );
}
