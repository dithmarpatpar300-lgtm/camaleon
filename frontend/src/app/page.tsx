import { cookies } from "next/headers";
import { Hero } from "@/components/transmute/Hero";
import { PrivacyBanner } from "@/components/transmute/PrivacyBanner";
import { ToolBrowser } from "@/components/transmute/ToolBrowser";
import { UniversalTransmutator } from "@/components/transmute/UniversalTransmutator";
import { COOKIE_NAMES } from "@/lib/storage/keys";
import {
  resolveToolDensityFromCookie,
  resolveToolLaneFromCookie,
  resolveToolTabFromCookie,
} from "@/lib/storage/tool-browser-prefs";

export default async function Home() {
  const cookieStore = await cookies();
  const initialLane = resolveToolLaneFromCookie(
    cookieStore.get(COOKIE_NAMES.TOOL_LANE)?.value
  );
  const initialTab = resolveToolTabFromCookie(
    cookieStore.get(COOKIE_NAMES.TOOL_TAB)?.value
  );
  const initialDensity = resolveToolDensityFromCookie(
    cookieStore.get(COOKIE_NAMES.TOOL_DENSITY)?.value
  );

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl px-4 sm:px-6">
      <Hero />
      <UniversalTransmutator />
      <PrivacyBanner />
      <ToolBrowser
        initialLane={initialLane}
        initialTab={initialTab}
        initialDensity={initialDensity}
      />
    </div>
  );
}
