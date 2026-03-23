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
      // Use cache: 'no-store' to bypass any stale Vercel/Next.js cache
      const response = await fetch(transcriptData, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Failed to fetch transcript: ${response.status} ${response.statusText}`);
      }
      const json = await response.json();
      return json as TranscriptSegment[];
    } catch (error) {
      console.error("Transcript resolution error:", error);
      return null;
    }
  }

  return null;
}
