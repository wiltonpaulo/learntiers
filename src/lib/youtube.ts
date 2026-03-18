import { YoutubeTranscript } from 'youtube-transcript';

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export async function fetchYouTubeTranscript(videoId: string): Promise<TranscriptSegment[] | null> {
  try {
    // Tenta buscar o transcript padrão (costuma pegar o idioma original ou o primeiro disponível)
    const rawTranscript = await YoutubeTranscript.fetchTranscript(videoId);
    return transformTranscript(rawTranscript);
  } catch (error) {
    console.warn(`Default transcript failed for ${videoId}, trying English...`, error);
    
    try {
      // Tenta forçar Inglês
      const enTranscript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
      return transformTranscript(enTranscript);
    } catch (enError) {
      console.warn(`English transcript failed for ${videoId}, trying Portuguese...`);
      
      try {
        // Tenta forçar Português
        const ptTranscript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'pt' });
        return transformTranscript(ptTranscript);
      } catch (ptError) {
        console.error('All transcript fetch attempts failed for video', videoId);
        return null;
      }
    }
  }
}

function transformTranscript(raw: any[]): TranscriptSegment[] {
  return raw.map((item, index, arr) => {
    const nextItem = arr[index + 1];
    // Se não houver próximo item, o "end" é o offset + duration
    // A duração vem em milisegundos da biblioteca, convertemos para segundos
    const start = item.offset / 1000;
    const duration = item.duration / 1000;
    const end = nextItem ? nextItem.offset / 1000 : start + duration;
    
    return {
      start,
      end,
      text: decodeHtmlEntities(item.text),
    };
  });
}

// Helper para limpar entidades HTML como &#39; (aspas) que vêm no YouTube
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

export async function fetchYouTubeMetadata(videoId: string) {
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (!response.ok) return null;
    
    const data = await response.json();
    return {
      title: data.title,
      authorName: data.author_name,
      authorUrl: data.author_url,
      thumbnailUrl: data.thumbnail_url,
    };
  } catch (error) {
    console.error('Error fetching YouTube metadata:', error);
    return null;
  }
}
