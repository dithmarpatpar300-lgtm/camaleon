import { Hero } from "@/components/transmute/Hero";
import { PrivacyBanner } from "@/components/transmute/PrivacyBanner";
import { ToolBrowser } from "@/components/transmute/ToolBrowser";
import { UniversalTransmutator } from "@/components/transmute/UniversalTransmutator";

export default function Home() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl px-4 sm:px-6">
      <Hero />
      <UniversalTransmutator />
      <PrivacyBanner />
      <ToolBrowser />
    </div>
  );
}
