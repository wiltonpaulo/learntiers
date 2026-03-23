"use client"

import Link from "next/link"
import { PlayCircle, Code2, ChevronRight, Sparkles, Youtube, Bot, FileText, Zap, Layout, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative pt-20 pb-20 lg:pt-32 lg:pb-32 overflow-hidden bg-white">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-50 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left space-y-8 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-primary text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Sparkles className="w-3.5 h-3.5" />
              The Smart Way to Learn Engineering
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-1000">
              Engineering Mastery, <span className="text-purple-600 text-glow-purple">Structured.</span>
            </h1>
            
            <p className="text-slate-600 text-lg md:text-xl leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000">
              We transform long-form community content into <span className="text-slate-900 font-semibold">organized technical courses</span>. 
              Navigate logically through <span className="text-slate-900 font-semibold">smart chapters</span> enhanced with AI Tutors and interactive code.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
              <Button size="lg" asChild className="h-14 px-8 text-lg font-bold rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 group w-full sm:w-auto transition-all active:scale-95">
                <Link href="/register">
                  Start Learning Free
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="h-14 px-8 text-lg font-bold text-slate-600 border-slate-200 bg-white hover:bg-slate-50 w-full sm:w-auto rounded-2xl">
                <Link href="/courses">
                  Browse 100+ Hours
                </Link>
              </Button>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-6 pt-8 border-t border-slate-100 animate-in fade-in duration-1000">
              <div className="flex items-center gap-2 text-slate-400">
                <Youtube className="w-5 h-5 text-red-500" />
                <p className="text-sm font-medium">
                  Aggregating <span className="text-slate-900 font-bold">top-tier content</span> from the community
                </p>
              </div>
            </div>
          </div>

          {/* Right Mockup: Comprehensive Course UI */}
          <div className="flex-1 relative w-full max-w-4xl lg:max-w-none animate-in fade-in zoom-in duration-1000 delay-200">
            <div className="relative rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-2xl shadow-slate-200/50 aspect-[16/9] group flex flex-col transition-all hover:shadow-primary/10">
              {/* Header */}
              <div className="h-9 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-2 shrink-0">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                </div>
                <div className="mx-auto bg-white border border-slate-100 rounded-md px-3 py-0.5 text-[8px] text-slate-400 font-mono">
                  learntiers.com/mastering-kubernetes
                </div>
              </div>

              {/* Layout Content */}
              <div className="flex flex-1 overflow-hidden">
                {/* Left: Curriculum Menu */}
                <div className="w-1/5 border-r border-slate-100 bg-slate-50/30 p-2 flex flex-col gap-1.5 shrink-0 hidden sm:flex">
                  <div className="flex items-center gap-1 mb-1 opacity-50">
                    <Layout className="w-2 h-2 text-primary" />
                    <span className="text-[7px] uppercase font-black text-slate-500">Menu</span>
                  </div>
                  <div className="p-1.5 bg-white rounded border border-purple-100 shadow-sm">
                    <div className="h-0.5 w-full bg-primary/30 rounded mb-0.5" />
                    <div className="h-0.5 w-2/3 bg-primary/30 rounded" />
                  </div>
                  <div className="space-y-1.5 px-1 pt-1 opacity-30">
                    <div className="h-0.5 w-full bg-slate-400 rounded" />
                    <div className="h-0.5 w-3/4 bg-slate-400 rounded" />
                    <div className="h-0.5 w-full bg-slate-400 rounded" />
                  </div>
                </div>

                {/* Center: Video (Terminal Screen) */}
                <div className="flex-1 relative bg-[#0d1117] flex flex-col group/play overflow-hidden">
                  {/* Terminal Header */}
                  <div className="h-5 bg-[#161b22] border-b border-white/5 flex items-center px-3 gap-2">
                    <Terminal className="w-2 h-2 text-slate-500" />
                    <span className="text-[7px] font-mono text-slate-500">bash — 80x24</span>
                  </div>
                  
                  {/* Terminal Body */}
                  <div className="p-4 font-mono text-[9px] space-y-1.5 flex-1">
                    <div className="flex gap-2"><span className="text-emerald-400">$</span> <span className="text-white">kubectl get pods</span></div>
                    <div className="text-slate-400 grid grid-cols-3 gap-2 pt-1 border-t border-white/5">
                      <span>NAME</span><span>READY</span><span>STATUS</span>
                      <span className="text-white">nginx-app</span><span className="text-white">1/1</span><span className="text-emerald-400">Running</span>
                      <span className="text-white">redis-db</span><span className="text-white">1/1</span><span className="text-emerald-400">Running</span>
                    </div>
                    <div className="flex gap-2 pt-2 animate-pulse"><span className="text-emerald-400">$</span> <span className="w-1 h-3 bg-primary" /></div>
                  </div>

                  {/* Central Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/play:bg-black/0 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-2xl scale-100 group-hover/play:scale-110 transition-transform">
                      <PlayCircle className="w-7 h-7 fill-current" />
                    </div>
                  </div>
                </div>

                {/* Right: AI Tutor Panel */}
                <div className="w-1/4 border-l border-slate-100 bg-slate-50/50 p-2.5 flex flex-col gap-3 shrink-0 hidden md:flex">
                  <div className="flex items-center gap-1.5 mb-1 opacity-50">
                    <Bot className="w-2.5 h-2.5 text-primary" />
                    <span className="text-[7px] uppercase font-black text-slate-500">AI Tutor</span>
                  </div>
                  
                  {/* User Question */}
                  <div className="self-end max-w-[90%]">
                    <div className="bg-slate-200/50 rounded-lg rounded-tr-none p-1.5 text-[7px] text-slate-600">
                      Explain kubectl get pods
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="flex gap-1.5 items-start">
                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Sparkles className="w-2.5 h-2.5 text-white" />
                    </div>
                    <div className="bg-white border border-slate-100 rounded-lg rounded-tl-none p-1.5 text-[7px] text-slate-700 shadow-sm leading-tight">
                      Lists all Pods in the current namespace.
                    </div>
                  </div>
                </div>
              </div>

              {/* Video Player Controls */}
              <div className="h-10 bg-white border-t border-slate-100 px-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <PlayCircle className="w-3 h-3 text-slate-400" />
                  <div className="h-1 w-24 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-primary" />
                  </div>
                  <span className="text-[7px] font-mono text-slate-400">12:40 / 45:00</span>
                </div>
                <div className="flex items-center gap-3 opacity-40">
                  <Code2 className="w-3 h-3" />
                  <FileText className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* Floating Decorative Badge */}
            <div className="absolute -bottom-4 -left-4 bg-white border border-slate-200 p-3 rounded-xl shadow-xl shadow-slate-200/50 hidden sm:block">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-purple-50 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[8px] uppercase font-black text-slate-400 leading-none">Interactive</p>
                  <p className="text-[10px] font-bold text-slate-900">Live Context</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
