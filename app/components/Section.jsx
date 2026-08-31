export function Section({ title, children }) {
  return (
    <section className="mt-10">
      <h2 className="border-b border-(--color-accent) pb-2 text-lg font-bold text-(--color-accent)">
        {title}
      </h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

export function Quote({ children }) {
  return <p className="border-l-2 border-(--color-edge) pl-4 text-sm leading-relaxed">{children}</p>;
}
