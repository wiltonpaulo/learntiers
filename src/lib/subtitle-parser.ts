export interface TranscriptSegment {
  start: number
  end: number
  text: string
}

/**
 * Parses SRT or VTT content into our internal TranscriptSegment format.
 */
export function parseSubtitleFile(content: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = []
  
  // Remove BOM and normalize line endings
  const cleanContent = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  
  // Basic regex to identify blocks (index, time, text)
  // Works for both SRT and VTT (VTT usually has 'WEBVTT' at the top which we can ignore)
  const blocks = cleanContent.split(/\n\s*\n/)
  
  for (const block of blocks) {
    const lines = block.trim().split('\n')
    if (lines.length < 2) continue
    
    // Skip WEBVTT header or block indices
    let timeLine = lines[0]
    let textStartIndex = 1
    
    if (!timeLine.includes('-->')) {
      timeLine = lines[1] || ''
      textStartIndex = 2
    }
    
    if (!timeLine.includes('-->')) continue
    
    const [startStr, endStr] = timeLine.split('-->').map(s => s.trim())
    const start = parseTimestamp(startStr)
    const end = parseTimestamp(endStr)
    const text = lines.slice(textStartIndex).join(' ').replace(/<[^>]*>/g, '').trim()
    
    if (text) {
      segments.push({ start, end, text })
    }
  }
  
  return segments
}

function parseTimestamp(timestamp: string): number {
  // Handles 00:00:00,000 or 00:00.000
  const parts = timestamp.split(':')
  let seconds = 0
  
  if (parts.length === 3) {
    // HH:MM:SS,ms
    seconds += parseInt(parts[0], 10) * 3600
    seconds += parseInt(parts[1], 10) * 60
    seconds += parseFloat(parts[2].replace(',', '.'))
  } else if (parts.length === 2) {
    // MM:SS,ms
    seconds += parseInt(parts[0], 10) * 60
    seconds += parseFloat(parts[1].replace(',', '.'))
  }
  
  return seconds
}
