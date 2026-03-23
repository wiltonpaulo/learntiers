import Link from "next/link"
import { HeroSection } from "@/components/home/HeroSection"
import { TechStackLogos } from "@/components/home/TechStackLogos"
import { FeatureZigZag } from "@/components/home/FeatureZigZag"
import { ValuePropositionGrid } from "@/components/home/ValuePropositionGrid"
import { PublicCourseCarousel } from "@/components/home/PublicCourseCarousel"
import { CommunityCTASection } from "@/components/home/CommunityCTASection"
import { FAQAccordion } from "@/components/home/FAQAccordion"

/**
 * Landing Page — Premium Light Theme Refactor.
 * Focus: Premium, crisp aesthetic with subtle off-whites and purple accents.
 */
export default async function HomePage() {
  return (
    <div className="bg-slate-50 overflow-x-hidden min-h-screen">
      {/* ── Hero Section ────────────────────────────────────────────────── */}
      <HeroSection />

      {/* ── Authority Logo Cloud ────────────────────────────────────────── */}
      <TechStackLogos />

      {/* ── Value Props: Why Aggregator? ───────────────────────────────── */}
      <ValuePropositionGrid />

      {/* ── Deep Dive Features: The Superpowers ─────────────────────────── */}
      <FeatureZigZag />

      {/* ── Real Course Data Carousel ──────────────────────────────────── */}
      <PublicCourseCarousel />

      {/* ── Community CTA: 100% Free ───────────────────────────────────── */}
      <CommunityCTASection />

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <FAQAccordion />

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <section className="py-32 relative overflow-hidden bg-white border-t border-slate-200">
        <div className="absolute inset-0 bg-purple-50/50 -z-10 blur-[120px] rounded-full scale-75 animate-pulse" />
        <div className="container mx-auto px-4 text-center space-y-10 relative z-10">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tight leading-tight">
              Ready to master <br className="hidden md:block" /> 
              the <span className="text-purple-600">next level?</span>
            </h2>
            <p className="text-slate-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Join thousands of engineers who are already accelerating their careers 
              through curated, AI-enhanced technical courses.
            </p>
          </div>
          
          <div className="pt-6">
            <Link 
              href="/?auth=register"
              className="inline-flex h-16 items-center px-12 bg-purple-600 text-white font-bold text-xl rounded-2xl shadow-xl shadow-purple-200 hover:bg-purple-700 transition-all hover:scale-105 active:scale-95 group"
            >
              Get Started for Free
              <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <p className="text-slate-500 text-sm mt-6 font-medium">
              No credit card required. Beta access is open.
            </p>
          </div>

        </div>
      </section>
    </div>
  )
}
