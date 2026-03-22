import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background pb-12">
      {/* ── Hero Skeleton ── */}
      <div className="bg-slate-900 py-12 px-4">
        <div className="container mx-auto max-w-5xl flex flex-col lg:flex-row gap-8">
          <div className="flex-1 lg:w-2/3 space-y-5">
            <Skeleton className="h-6 w-32 bg-slate-800" />
            <Skeleton className="h-10 w-3/4 bg-slate-800" />
            <Skeleton className="h-20 w-full bg-slate-800" />
            <div className="flex gap-4 pt-2">
              <Skeleton className="h-4 w-24 bg-slate-800" />
              <Skeleton className="h-4 w-24 bg-slate-800" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Content Skeleton ── */}
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1 lg:w-2/3">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </div>
          <div className="lg:w-1/3">
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
