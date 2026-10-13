
import Hero from "@/components/Hero";
import AgileBeginsValueSection from "@/components/sections/AgileBeginsValueSection";
import ExecutionGapSection from "@/components/sections/ExecutionGapSection";
import Navbar from "@/components/Navbar";

export default function Page() {
  return (
    <>
       <Navbar />
      <Hero />
      <ExecutionGapSection />
      <AgileBeginsValueSection />
    </>
  );
}
