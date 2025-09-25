import React from 'react';
import { useSectionContent } from '@/hooks/useSectionContent';
import { z } from 'zod';
import { 
  createResponsivePaddingSchema, 
  DEFAULT_RESPONSIVE_PADDING, 
  generateResponsivePaddingCSS,
  normalizePadding,
  SectionWrapper,
  TEXT_COLOR_OPTIONS,
  getTextColorClass
} from '@/components/admin/section_settings';

// Schema for video section
const Video1Schema = z.object({
  videoSettings: z.object({
    youtubeUrl: z.string().describe('YouTube video URL'),
    videoTitle: z.string().optional().describe('Optional title above video'),
    description: z.string().optional().describe('Optional description text'),
    textColor: z.enum(TEXT_COLOR_OPTIONS).default('default')
  }),
  
  displayOptions: z.object({
    layout: z.enum(['full-width', 'centered', 'text-beside']).default('centered'),
    aspectRatio: z.enum(['16:9', '4:3', '9:16', '1:1']).default('16:9'),
    maxWidth: z.enum(['sm', 'md', 'lg', 'xl', 'full']).default('lg'),
    textPosition: z.enum(['left', 'right']).default('right') // Only for text-beside layout
  }),
  
  playerSettings: z.object({
    autoplay: z.boolean().default(false),
    muted: z.boolean().default(false), // Required true if autoplay is true
    controls: z.boolean().default(true),
    loop: z.boolean().default(false),
    modestBranding: z.boolean().default(true),
    showRelated: z.boolean().default(false)
  }),
  
  sectionPadding: createResponsivePaddingSchema()
});

type Video1Content = z.infer<typeof Video1Schema>;

// Default content
const DEFAULT_CONTENT: Video1Content = {
  videoSettings: {
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    videoTitle: 'Featured Video',
    description: 'Check out this amazing video that showcases our product in action.',
    textColor: 'default'
  },
  displayOptions: {
    layout: 'centered',
    aspectRatio: '16:9',
    maxWidth: 'lg',
    textPosition: 'right'
  },
  playerSettings: {
    autoplay: false,
    muted: false,
    controls: true,
    loop: false,
    modestBranding: true,
    showRelated: false
  },
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

// Helper function to extract YouTube video ID from various URL formats
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

// Helper to get aspect ratio padding
function getAspectRatioPadding(ratio: string): string {
  const ratios: Record<string, string> = {
    '16:9': '56.25%',
    '4:3': '75%',
    '9:16': '177.78%',
    '1:1': '100%'
  };
  return ratios[ratio] || '56.25%';
}

// Helper to get max width class
function getMaxWidthClass(size: string): string {
  const sizes: Record<string, string> = {
    'sm': 'max-w-2xl',
    'md': 'max-w-4xl',
    'lg': 'max-w-5xl',
    'xl': 'max-w-7xl',
    'full': 'max-w-full'
  };
  return sizes[size] || 'max-w-5xl';
}

interface Video1Props {
  sectionId: string;
}

const Video1: React.FC<Video1Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'video1-section');
  
  const videoId = extractYouTubeId(content.videoSettings.youtubeUrl);
  const textColorClass = getTextColorClass(content.videoSettings.textColor);
  
  // Build YouTube embed URL with parameters
  const buildEmbedUrl = () => {
    if (!videoId) return '';
    
    const params = new URLSearchParams();
    if (content.playerSettings.autoplay) params.append('autoplay', '1');
    if (content.playerSettings.muted || content.playerSettings.autoplay) params.append('mute', '1');
    if (!content.playerSettings.controls) params.append('controls', '0');
    if (content.playerSettings.loop) {
      params.append('loop', '1');
      params.append('playlist', videoId); // Required for loop to work
    }
    if (content.playerSettings.modestBranding) params.append('modestbranding', '1');
    if (!content.playerSettings.showRelated) params.append('rel', '0');
    
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  };

  const embedUrl = buildEmbedUrl();
  const aspectRatioPadding = getAspectRatioPadding(content.displayOptions.aspectRatio);
  const maxWidthClass = getMaxWidthClass(content.displayOptions.maxWidth);

  const VideoPlayer = () => (
    <div className="relative w-full" style={{ paddingBottom: aspectRatioPadding }}>
      {videoId ? (
        <iframe
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          src={embedUrl}
          title={content.videoSettings.videoTitle || 'YouTube video'}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <div className="absolute top-0 left-0 w-full h-full bg-muted rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">Invalid YouTube URL</p>
        </div>
      )}
    </div>
  );

  const TextContent = () => (
    <>
      {content.videoSettings.videoTitle && (
        <h2 className={`text-3xl font-bold mb-4 ${textColorClass}`}>
          {content.videoSettings.videoTitle}
        </h2>
      )}
      {content.videoSettings.description && (
        <p className={`text-lg mb-6 ${textColorClass} opacity-90`}>
          {content.videoSettings.description}
        </p>
      )}
    </>
  );

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`w-full ${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        <div className="container mx-auto px-4">
          {content.displayOptions.layout === 'full-width' && (
            <div className="w-full">
              <TextContent />
              <VideoPlayer />
            </div>
          )}
          
          {content.displayOptions.layout === 'centered' && (
            <div className={`mx-auto ${maxWidthClass}`}>
              <TextContent />
              <VideoPlayer />
            </div>
          )}
          
          {content.displayOptions.layout === 'text-beside' && (
            <div className={`mx-auto ${maxWidthClass}`}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {content.displayOptions.textPosition === 'left' ? (
                  <>
                    <div>
                      <TextContent />
                    </div>
                    <div>
                      <VideoPlayer />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <VideoPlayer />
                    </div>
                    <div>
                      <TextContent />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </SectionWrapper>
  );
};

export default Video1;
export type { Video1Content };
export { DEFAULT_CONTENT as Video1DefaultContent };
export { Video1Schema };