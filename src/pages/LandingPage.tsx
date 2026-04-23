import { Toaster } from 'sonner';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import TechStackSection from '@/components/landing/TechStackSection';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Toaster position="top-center" theme="dark" />
      
      {/* Navigation */}
      <Navbar />
      
      {/* Main Content */}
      <main>
        {/* Hero - 首屏主视觉 */}
        <HeroSection />
        
        {/* Features - 核心功能 */}
        <FeaturesSection />
        
        {/* Tech Stack - 技术架构 */}
        <TechStackSection />
        
        {/* CTA - 行动召唤 */}
        <CTASection />
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
