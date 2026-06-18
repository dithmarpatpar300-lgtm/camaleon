import { APP_VERSION } from "@/lib/site";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return Response.json(
    { version: APP_VERSION },
    {
      headers: {
        "Cache-Control": "no-store, must-revalidate",
      },
    }
  );
}
