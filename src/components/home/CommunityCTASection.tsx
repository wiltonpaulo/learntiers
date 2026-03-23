"use client"

import * as React from "react"
import Link from "next/link"
import { CheckCircle2, ChevronRight, Sparkles, Zap, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export function CommunityCTASection() {
  const [user, setUser] = React.useState<any>(null)
  const supabase = createClient()

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [supabase])

  return (
    <section className="py-24 bg-white" id="join">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-[2.5rem] bg-slate-50 border border-slate-200 p-8 md:p-16 overflow-hidden shadow-2xl shadow-slate-200/50">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Heart className="w-64 h-64 text-purple-600 fill-current" />
            </div>
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-purple-600 text-[10px] font-black uppercase tracking-widest shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                Community Driven Model
              </div>

              <div className="space-y-4 max-w-3xl">
                <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                  Engineering Mastery. <br className="hidden md:block" /> 
                  <span className="text-purple-600">100% Free.</span>
                </h2>
                <p className="text-slate-600 text-lg md:text-xl leading-relaxed font-medium">
                  We believe top-tier technical education shouldn't be locked behind paywalls. 
                  We curate the best content, add powerful AI tools, and give it to the community for free.
                </p>
              </div>

              {/* High-end Feature Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full pt-4">
                <FeatureItem text="Unlimited curated paths" />
                <FeatureItem text="Interactive AI transcripts" />
                <FeatureItem text="Context-Aware AI Code tools" />
                <FeatureItem text="Cloud-synced study notes" />
              </div>

              <div className="pt-8">
                <Button 
                  size="lg" 
                  asChild 
                  className="h-16 px-12 text-lg font-black bg-purple-600 hover:bg-purple-700 text-white rounded-2xl shadow-2xl shadow-purple-200 transition-all hover:scale-105 active:scale-95 group"
                >
                  <Link href={user ? "/my-learning" : "/?auth=register"}>
                    {user ? "Back to My Learning" : "Join the Community for Free"}
                    <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <p className="text-slate-400 text-xs mt-6 font-bold uppercase tracking-widest">
                  Zero cost. Zero barriers. Just learning.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm transition-transform hover:-translate-y-1">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center">
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      </div>
      <span className="text-xs font-bold text-slate-700 text-left">{text}</span>
    </div>
  )
}
