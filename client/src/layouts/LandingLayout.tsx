import React from "react";
import { Outlet } from "react-router-dom";
import { Navigation } from "@/components/ui/navigation";
import { HeroSection } from "@/components/ui/hero-section";
import { SocialProof } from "@/components/ui/social-proof";
import { FeaturesSection } from "@/components/ui/features-section";
import { TemplatesSection } from "@/components/ui/templates-section";
import { PricingSection } from "@/components/ui/pricing-section";
import { TestimonialsSection } from "@/components/ui/testimonials-section";
import { CTASection } from "@/components/ui/cta-section";
import { Footer } from "@/components/ui/footer";

export default function LandingLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation /> {/* only for landing */}
      <Outlet />
      <HeroSection />
      <SocialProof />
      <FeaturesSection />
      <TemplatesSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}

