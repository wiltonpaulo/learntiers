"use client"

import React from "react"
import { PlayCircle, Sparkles, Github, Terminal, Cpu, Bot, FileText, ClipboardCheck, History, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const FEATURES = [
  {
    title: "AI-Powered Transcripts",
    description: "Never miss a technical detail. Our player features real-time transcript highlighting and searchable text. Jump straight to any part of the lesson based on the logical structure of the content.",
    icon: <FileText className="w-8 h-8 text-purple-600" />,
    image: "bg-purple-50/50",
    badges: ["Syllabus Sync", "Interactive Text"],
    extra: (
      <div className="w-full max-w-[260px] bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-slate-200/40 p-5">
        <div className="text-[11px] leading-[1.8] text-slate-400">
          <span>First we need to declare the api version. </span>
          <span className="relative inline-block">
            <span className="bg-purple-600 text-white px-1.5 py-0.5 rounded shadow-lg shadow-purple-200 font-bold scale-105 relative z-10 mx-1">
              Then we define the ingress rules for the controller
            </span>
            <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-purple-200 rounded-full animate-pulse" />
          </span>
          <span> to manage incoming traffic based on host or path definitions. This is crucial for microservice communication...</span>
        </div>
      </div>
    )
  },
  {
    title: "Context-Aware AI Tutor",
    description: "Get instant engineering support. Our AI understands the exact context of the video and generates production-ready YAML, Go, or Terraform snippets tailored to the current topic.",
    icon: <Bot className="w-8 h-8 text-blue-600" />,
    image: "bg-blue-50/50",
    badges: ["Contextual Code", "Technical QA"],
    reverse: true,
    extra: (
      <div className="w-full max-w-[260px] bg-white border border-blue-100 rounded-2xl shadow-2xl shadow-blue-500/10 overflow-hidden flex flex-col">
        {/* Chat Header */}
        <div className="px-3 py-2 border-b border-blue-50 bg-blue-50/30 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">AI Tutor Online</span>
        </div>
        
        {/* Chat Body */}
        <div className="p-3 space-y-3">
          {/* User Message */}
          <div className="flex flex-col items-end">
            <div className="bg-slate-100 rounded-2xl rounded-tr-none px-3 py-2 text-[10px] text-slate-600 max-w-[90%] leading-snug">
              How do I expose this Pod to the network?
            </div>
          </div>

          {/* AI Message */}
          <div className="flex gap-2 items-start">
            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl rounded-tl-none px-3 py-2 text-[10px] text-blue-900 max-w-[90%] leading-relaxed">
              <p className="mb-2">You can use a <span className="font-bold underline decoration-blue-300">Service</span> object. Here is the YAML snippet:</p>
              <pre className="text-[8px] font-mono text-blue-700 bg-white/50 p-1.5 rounded border border-blue-100">
                {`kind: Service\nmetadata:\n  name: my-app`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "Time-Anchored Technical Notes",
    description: "Capture critical insights without missing a beat. Create notes with text and precise anchor points in time. With one click, jump back to the exact moment in the video to recover the context and review the lesson.",
    icon: <ClipboardCheck className="w-8 h-8 text-emerald-600" />,
    image: "bg-emerald-50/50",
    badges: ["Time-Anchor", "Instant Recovery"],
    extra: (
      <div className="w-full max-w-[240px] space-y-3">
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-xl shadow-emerald-500/10 relative overflow-hidden group/note">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                <FileText className="w-3 h-3 text-emerald-600" />
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">My Note</span>
            </div>
            <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              <History className="w-2.5 h-2.5 text-emerald-600" />
              <span className="text-[9px] font-bold text-emerald-700 font-mono">12:40</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-700 leading-relaxed font-medium mb-4">
            The <span className="text-emerald-600 font-bold underline decoration-emerald-200">Ingress Controller</span> must be configured with SSL certificates before deploying.
          </p>

          <Button size="sm" className="w-full h-8 text-[9px] font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 shadow-lg shadow-emerald-100 transition-all active:scale-95">
            <PlayCircle className="w-3 h-3 fill-current" />
            RECOVER CONTEXT
          </Button>
        </div>
      </div>
    )
  },
  {
    title: "Instant Contextual Code",
    description: "Get production-ready code snippets generated exactly for the lesson's context. From Python automation scripts to complex cloud configurations, the code you need is generated and ready to run in seconds.",
    icon: <Terminal className="w-8 h-8 text-amber-600" />,
    image: "bg-amber-50/50",
    badges: ["Python & Go", "One-Click Copy"],
    reverse: true,
    extra: (
      <div className="w-full max-w-[260px] bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-800 flex flex-col">
        {/* Editor Header */}
        <div className="px-3 py-2 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500/40" />
            <div className="w-2 h-2 rounded-full bg-amber-500/40" />
            <div className="w-2 h-2 rounded-full bg-emerald-500/40" />
          </div>
          <span className="text-[8px] font-mono text-slate-500">process_data.py</span>
        </div>

        {/* Editor Body */}
        <div className="p-4 font-mono text-[10px] leading-relaxed">
          <div className="flex gap-3"><span className="text-slate-600">1</span> <span className="text-purple-400">import</span> <span className="text-white">json</span></div>
          <div className="flex gap-3"><span className="text-slate-600">2</span> </div>
          <div className="flex gap-3"><span className="text-slate-600">3</span> <span className="text-purple-400">def</span> <span className="text-blue-400">parse_metrics</span><span className="text-white">(raw):</span></div>
          <div className="flex gap-3 pl-4"><span className="text-slate-600">4</span> <span className="text-white">data = json.loads(raw)</span></div>
          <div className="flex gap-3 pl-4"><span className="text-slate-600">5</span> <span className="text-purple-400">return</span> <span className="text-white">data[</span><span className="text-emerald-400">"status"</span><span className="text-white">]</span></div>
        </div>

        {/* Footer Action */}
        <div className="p-2 border-t border-slate-800 bg-slate-900/50">
          <div className="w-full h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-[8px] font-black text-primary uppercase">Generated from Lesson Context</span>
          </div>
        </div>
      </div>
    )
  }
]

export function FeatureZigZag() {
  return (
    <section className="py-20 space-y-24 bg-white">
      <div className="container mx-auto px-4">
        {FEATURES.map((feature, i) => (
          <div 
            key={i} 
            className={cn(
              "flex flex-col lg:flex-row items-center gap-12 lg:gap-20",
              feature.reverse && "lg:flex-row-reverse"
            )}
          >
            {/* Text Content */}
            <div className="flex-1 space-y-4 text-center lg:text-left">
              <div className="inline-flex p-3 rounded-2xl bg-slate-50 border border-slate-100 mb-1 shadow-sm">
                {feature.icon}
              </div>
              <h3 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                {feature.title}
              </h3>
              <p className="text-slate-600 text-base md:text-lg leading-relaxed max-w-lg mx-auto lg:mx-0">
                {feature.description}
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-2 pt-1">
                {feature.badges.map(badge => (
                  <span key={badge} className="px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Visual Block - More compact */}
            <div className="flex-1 w-full max-w-xl relative group">
              <div className={cn(
                "aspect-[16/9] rounded-[32px] overflow-hidden border border-slate-200 shadow-lg transition-all duration-700 group-hover:scale-[1.01] group-hover:border-primary/20 flex items-center justify-center relative shadow-slate-200/40",
                feature.image
              )}>
                {/* Visual Content Placeholder */}
                <div className="relative z-10 w-full flex justify-center px-6">
                  {feature.extra}
                </div>
                
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity" 
                  style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '20px 24px' }} 
                />
              </div>
              
              {/* Decorative Glow - Subtle */}
              <div className={cn(
                "absolute -inset-4 rounded-[40px] blur-2xl -z-10 opacity-0 group-hover:opacity-30 transition-opacity duration-700",
                i === 0 ? "bg-primary/20" : i === 1 ? "bg-blue-500/20" : "bg-emerald-500/20"
              )} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
