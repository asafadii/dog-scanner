import CtaBand from "@/components/landing/sections/CtaBand";
import FaqBand from "@/components/landing/sections/FaqBand";
import FeaturesBand from "@/components/landing/sections/FeaturesBand";
import FooterBand from "@/components/landing/sections/FooterBand";
import HeroBand from "@/components/landing/sections/HeroBand";
import HowItWorksBand from "@/components/landing/sections/HowItWorksBand";
import OperationsBand from "@/components/landing/sections/OperationsBand";

export function LandingPage() {
  return (
    <div className="bg-[#FBF3E6] font-sans">
      <HeroBand />
      <FeaturesBand />
      <OperationsBand />
      <HowItWorksBand />
      <FaqBand />
      <CtaBand />
      <FooterBand />
    </div>
  );
}
