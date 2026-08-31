export default function Footer() {
  return (
    <footer className="mx-auto mt-20 max-w-2xl px-6 pb-14">
      <div className="border-t border-(--color-rule) pt-6">
        <p className="font-(family-name:--font-mono) text-xs text-(--color-muted)">
          © 2026 runs-on.dev, a project by{' '}
          <a className="text-(--color-signal) underline" href="https://advancelabs.dev">
            Advance Labs
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
