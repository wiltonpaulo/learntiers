"use client"

import React from "react"
import { LayoutGrid, Zap, BookOpenCheck, Github, Search, Code, Bot, Users } from "lucide-react"

const PILLARS = [
  {
    title: "Expert Curation",
    description: "We filter thousands of hours of YouTube content to aggregate only the most accurate and high-quality engineering courses.",
    icon: <Search className="w-8 h-8 text-purple-600" />,
    color: "bg-purple-50"
  },
  {
    title: "Smart Course Slicing",
    description: "We take long tutorials and logically slice them into manageable lessons, making it easy to track progress and master concepts one by one.",
    icon: <LayoutGrid className="w-8 h-8 text-blue-600" />,
    color: "bg-blue-50"
  },
  {
    title: "AI Enhancement",
    description: "Standard videos get 'superpowers' like real-time transcripts, AI-powered code generation, and context-aware technical assistance.",
    icon: <Bot className="w-8 h-8 text-amber-600" />,
    color: "bg-amber-50"
  },
  {
    title: "Practical Validation",
    description: "Master each topic through technical quizzes and hands-on GitHub labs designed to test real-world engineering skills.",
    icon: <Code className="w-8 h-8 text-emerald-600" />,
    color: "bg-emerald-50"
  }
]

export function ValuePropositionGrid() {
  return (
    <section className="py-24 bg-slate-50 border-y border-slate-200">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {PILLARS.map((pillar, i) => (
            <div key={i} className="p-8 rounded-3xl bg-white border border-slate-200 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-50 transition-all duration-300 space-y-4 text-center md:text-left group">
              <div className={`w-16 h-16 rounded-2xl ${pillar.color} flex items-center justify-center mb-6 mx-auto md:mx-0 group-hover:scale-110 transition-transform`}>
                {pillar.icon}
              </div>
              <h4 className="text-xl font-bold text-slate-900 tracking-tight">{pillar.title}</h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
