'use client'

import { Button, buttonVariants } from '@/components/ui/button'
import { Download, Linkedin, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CertificateActionsProps {
  courseName: string
  verificationCode: string
  issuedAt: string
  certUrl: string
}

export function CertificateActions({ courseName, verificationCode, issuedAt, certUrl }: CertificateActionsProps) {
  const date = new Date(issuedAt)
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // 1-indexed for LinkedIn

  // LinkedIn Add Certification URL
  const linkedinUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(
    courseName
  )}&organizationName=LearnTiers&issueYear=${year}&issueMonth=${month}&certUrl=${encodeURIComponent(
    certUrl
  )}&certId=${verificationCode}`

  const handleDownload = () => {
    window.print()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificate of Completion - ${courseName}`,
          text: `Check out my official LearnTiers certificate for completing ${courseName}!`,
          url: certUrl,
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      navigator.clipboard.writeText(certUrl)
      alert('Link copied to clipboard!')
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 mt-12 print:hidden">
      <Button 
        onClick={handleDownload}
        variant="outline" 
        className="bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold h-12 px-6"
      >
        <Download className="w-4 h-4 mr-2" />
        Download PDF
      </Button>

      <a 
        href={linkedinUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className={cn(
          buttonVariants({ variant: "default" }),
          "bg-[#0077b5] hover:bg-[#0077b5]/90 text-white font-bold h-12 px-6 rounded-lg"
        )}
      >
        <Linkedin className="w-4 h-4 mr-2" />
        Add to LinkedIn
      </a>

      <Button 
        onClick={handleShare}
        variant="ghost" 
        className="text-white/60 hover:text-white hover:bg-white/5 font-bold h-12 px-6"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share
      </Button>
    </div>
  )
}
