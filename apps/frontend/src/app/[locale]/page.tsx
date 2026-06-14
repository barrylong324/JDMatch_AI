import LandingNavbar from '@/components/landing/landing-navbar';
import HeroSection from '@/components/landing/hero-section';
import FeaturesSection from '@/components/landing/features-section';
import HowItWorksSection from '@/components/landing/how-it-works-section';
import CtaSection from '@/components/landing/cta-section';
import LandingFooter from '@/components/landing/landing-footer';

export default function Home() {
    return (
        <div className="min-h-screen bg-white">
            <LandingNavbar />
            <HeroSection />
            <FeaturesSection />
            <HowItWorksSection />
            <CtaSection />
            <LandingFooter />
        </div>
    );
}
