"use client"

import React from "react"
import Link from "next/link"
import { Check, ChevronRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const PLANS = [
  {
    name: "Early Adopter",
    price: "0",
    description: "Full access to our curated library during the beta period.",
    features: [
      "Access to all current courses",
      "Interactive AI transcripts",
      "Community ranking",
      "Cloud-synced notes"
    ],
    cta: "Start Learning Free",
    href: "/register",
    featured: true
  },
  {
    name: "Pro",
    price: "??",
    description: "Advanced engineering features coming soon.",
    features: [
      "Context-Aware AI Code Tutor",
      "Verified Certificates",
      "Private GitHub Repos",
      "Priority Community Support"
    ],
    cta: "Join the Waitlist",
    href: "/register"
  }
]

export function PricingSection() {
  return (
    <section className="py-24 bg-slate-950" id="pricing">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
            <Sparkles className="w-3 h-3" />
            Limited Time Offer
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Learn Engineering for <span className="text-primary">Free</span>
          </h2>
          <p className="text-slate-400 text-lg">
            We're in beta. Join now to get full access to all features as we build the future of technical education.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-center">
          {PLANS.map((plan, i) => (
            <div 
              key={i} 
              className={cn(
                "p-8 rounded-3xl border transition-all duration-500",
                plan.featured 
                  ? "bg-primary/5 border-primary/30 scale-105 shadow-2xl shadow-primary/10 relative z-10 py-12" 
                  : "bg-slate-900/50 border-white/5 opacity-60 grayscale hover:opacity-100 hover:grayscale-0"
              )}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full whitespace-nowrap">
                  Current Status
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">
                    {plan.price === "0" ? "FREE" : "$??"}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-4 leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm text-slate-300">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button 
                variant={plan.featured ? "default" : "outline"} 
                size="lg" 
                asChild 
                className={cn(
                  "w-full h-14 font-bold rounded-2xl text-base transition-transform active:scale-95",
                  plan.featured ? "shadow-xl shadow-primary/20" : "text-white border-white/10 hover:bg-white/5"
                )}
              >
                <Link href={plan.href}>
                  {plan.cta}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
