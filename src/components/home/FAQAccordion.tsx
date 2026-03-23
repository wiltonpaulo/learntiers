"use client"

import React, { useState } from "react"
import { ChevronDown, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const FAQS = [
  {
    question: "How are the courses structured?",
    answer: "We take high-quality, long-form technical content from the community and logically slice it into structured lessons. Instead of getting lost in a 4-hour video, you get a clear syllabus with trackable progress, AI summaries, and interactive labs."
  },
  {
    question: "Where does the content come from?",
    answer: "We carefully curate top-tier engineering content from YouTube. We don't just 'embed' videos; we transform them into a structured course experience with AI transcripts, context-aware code generation, and practice quizzes."
  },
  {
    question: "How does the AI Tutor work?",
    answer: "Our AI Tutor has access to the full context of the video you're watching. It can answer specific questions about the lesson and generate production-ready code snippets (YAML, Terraform, Go) tailored to that exact moment in the video."
  },
  {
    question: "Is it really free?",
    answer: "Yes! Currently, all courses and core platform features are free for our community. We believe in providing high-quality engineering education to everyone."
  },
  {
    question: "Do I get a certificate?",
    answer: "Absolutely. Once you complete all lessons and pass the quizzes for a course, you'll receive a digital certificate that can be verified and shared on LinkedIn."
  }
]

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="py-24 bg-slate-50 border-t border-slate-200">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex p-3 rounded-2xl bg-purple-50 mb-4 border border-purple-100">
            <HelpCircle className="w-6 h-6 text-purple-600" />
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Common <span className="text-purple-600">Questions</span>
          </h2>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i
            return (
              <div 
                key={i} 
                className={cn(
                  "rounded-2xl border transition-all duration-300",
                  isOpen ? "bg-white border-purple-200 shadow-xl shadow-purple-50" : "bg-white border-slate-200 hover:border-slate-300"
                )}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left outline-none"
                >
                  <span className="font-bold text-slate-900 pr-8 leading-snug">{faq.question}</span>
                  <ChevronDown className={cn(
                    "w-5 h-5 text-slate-400 transition-transform duration-300",
                    isOpen && "rotate-180 text-purple-600"
                  )} />
                </button>
                
                <div className={cn(
                  "overflow-hidden transition-all duration-300 ease-in-out",
                  isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                )}>
                  <div className="p-6 pt-0 text-slate-600 text-sm leading-relaxed border-t border-slate-50 mt-2">
                    {faq.answer}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
