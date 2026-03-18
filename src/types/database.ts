// ─── Database Types ───────────────────────────────────────────────────────────
// Auto-generated from Supabase schema — keep in sync with migrations.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ─── Row types (read from DB) ─────────────────────────────────────────────────

export interface UserRow {
  id: string
  email: string
  name: string
  total_score: number
  country: string | null
  phone: string | null
  created_at: string
}

export interface CourseRow {
  id: string
  title: string
  description: string | null
  cover_image_url: string | null
  transcript: Json | null
  youtube_channel_name: string | null
  youtube_channel_url: string | null
  created_at: string
}

export interface CourseSectionRow {
  id: string
  course_id: string
  title: string
  yt_video_id: string
  start_time_seconds: number
  end_time_seconds: number
  text_summary: string | null
  transcript: Json | null
  key_takeaways: Json | null
  order_index: number
  created_at: string
}

export interface QuizRow {
  id: string
  section_id: string
  question_text: string
  options_json: string[] // e.g. ["Option A", "Option B", "Option C", "Option D"]
  correct_answer_index: number
  created_at: string
}

export interface UserProgressRow {
  user_id: string
  section_id: string
  is_completed: boolean
  quiz_score: number | null
  updated_at: string
}

export interface UserNoteRow {
  id: string
  user_id: string
  section_id: string
  timestamp_seconds: number
  content: string
  created_at: string
}

export interface CertificateRow {
  id: string
  user_id: string
  course_id: string
  verification_code: string
  issued_at: string
}

// ─── Insert types ─────────────────────────────────────────────────────────────

export type UserInsert = Omit<UserRow, 'created_at'>
export type CourseInsert = Omit<CourseRow, 'id' | 'created_at'>
export type CourseSectionInsert = Omit<CourseSectionRow, 'id' | 'created_at'>
export type QuizInsert = Omit<QuizRow, 'id' | 'created_at'>
export type UserProgressInsert = Omit<UserProgressRow, 'updated_at'>
export type UserNoteInsert = Omit<UserNoteRow, 'id' | 'created_at'>
export type CertificateInsert = Omit<CertificateRow, 'id' | 'verification_code' | 'issued_at'>

// ─── Supabase Database shape (for createClient generics) ─────────────────────

export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserRow
        Insert: UserInsert
        Update: Partial<UserInsert>
      }
      courses: {
        Row: CourseRow
        Insert: CourseInsert
        Update: Partial<CourseInsert>
      }
      course_sections: {
        Row: CourseSectionRow
        Insert: CourseSectionInsert
        Update: Partial<CourseSectionInsert>
      }
      quizzes: {
        Row: QuizRow
        Insert: QuizInsert
        Update: Partial<QuizInsert>
      }
      user_progress: {
        Row: UserProgressRow
        Insert: UserProgressInsert
        Update: Partial<UserProgressInsert>
      }
      user_notes: {
        Row: UserNoteRow
        Insert: UserNoteInsert
        Update: Partial<UserNoteInsert>
      }
      certificates: {
        Row: CertificateRow
        Insert: CertificateInsert
        Update: Partial<CertificateInsert>
      }
    }
    Views: Record<string, never>
    Functions: {
      increment_user_score: {
        Args: { p_user_id: string; p_delta: number }
        Returns: void
      }
    }
    Enums: Record<string, never>
  }
}
