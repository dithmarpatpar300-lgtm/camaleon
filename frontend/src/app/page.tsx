import { Hero } from "@/components/transmute/Hero";
import { PrivacyBanner } from "@/components/transmute/PrivacyBanner";
import { ToolGrid } from "@/components/transmute/ToolGrid";

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl px-6">
      <Hero />
      <PrivacyBanner />
      <ToolGrid />
    </div>
  );
}
