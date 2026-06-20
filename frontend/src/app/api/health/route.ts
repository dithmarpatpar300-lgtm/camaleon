/** Lightweight liveness probe — must hit network (SW NetworkOnly + ?camaleon-probe). */
export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
} as const;

export async function HEAD() {
  return new Response(null, { status: 204, headers: NO_STORE });
}

export async function GET() {
  return Response.json({ ok: true }, { headers: NO_STORE });
}
