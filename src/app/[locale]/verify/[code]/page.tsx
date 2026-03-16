import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { GraduationCap, Award, CheckCircle2, ShieldCheck, Globe, Clock } from 'lucide-react'
import { CertificateActions } from '@/components/certificate/CertificateActions'
import { getLocale } from 'next-intl/server'
import { CertificateRow, CourseRow, UserRow, CourseSectionRow } from '@/types/database'

interface VerifyPageProps {
  params: Promise<{ code: string; locale:string }>
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { code } = await params
  const locale = await getLocale()
  const supabase = await createClient()
  const adminDb = createAdminClient()

  // 1. Fetch certificate with user and course details
  // Using admin client to ensure we always find it (RLS safe for public verification)
  console.log('Verifying certificate with code:', code)
  const result = await adminDb
    .from('certificates')
    .select(`
      *,
      users ( name, email ),
      courses ( id, title, description )
    `)
    .eq('verification_code', code)
    .single()

  console.log('Full result from Supabase:', JSON.stringify(result, null, 2))
  
  const { data: certificate, error } = result

  if (error) {
    console.error('Certificate verification DB error:', JSON.stringify(error, null, 2))
    notFound()
  }

  if (!certificate) {
    console.log('No certificate found for code:', code)
    notFound()
  }

  const typedCertificate = certificate as (CertificateRow & { users: UserRow, courses: CourseRow });
  console.log('Certificate found:', typedCertificate.id)

  // 2. Fetch course sections to get aggregated key takeaways, duration and count
  const { data } = await adminDb
    .from('course_sections')
    .select('key_takeaways, start_time_seconds, end_time_seconds')
    .eq('course_id', typedCertificate.course_id)
    .order('order_index', { ascending: true })

  const sections = data as (Pick<CourseSectionRow, "key_takeaways" | "start_time_seconds" | "end_time_seconds">)[] | null;
  const moduleCount = sections?.length || 0

  // Calculate total duration
  const totalSeconds = (sections ?? []).reduce((acc, s) => acc + (s.end_time_seconds - s.start_time_seconds), 0)
  const totalHours = Math.round((totalSeconds / 3600) * 10) / 10 // round to 1 decimal

  const issuedDate = new Date(typedCertificate.issued_at).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-12 px-4 md:py-20 print:bg-white print:text-slate-900 print:p-0">
      {/* Force Landscape and High Quality Colors for PDF Printing */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: landscape; margin: 0; }
          body { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
            background-color: white !important;
          }
        }
      `}} />

      <div className="container mx-auto max-w-6xl">

        {/* ── Certificate Card (Landscape Aspect Ratio) ───────────────────── */}
        <div className="relative bg-slate-900 border-[16px] border-slate-800 p-8 md:p-16 shadow-2xl overflow-hidden print:border-[12pt] print:border-slate-100 print:bg-white print:shadow-none print:m-0 print:w-full print:h-[210mm] aspect-[1.414/1] flex flex-col justify-between">

          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-48 h-48 border-t-8 border-l-8 border-primary/20 -translate-x-6 -translate-y-6 print:border-slate-200" />
          <div className="absolute bottom-0 right-0 w-48 h-48 border-b-8 border-r-8 border-primary/20 translate-x-6 translate-y-6 print:border-slate-200" />

          {/* Watermark Logo */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none print:opacity-[0.03]">
            <GraduationCap size={500} className="print:text-slate-900" />
          </div>

          <div className="relative z-10 flex-1 flex flex-col justify-center space-y-10">

            {/* 1. Header: Title */}
            <div className="flex flex-col items-center text-center space-y-1">
              <h1 className="text-primary font-black uppercase tracking-[0.4em] text-xs md:text-sm print:text-primary print:opacity-100">
                ACHIEVEMENT RECORD
              </h1>
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white print:text-slate-900 uppercase">
                Certificate of Completion
              </h2>
            </div>


            {/* 2. Subtitle & Name */}
            <div className="text-center space-y-6 py-2">
              <p className="text-slate-400 italic font-serif text-lg md:text-xl print:text-slate-500">
                LearnTiers certifies that
              </p>
              <h3 className="text-4xl md:text-7xl font-black text-white print:text-primary border-b-4 border-primary/30 pb-4 inline-block px-12">
                {typedCertificate.users.name || 'Learner'}
              </h3>
            </div>

            {/* 3. Main Text (Body) */}
            <div className="text-center max-w-4xl mx-auto px-4">
              <p className="text-slate-300 text-base md:text-xl leading-relaxed print:text-slate-800 print:font-medium">
                has successfully completed the course <span className="text-white font-bold italic print:text-slate-900">&ldquo;{typedCertificate.courses.title}&rdquo;</span> on <span className="text-white font-bold print:text-slate-900">{issuedDate}</span>, 
                with a total workload of <span className="text-white font-bold print:text-slate-900">{totalHours}</span> hours, 
                covering all <span className="text-white font-bold print:text-slate-900">{moduleCount}</span> modules of the training program.
              </p>
            </div>
          </div>

          {/* 4. Footer: Signature & Validation */}
          <div className="relative z-10 mt-8 space-y-8">
            <div className="flex w-full items-end justify-between border-t border-slate-800/50 pt-8 print:border-slate-100">

              {/* Left side: Logo */}
              <div className="flex items-center gap-4 text-left">
                <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20 print:shadow-none print:bg-primary">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="block text-xl font-black tracking-tighter text-white print:text-slate-900 leading-none">LearnTiers</span>
                  <span className="block text-[8px] uppercase tracking-[0.2em] text-primary font-bold print:text-primary mt-1">Educational Excellence</span>
                </div>
              </div>

              {/* Right side: Signature */}
              <div className="text-right space-y-1 pb-1">
                <div className="font-serif italic text-2xl text-white print:text-slate-900 px-4 border-b border-slate-700 print:border-slate-200 inline-block">
                  Wilton Paulo da Silva
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 print:text-slate-400">
                  Founder
                </p>
              </div>

            </div>

            {/* Bottom Center: Validation */}
            <div className="flex flex-col items-center gap-2">
              <div className="px-5 py-1.5 bg-slate-800/50 rounded-full border border-slate-700/50 flex items-center gap-3 print:bg-slate-50 print:border-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-green-400 print:text-green-600" />
                <span className="text-[9px] md:text-[10px] font-mono font-bold text-slate-400 print:text-slate-500">
                  Credential ID: <span className="text-slate-200 print:text-slate-800">{code}</span> • Verify at: <span className="text-primary font-bold">learntiers.com/verify/{code}</span>
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* ── Action Buttons ─────────────────────────────────────────────── */}
        <div className="print:hidden">
          <CertificateActions 
            courseName={typedCertificate.courses.title || 'Course'} 
            verificationCode={code}
            issuedAt={typedCertificate.issued_at}
          />
        </div>

        {/* Support Link */}
        <p className="text-center text-slate-500 text-xs mt-12 print:hidden">
          This is an authentic digital certificate issued by LearnTiers. 
          For any verification inquiries, contact support@learntiers.com
        </p>
      </div>
    </div>
  )
  }