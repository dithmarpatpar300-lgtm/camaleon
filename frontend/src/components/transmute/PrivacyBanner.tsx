export function PrivacyBanner() {
  return (
    <section className="mx-auto max-w-3xl px-6 pb-12">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-bg-surface px-5 py-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-5 w-5 shrink-0 text-accent"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
            clipRule="evenodd"
          />
        </svg>
        <p className="text-sm text-text-secondary">
          100% local. Tus archivos nunca salen de tu dispositivo.
        </p>
      </div>
    </section>
  );
}
