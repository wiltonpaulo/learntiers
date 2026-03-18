import { TranscriptSegment } from "@/components/course/SectionView";

/**
 * Resolves a transcript that could be a public URL (string) 
 * or a pre-parsed JSON array.
 */
export async function resolveTranscript(transcriptData: any): Promise<TranscriptSegment[] | null> {
  if (!transcriptData) return null;

  // If it's already an array, just return it
  if (Array.isArray(transcriptData)) {
    return transcriptData as TranscriptSegment[];
  }

  // If it's a string (URL), fetch it
  if (typeof transcriptData === 'string' && transcriptData.startsWith('http')) {
    try {
      const response = await fetch(transcriptData, { next: { revalidate: 3600 } });
      if (!response.ok) throw new Error("Failed to fetch transcript from URL");
      const json = await response.json();
      return json as TranscriptSegment[];
    } catch (error) {
      console.error("Transcript resolution error:", error);
      return null;
    }
  }

  return null;
}
