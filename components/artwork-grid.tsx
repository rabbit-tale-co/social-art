import Image from "next/image";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { OutlineImage } from "@/icons/Icons";
import { useImageAspectRatio, type Artwork } from "@/hooks/use-image-aspect-ratio";

interface ArtworkGridProps {
  artworks: Artwork[];
  userId: string;
  showDebugInfo?: boolean;
}

export function ArtworkGrid({ artworks, userId, showDebugInfo = false }: ArtworkGridProps) {
  const { artworksWithLayout, isLoading } = useImageAspectRatio(artworks, userId);

  if (isLoading) {
    return (
      <div className="mt-10 pb-10">
        <div className="max-w-6xl mx-auto flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <div className="text-lg text-gray-600">Generating personalized layout...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10 pb-10">
      <BentoGrid className="max-w-4xl mx-auto">
        {artworksWithLayout.map((artwork) => (
          <BentoGridItem
            key={artwork.id}
            className={artwork.className}
            header={
              <div className="relative w-full h-full min-h-[200px] rounded-lg overflow-hidden">
                <Image
                  src={artwork.src}
                  alt={artwork.title}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                />
                {/* Enhanced debug info */}
                {showDebugInfo && artwork.aspectRatio && (
                  <div className="absolute top-2 left-2 space-y-1">
                    <div className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                      Ratio: {artwork.aspectRatio.toFixed(2)}
                    </div>
                    <div className="bg-blue-600/70 text-white text-xs px-2 py-1 rounded">
                      {artwork.className?.replace('md:', '') || 'default'}
                    </div>
                  </div>
                )}
              </div>
            }
            icon={<OutlineImage />}
            title={artwork.title}
            description={artwork.description}
          />
        ))}
      </BentoGrid>
    </div>
  );
}
