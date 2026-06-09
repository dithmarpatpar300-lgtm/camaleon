/**
 * Ambient bloom — fixed accent glow behind page content.
 * Two compact corner halos only (no bottom halo — avoids footer clutter
 * and mobile GPU compositor conflicts with sticky bars).
 */
export function AmbientBloom() {
  return (
    <div
      aria-hidden="true"
      className="ambient-bloom pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <span className="ambient-bloom__halo ambient-bloom__halo--top-left" />
      <span className="ambient-bloom__halo ambient-bloom__halo--top-right" />
      <span className="ambient-bloom__grid" />
    </div>
  );
}
