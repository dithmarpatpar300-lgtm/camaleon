import { Hero } from "@/components/transmute/Hero";
import { PrivacyBanner } from "@/components/transmute/PrivacyBanner";
import { ToolGrid } from "@/components/transmute/ToolGrid";

export default function Home() {
  return (
    <>
      <Hero />
      <PrivacyBanner />
      <ToolGrid />
    </>
  );
}
