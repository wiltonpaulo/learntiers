import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Trophy, Calendar, Award, ChevronRight, ExternalLink } from 'lucide-react'
import type { UserRow } from '@/types/database'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'

export default async function CertificatesPage() {
  const locale = await getLocale()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/${locale}/login`)

  const [progressRes, certificatesRes, coursesRes] = await Promise.all([
    supabase
      .from('user_progress')
      .select('section_id, is_completed')
      .eq('user_id', user.id),
    supabase
      .from('certificates')
      .select('course_id, verification_code, issued_at, courses(title, cover_image_url)')
      .eq('user_id', user.id)
      .order('issued_at', { ascending: false }),
    supabase
      .from('courses')
      .select('id, title, course_sections(id)')
  ])

  const progress = (progressRes.data ?? []) as any[]
  let certificates = (certificatesRes.data ?? []) as any[]
  const allCourses = (coursesRes.data ?? []) as any[]

  // --- Auto-issue missing certificates (Logic moved from Profile) ---
  const completedSectionIds = new Set(progress.filter(p => p.is_completed).map(p => p.section_id))
  const existingCertCourseIds = new Set(certificates.map(c => c.course_id))
  const newlyIssuedCerts: any[] = []

  for (const course of allCourses) {
    const sectionIds = (course.course_sections || []).map((s: any) => s.id)
    if (sectionIds.length === 0) continue
    const isFinished = sectionIds.every((id: string) => completedSectionIds.has(id))
    
    if (isFinished && !existingCertCourseIds.has(course.id)) {
      const adminDb = createAdminClient()
      const { data: newCert } = await (adminDb as any)
        .from('certificates')
        .upsert({ user_id: user.id, course_id: course.id }, { onConflict: 'user_id,course_id' })
        .select('course_id, verification_code, issued_at, courses(title, cover_image_url)')
        .single()
      if (newCert) newlyIssuedCerts.push(newCert)
    }
  }

  if (newlyIssuedCerts.length > 0) {
    certificates = [...newlyIssuedCerts, ...certificates].sort((a, b) => 
      new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="py-12 border-b" style={{ backgroundColor: 'var(--nav-bg)' }}>
        <div className="container mx-auto max-w-5xl px-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <Award className="w-6 h-6 text-amber-500" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">My Certificates</h1>
          </div>
          <p className="text-white/50 text-sm max-w-lg">
            Congratulations on your achievements! Here you can find all the certificates you've earned by completing our courses.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-6 py-12">
        {certificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <div 
                key={cert.verification_code} 
                className="group bg-card border rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-300 flex flex-col"
              >
                <div className="aspect-video relative overflow-hidden bg-muted">
                  {cert.courses?.cover_image_url ? (
                    <img 
                      src={cert.courses.cover_image_url} 
                      alt={cert.courses.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                      <Award className="w-12 h-12 text-slate-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <Link 
                      href={`/${locale}/verify/${cert.verification_code}`}
                      className="w-full bg-white text-slate-900 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Certificate
                    </Link>
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-primary transition-colors">
                      {cert.courses?.title || 'Course Completion'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                        Issued {new Date(cert.issued_at).toLocaleDateString(locale, { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                      ID: {cert.verification_code.split('-')[0]}...
                    </span>
                    <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20 text-[10px] font-bold uppercase tracking-tighter">
                      Verified
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center">
              <Award className="w-10 h-10 text-slate-300" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">No certificates yet</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                Complete all lessons in a course to earn your official certificate of completion.
              </p>
            </div>
            <Link 
              href={`/${locale}/courses`} 
              className="bg-primary text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Browse Courses
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
