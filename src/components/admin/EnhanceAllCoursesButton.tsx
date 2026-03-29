"use client"

import * as React from "react"
import { Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { generateCourseMetadataAction } from "@/lib/actions/ai"

interface EnhanceAllCoursesButtonProps {
  courseIds: string[]
}

export function EnhanceAllCoursesButton({ courseIds }: EnhanceAllCoursesButtonProps) {
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [currentIdx, setCurrentIdx] = React.useState(0)

  const handleEnhanceAll = async () => {
    if (!confirm(`This will generate AI metadata for ${courseIds.length} courses. Continue?`)) return
    
    setIsProcessing(true)
    for (let i = 0; i < courseIds.length; i++) {
      setCurrentIdx(i + 1)
      try {
        await generateCourseMetadataAction(courseIds[i])
      } catch (err) {
        console.error(`Failed to enhance course ${courseIds[i]}:`, err)
      }
    }
    setIsProcessing(false)
    setCurrentIdx(0)
    window.location.reload()
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleEnhanceAll} 
      disabled={isProcessing || courseIds.length === 0}
      className="gap-2 text-amber-600 border-amber-200 hover:bg-amber-50"
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Processing {currentIdx}/{courseIds.length}...
        </>
      ) : (
        <>
          <Sparkles className="w-3.5 h-3.5" />
          Enhance {courseIds.length} Courses
        </>
      )}
    </Button>
  )
}
