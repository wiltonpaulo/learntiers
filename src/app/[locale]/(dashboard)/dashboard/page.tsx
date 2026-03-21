'use client'

import React from 'react'
import { 
  Play, 
  Clock, 
  Star, 
  TrendingUp, 
  ChevronRight, 
  Layout, 
  Zap, 
  Award,
  BookOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_USER = {
  name: 'Wilton',
  role: 'Senior Developer',
  stats: {
    hoursWatched: 42,
    thisWeekHours: 12,
    completedLessons: 156,
    activeStreak: 8
  }
}

const CONTINUE_WATCHING = [
  {
    id: '1',
    title: 'Kubernetes Mastery: From Zero to Pro',
    instructor: 'Alex Rivera',
    progress: 65,
    lastLesson: 'Deployment Strategies',
    thumbnail: 'bg-gradient-to-br from-blue-600 to-indigo-900',
    duration: '12h 30m'
  },
  {
    id: '2',
    title: 'Advanced Go Patterns & Concurrency',
    instructor: 'Sarah Chen',
    progress: 32,
    lastLesson: 'Worker Pools in Depth',
    thumbnail: 'bg-gradient-to-br from-cyan-500 to-blue-800',
    duration: '8h 45m'
  }
]

const NEW_RELEASES = [
  {
    id: '3',
    title: 'Rust for Systems Engineering',
    instructor: 'Marcus Aurelius',
    level: 'Advanced',
    duration: '15h',
    thumbnail: 'bg-gradient-to-br from-orange-600 to-red-900'
  },
  {
    id: '4',
    title: 'Terraform Cloud Infrastructure',
    instructor: 'Elena Rodriguez',
    level: 'Intermediate',
    duration: '10h',
    thumbnail: 'bg-gradient-to-br from-purple-600 to-indigo-900'
  },
  {
    id: '5',
    title: 'AWS Serverless Architecture',
    instructor: 'David Miller',
    level: 'Expert',
    duration: '18h',
    thumbnail: 'bg-gradient-to-br from-yellow-500 to-orange-700'
  }
]

const RECOMMENDED = [
  {
    id: '6',
    title: 'Docker Containers in Production',
    instructor: 'Alex Rivera',
    rating: 4.9,
    thumbnail: 'bg-gradient-to-br from-blue-400 to-blue-700'
  },
  {
    id: '7',
    title: 'Prometheus & Grafana Monitoring',
    instructor: 'Sarah Chen',
    rating: 4.8,
    thumbnail: 'bg-gradient-to-br from-red-500 to-orange-600'
  },
  {
    id: '8',
    title: 'Ansible Automation at Scale',
    instructor: 'Marcus Aurelius',
    rating: 4.7,
    thumbnail: 'bg-gradient-to-br from-slate-600 to-slate-900'
  }
]

// ─── Components ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">
        
        {/* Header Greeting */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              Welcome back, <span className="text-primary">{MOCK_USER.name}</span>
            </h1>
            <p className="text-slate-400 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              You have completed <span className="text-white font-bold">{MOCK_USER.stats.thisWeekHours} hours</span> this week. Keep the streak!
            </p>
          </div>
          
          <div className="flex gap-4 sm:gap-8 pb-1">
            <StatItem icon={<Clock className="w-4 h-4" />} label="Learning Hours" value={`${MOCK_USER.stats.hoursWatched}h`} />
            <StatItem icon={<Award className="w-4 h-4" />} label="Lessons Done" value={MOCK_USER.stats.completedLessons} />
            <StatItem icon={<TrendingUp className="w-4 h-4 text-emerald-500" />} label="Day Streak" value={MOCK_USER.stats.activeStreak} />
          </div>
        </section>

        {/* Continue Watching Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Play className="w-5 h-5 fill-primary text-primary" />
              Continue Watching
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CONTINUE_WATCHING.map((course) => (
              <div 
                key={course.id}
                className="group relative bg-[#141414] rounded-2xl border border-white/5 overflow-hidden hover:border-white/20 transition-all duration-300 shadow-2xl"
              >
                <div className="flex flex-col sm:flex-row h-full">
                  {/* Thumbnail */}
                  <div className={cn("w-full sm:w-48 h-40 sm:h-auto relative shrink-0", course.thumbnail)}>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/0 transition-colors">
                      <Button size="icon" className="rounded-full w-12 h-12 shadow-xl scale-90 group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 fill-current" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">
                          {course.title}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500">Next: {course.lastLesson}</p>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <span>{course.progress}% Complete</span>
                          <span>{course.duration} total</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-1000 ease-out" 
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                      <Button variant="secondary" size="sm" className="w-full text-xs font-bold h-8">
                        Resume Lesson
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* New Releases Carousel */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
              New Releases
            </h2>
            <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-400 hover:text-white">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x">
            {NEW_RELEASES.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>

        {/* Recommended for You */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Layout className="w-5 h-5 text-indigo-500" />
              Recommended for You
            </h2>
          </div>
          
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x">
            {RECOMMENDED.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>

      </div>

      {/* Global CSS for scrollbar-hide */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}

function StatItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <div className="flex flex-col items-center sm:items-start">
      <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-xl font-black">{value}</span>
    </div>
  )
}

function CourseCard({ course }: { course: any }) {
  return (
    <div className="min-w-[240px] sm:min-w-[280px] group cursor-pointer snap-start">
      <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-3 shadow-lg">
        <div className={cn("absolute inset-0 transition-transform duration-500 group-hover:scale-110", course.thumbnail)} />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
        
        {course.level && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-black/60 backdrop-blur-md border-none text-[10px] font-bold uppercase py-0 px-2 h-5">
              {course.level}
            </Badge>
          </div>
        )}

        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-xl">
            <Play className="w-4 h-4 fill-current text-white" />
          </div>
        </div>
      </div>
      
      <div className="space-y-1">
        <h3 className="font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {course.title}
        </h3>
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>{course.instructor}</span>
          {course.duration ? (
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.duration}</span>
          ) : (
            <span className="flex items-center gap-1 text-amber-500"><Star className="w-3 h-3 fill-current" /> {course.rating}</span>
          )}
        </div>
      </div>
    </div>
  )
}
