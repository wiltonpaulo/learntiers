"use client"

import * as React from "react"
import { Sparkles, Loader2, Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { generateCourseMetadataAction } from "@/lib/actions/ai"

interface CourseMetadataFormProps {
  courseId: string
  initialLevel: string | null
  initialSkills: string[] | null
  initialSuggestedTrack: string | null
}

export function CourseMetadataForm({
  courseId,
  initialLevel,
  initialSkills,
  initialSuggestedTrack
}: CourseMetadataFormProps) {
  const [level, setLevel] = React.useState(initialLevel || "Beginner")
  const [skills, setSkills] = React.useState<string[]>(initialSkills || [])
  const [suggestedTrack, setSuggestedTrack] = React.useState(initialSuggestedTrack || "")
  const [newSkill, setNewSkill] = React.useState("")
  const [isGenerating, setIsGenerating] = React.useState(false)

  const handleAddSkill = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill("")
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove))
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const result = await generateCourseMetadataAction(courseId)
      if (result.success && result.metadata) {
        setLevel(result.metadata.level)
        setSkills(result.metadata.skills)
        setSuggestedTrack(result.metadata.suggested_track)
      }
    } catch (err) {
      console.error("Failed to generate metadata:", err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Educational Metadata</h3>
        <Button 
          type="button"
          variant="outline" 
          size="sm" 
          onClick={handleGenerate} 
          disabled={isGenerating}
          className="gap-2 text-primary border-primary/20 hover:bg-primary/5"
        >
          {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Generate with AI
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Level */}
        <div className="space-y-1.5">
          <Label htmlFor="level">Suggested Level</Label>
          <select 
            id="level"
            name="level" 
            value={level} 
            onChange={(e) => setLevel(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        {/* Suggested Track */}
        <div className="space-y-1.5">
          <Label htmlFor="suggested_track">Suggested Track</Label>
          <Input 
            id="suggested_track" 
            name="suggested_track" 
            value={suggestedTrack} 
            onChange={(e) => setSuggestedTrack(e.target.value)}
            placeholder="e.g. DevOps Foundations"
          />
        </div>
      </div>

      {/* Skills */}
      <div className="space-y-2">
        <Label>Main Skills</Label>
        <div className="flex flex-wrap gap-2 mb-3 min-h-[2rem]">
          {skills.map(skill => (
            <Badge key={skill} variant="secondary" className="gap-1 px-3 py-1">
              {skill}
              <button 
                type="button" 
                onClick={() => handleRemoveSkill(skill)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          {skills.length === 0 && (
            <span className="text-xs text-muted-foreground italic">No skills added yet.</span>
          )}
        </div>
        
        <div className="flex gap-2">
          <Input 
            placeholder="Add a skill (e.g. Docker)" 
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddSkill()
              }
            }}
          />
          <Button type="button" variant="outline" onClick={() => handleAddSkill()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {/* Hidden inputs for form submission */}
        <input type="hidden" name="skills_json" value={JSON.stringify(skills)} />
      </div>
    </div>
  )
}
