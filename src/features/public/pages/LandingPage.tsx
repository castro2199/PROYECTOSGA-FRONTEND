import { LandingBenefits } from "../components/LandingBenefits";
import { LandingHero } from "../components/LandingHero";
import { LandingModules } from "../components/LandingModules";
import { LandingTechnology } from "../components/LandingTechnology";

export function LandingPage() {
  return (
    <main>
      <LandingHero />
      <LandingBenefits />
      <LandingModules />
      <LandingTechnology />
    </main>
  );
}
