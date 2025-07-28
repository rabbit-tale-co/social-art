import Image from "next/image";
import { useDeterministicBento, type BentoImage } from "@/hooks/useDeterministicBento";

interface BentoGalleryProps {
  images: BentoImage[];
  showDebugInfo?: boolean;
}

export function BentoGallery({ images, showDebugInfo = false }: BentoGalleryProps) {
  const { items, isLoading } = useDeterministicBento(images);

  if (isLoading) {
    return (
      <div className="mt-10 pb-10">
        <div className="max-w-6xl mx-auto flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <div className="text-lg text-gray-600">Generating deterministic layout...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10 pb-10">
      <div className="max-w-4xl mx-auto">
        {/* Main Bento Grid */}
        <div className="grid-container">
          {items.map((item, index) => (
            <div
              key={item.id}
              style={{
                gridColumn: item.gridCol ? `${item.gridCol} / span ${item.colSpan}` : `span ${item.colSpan}`,
                gridRow: item.gridRow ? `${item.gridRow} / span ${item.rowSpan}` : `span ${item.rowSpan}`
              }}
              className={`cursor-pointer relative overflow-hidden rounded-3xl group/image ${
                // Dla elementów które rozciągają się w dół (1×2, 1×3) - pozwól CSS Grid kontrolować wysokość
                item.rowSpan > 1 ? 'h-full' :
                  // Dla elementów które rozciągają się w poziomie - ustaw odpowiednie aspect ratio
                  item.colSpan === 2 && item.rowSpan === 1 ? 'aspect-[2/1]' :
                    item.colSpan === 3 && item.rowSpan === 1 ? 'aspect-[3/1]' :
                      // Dla normalnych elementów 1×1 lub 2×2
                      'aspect-[1/1]'
                }`}
            >
              <Image
                src={item.src}
                alt={item.title}
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover group-hover/image:scale-105 transition-transform duration-300"
                priority={index < 6}
                placeholder="blur"
                blurDataURL={item.blur}
              />

              {/* Overlay with title on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/30 transition-all duration-300 flex items-end">
                <div className="p-4 text-white transform translate-y-full group-hover/image:translate-y-0 transition-transform duration-300">
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-white/80 mt-1">{item.description}</p>
                  )}
                </div>
              </div>

              {/* Debug overlay */}
              {showDebugInfo && (
                <div className="absolute top-2 left-2 space-y-1">
                  <div className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                    Ratio: {item.ratio?.toFixed(2) || 'N/A'}
                  </div>
                  <div className="bg-blue-600/70 text-white text-xs px-2 py-1 rounded">
                    {item.colSpan}×{item.rowSpan}
                  </div>
                  <div className="bg-purple-600/70 text-white text-xs px-2 py-1 rounded">
                    @({item.gridRow || '?'},{item.gridCol || '?'})
                  </div>
                  <div className="bg-green-600/70 text-white text-xs px-2 py-1 rounded">
                    #{item.index}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
