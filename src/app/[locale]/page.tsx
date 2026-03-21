import { createClient } from '@/lib/supabase/server'
import { Link } from '@/i18n/routing'
import { GraduationCap, BookOpen, Clock, ChevronRight, Trophy, Star, Users, ShieldCheck } from 'lucide-react'
import type { CourseRow } from '@/types/database'

/**
 * Home Page — Landing page with the same professional style as the course details.
 */
export default async function HomePage() {
  const supabase = await createClient()

  // Fetch courses to display on the home screen
  const [coursesRes, userRes] = await Promise.all([
    supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase.auth.getUser(),
  ])

  const courses = coursesRes.data as CourseRow[] | null
  const user = userRes.data.user
  const isAdmin = user?.app_metadata?.role === 'admin'

  // Fetch profile if user is logged in
  const { data: profileData } = user 
    ? await supabase.from('users').select('name').eq('id', user.id).maybeSingle()
    : { data: null }

  const profile = profileData as { name: string } | null
  const displayName = profile?.name || user?.email?.split('@')[0]

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero Section ────────────────────────────────────────────────── */}
      <div className="bg-slate-900 text-white py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-2xl tracking-tight">LearnTiers</span>
            </div>
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold hover:bg-amber-500/20 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Panel
              </Link>
            )}
          </div>

          <div className="max-w-3xl space-y-6">
            {user ? (
              <div className="space-y-2 mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-primary-400">
                  Welcome back, {displayName}
                </h2>
                <div className="space-y-4">
                  <p className="text-white text-xl md:text-2xl font-extrabold">
                    Let's continue your learning journey!
                  </p>
                </div>
              </div>
            ) : (
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
                Master New Skills with <span className="text-primary-400">Micro-Lessons</span>
              </h1>
            )}
            
            {!user && (
              <p className="text-slate-300 text-lg md:text-xl leading-relaxed max-w-2xl">
                The smartest way to learn. Bite-sized video lessons, interactive quizzes, 
                and a community of students pushing their limits.
              </p>
            )}

            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                href={user ? "/my-learning" : "/courses"}
                className="bg-primary text-primary-foreground px-8 py-4 rounded-none font-bold text-lg hover:bg-primary/90 transition-all flex items-center gap-2"
              >
                {user ? 'Continue My Learning' : 'Explore All Courses'}
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-12 border-t border-white/10">
            <Stat icon={<Users className="w-5 h-5 text-primary-400" />} label="10k+ Students" />
            <Stat icon={<BookOpen className="w-5 h-5 text-primary-400" />} label="50+ Courses" />
            <Stat icon={<Star className="w-5 h-5 text-primary-400" />} label="4.9 Avg Rating" />
            <Stat icon={<Trophy className="w-5 h-5 text-primary-400" />} label="Daily Rewards" />
          </div>
        </div>
      </div>

      {/* ── Featured Courses Grid ────────────────────────────────────────── */}
      <div className="container mx-auto max-w-5xl px-4 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Featured Courses</h2>
            <p className="text-muted-foreground mt-2">Start your learning journey today with our top-rated content.</p>
          </div>
          <Link href="/courses" className="text-primary font-bold hover:underline hidden md:block">
            View all courses
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses?.map((course) => (
            <Link 
              key={course.id} 
              href={`/courses/${course.id}`}
              className="group border bg-card hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              <div className="aspect-video bg-muted relative overflow-hidden">
                {course.cover_image_url ? (
                  <img 
                    src={course.cover_image_url} 
                    alt={course.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                    <GraduationCap className="w-10 h-10 text-slate-300" />
                  </div>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                  {course.description}
                </p>
                <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground pt-4 border-t">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Free Access</span>
                  <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" /> 4.8</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-sm md:text-base font-medium text-slate-300">{label}</span>
    </div>
  )
}
