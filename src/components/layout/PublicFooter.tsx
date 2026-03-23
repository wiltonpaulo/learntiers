import Link from "next/link"
import { GraduationCap, Github, Twitter, Youtube, Linkedin, Mail } from "lucide-react"

export function PublicFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white text-slate-500 py-12 border-t border-slate-200">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">LearnTiers</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">
              High-level micro-learning platform for engineers. 
              Master AWS, Terraform, Go, and Kubernetes with curated expert content.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-slate-400 hover:text-purple-600 transition-colors"><Twitter className="w-5 h-5" /></Link>
              <Link href="#" className="text-slate-400 hover:text-purple-600 transition-colors"><Github className="w-5 h-5" /></Link>
              <Link href="#" className="text-slate-400 hover:text-purple-600 transition-colors"><Youtube className="w-5 h-5" /></Link>
              <Link href="#" className="text-slate-400 hover:text-purple-600 transition-colors"><Linkedin className="w-5 h-5" /></Link>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h4 className="text-slate-900 font-bold text-sm uppercase tracking-widest">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/courses" className="hover:text-purple-600 transition-colors">All Courses</Link></li>
              <li><Link href="/courses?q=career" className="hover:text-purple-600 transition-colors">Career Tracks</Link></li>
              <li><Link href="/leaderboard" className="hover:text-purple-600 transition-colors">Global Ranking</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-slate-900 font-bold text-sm uppercase tracking-widest">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-purple-600 transition-colors">Help Center</Link></li>
              <li><Link href="#" className="hover:text-purple-600 transition-colors">Discord Community</Link></li>
              <li><Link href="#" className="hover:text-purple-600 transition-colors">API Docs</Link></li>
              <li><Link href="mailto:support@learntiers.com" className="hover:text-purple-600 transition-colors flex items-center gap-2"><Mail className="w-4 h-4" /> support@learntiers.com</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-slate-900 font-bold text-sm uppercase tracking-widest">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-purple-600 transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-purple-600 transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-purple-600 transition-colors">Cookie Policy</Link></li>
              <li><Link href="#" className="hover:text-purple-600 transition-colors">Compliance</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium">
          <p>© {currentYear} LearnTiers. All rights reserved.</p>
          <div className="flex gap-6">
            <span>Built with ❤️ for Engineers</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
