import { useEffect, useState, useCallback } from 'react';

// Typy podstawowe
export interface BentoImage {
  id: string | number;
  src: string;
  title: string;
  description?: string;
  blur?: string; // blur data URL
}

export interface BentoItem extends BentoImage {
  colSpan: number;
  rowSpan: number;
  ratio?: number;
  index: number;
  gridRow?: number;
  gridCol?: number;
}

// Deterministyczny hash generator
function deterministicHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Funkcja do automatycznego wykrywania aspect ratio (client-side only)
async function detectAspectRatio(src: string): Promise<number> {
  if (typeof window === 'undefined') {
    return 1; // fallback dla SSR
  }

  return new Promise((resolve) => {
    const img = document.createElement('img');
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      resolve(ratio);
    };
    img.onerror = () => {
      resolve(1); // fallback do kwadratowego
    };
    img.src = src;
  });
}

// Deterministic span assignment based on aspect ratio
function getInitialSpans(ratio: number, imageId: string): { colSpan: number; rowSpan: number } {
  const hash = deterministicHash(imageId.toString());

  // Ultra-wide images
  if (ratio >= 2.5) {
    return { colSpan: 3, rowSpan: 1 };
  }

  // Wide images
  if (ratio >= 1.6) {
    return { colSpan: 2, rowSpan: 1 };
  }

  // Ultra-tall images
  if (ratio <= 0.4) {
    return { colSpan: 1, rowSpan: 3 };
  }

  // Tall images
  if (ratio <= 0.6) {
    return { colSpan: 1, rowSpan: 2 };
  }

  // Square-ish images - deterministic 2x2 for ~30% of earliest images
  const shouldBeLarge = hash % 100 < 30;
  if (shouldBeLarge) {
    return { colSpan: 2, rowSpan: 2 };
  }

  // Default square
  return { colSpan: 1, rowSpan: 1 };
}

// Grid placement algorithm - finds exact positions for each item
function calculateGridPositions(items: BentoItem[]): BentoItem[] {
  const result = [...items];
  const cols = 3;
  let maxRows = 20;

  // Create grid tracking matrix
  const grid: boolean[][] = [];
  for (let row = 0; row < maxRows; row++) {
    grid[row] = new Array(cols).fill(false);
  }

    // Helper function to find first available position for item
  function findFirstAvailablePosition(colSpan: number, rowSpan: number): {row: number, col: number} | null {
    for (let row = 0; row <= maxRows - rowSpan; row++) {
      for (let col = 0; col <= cols - colSpan; col++) {
        // Check if entire area is free
        let canPlace = true;
        for (let r = row; r < row + rowSpan && canPlace; r++) {
          for (let c = col; c < col + colSpan && canPlace; c++) {
            if (r >= maxRows || c >= cols || grid[r][c]) {
              canPlace = false;
            }
          }
        }

        if (canPlace) {
          return {row, col};
        }
      }
    }
    return null;
  }

  // Helper function to mark area as occupied
  function markOccupied(row: number, col: number, colSpan: number, rowSpan: number) {
    for (let r = row; r < row + rowSpan; r++) {
      for (let c = col; c < col + colSpan; c++) {
        if (r < maxRows && c < cols) {
          grid[r][c] = true;
        }
      }
    }
  }

    // Helper function to debug grid state
  function debugGrid(maxRowsToShow: number = 10) {
    console.log('Grid state:');
    for (let row = 0; row < Math.min(maxRowsToShow, maxRows); row++) {
      const rowStr = grid[row].map(cell => cell ? '■' : '□').join(' ');
      console.log(`Row ${row + 1}: ${rowStr}`);
    }
  }

  // Place each item in first available position
  for (const item of result) {
    const position = findFirstAvailablePosition(item.colSpan, item.rowSpan);
    if (position) {
      item.gridRow = position.row + 1; // CSS Grid is 1-indexed
      item.gridCol = position.col + 1;
      markOccupied(position.row, position.col, item.colSpan, item.rowSpan);
      console.log(`Placed item ${item.index} (${item.colSpan}×${item.rowSpan}) at row ${item.gridRow}, col ${item.gridCol}`);
    } else {
      // Fallback: expand grid if needed
      maxRows += 5;
      const newRows = [];
      for (let row = grid.length; row < maxRows; row++) {
        newRows.push(new Array(cols).fill(false));
      }
      grid.push(...newRows);

      const fallbackPosition = findFirstAvailablePosition(item.colSpan, item.rowSpan);
      if (fallbackPosition) {
        item.gridRow = fallbackPosition.row + 1;
        item.gridCol = fallbackPosition.col + 1;
        markOccupied(fallbackPosition.row, fallbackPosition.col, item.colSpan, item.rowSpan);
        console.log(`Placed item ${item.index} (${item.colSpan}×${item.rowSpan}) at row ${item.gridRow}, col ${item.gridCol} (expanded grid)`);
      }
    }
  }

  // Debug final grid state
  debugGrid(12);
  console.log('Final placement complete');

  return result;
}

// Gap-fix algorithm to ensure totalCells % 3 === 0
function fixGaps(items: BentoItem[]): BentoItem[] {
  const result = [...items];
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const totalCells = result.reduce((sum, item) => sum + item.colSpan * item.rowSpan, 0);
    const remainder = totalCells % 3;

    console.log(`Gap-fix attempt ${attempts + 1}: totalCells=${totalCells}, remainder=${remainder}`);

    if (remainder === 0) break;

    if (remainder === 1) {
      // Need to reduce by 1 cell - shrink a 2x1 or 1x2 to 1x1
      const shrinkable = result.find(item =>
        (item.colSpan === 2 && item.rowSpan === 1) ||
        (item.colSpan === 1 && item.rowSpan === 2)
      );

      if (shrinkable) {
        console.log(`Shrinking ${shrinkable.colSpan}x${shrinkable.rowSpan} to 1x1`);
        shrinkable.colSpan = 1;
        shrinkable.rowSpan = 1;
        attempts++;
        continue;
      }

      // Alternative: shrink a 2x2 to 1x2 (reduces by 2, but remainder=1 so we need -1)
      const largeItem = result.find(item => item.colSpan === 2 && item.rowSpan === 2);
      if (largeItem) {
        console.log(`Shrinking ${largeItem.colSpan}x${largeItem.rowSpan} to 1x2`);
        largeItem.colSpan = 1;
        largeItem.rowSpan = 2;
        attempts++;
        continue;
      }

      // Last resort: add cells by expanding a 1x1 to span 3 columns (adds 2 cells)
      const expandable = result.find(item => item.colSpan === 1 && item.rowSpan === 1);
      if (expandable) {
        console.log(`Expanding ${expandable.colSpan}x${expandable.rowSpan} to 3x1`);
        expandable.colSpan = 3;
        expandable.rowSpan = 1;
        attempts++;
        continue;
      }
    }

    if (remainder === 2) {
      // Need to reduce by 2 cells - shrink a 2x2 to 1x2
      const largeItem = result.find(item => item.colSpan === 2 && item.rowSpan === 2);
      if (largeItem) {
        console.log(`Shrinking ${largeItem.colSpan}x${largeItem.rowSpan} to 1x2`);
        largeItem.colSpan = 1;
        largeItem.rowSpan = 2;
        attempts++;
        continue;
      }

      // Alternative: expand a 1x1 to 2x1 (adds 1 cell, making remainder=0)
      const expandable = result.find(item => item.colSpan === 1 && item.rowSpan === 1);
      if (expandable) {
        console.log(`Expanding ${expandable.colSpan}x${expandable.rowSpan} to 2x1`);
        expandable.colSpan = 2;
        expandable.rowSpan = 1;
        attempts++;
        continue;
      }
    }

    // If we can't fix it, break to avoid infinite loop
    console.log('No more gap-fixing options available');
    break;
  }

  console.log(`Gap-fixing complete after ${attempts} attempts`);
  return result;
}

// Generuj blur placeholder automatycznie
function generateBlurDataURL(width: number = 10, height: number = 10): string {
  if (typeof window === 'undefined') {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPgo=';
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  canvas.width = width;
  canvas.height = height;

  // Losowy kolor oparty na rozmiarach
  const hue = (width + height) % 360;
  ctx.fillStyle = `hsl(${hue}, 20%, 90%)`;
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL();
}

export function useDeterministicBento(images: BentoImage[]) {
  const [items, setItems] = useState<BentoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const processImages = useCallback(async () => {
    if (typeof window === 'undefined' || images.length === 0) return;

    setIsLoading(true);

    try {
      // Faza 1: Detect aspect ratios i assign initial spans
      const processedItems: BentoItem[] = [];

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const ratio = await detectAspectRatio(image.src);
        const { colSpan, rowSpan } = getInitialSpans(ratio, image.id.toString());

        // Generuj blur placeholder jesli nie ma
        const blurDataURL = image.blur || generateBlurDataURL();

        processedItems.push({
          ...image,
          colSpan,
          rowSpan,
          ratio,
          index: i,
          blur: blurDataURL
        });
      }

                  // Faza 2: Fix gaps to ensure totalCells % 3 === 0 BEFORE positioning
      const gapFixedItems = fixGaps(processedItems);

      // Faza 3: Calculate exact grid positions AFTER gap fixing
      console.log('Starting grid positioning with gap-fixed items...');
      const finalItems = calculateGridPositions(gapFixedItems);

      setItems(finalItems);
    } catch (error) {
      console.error('Error processing images:', error);
      // Fallback: wszystkie jako 1x1
      const fallbackItems = images.map((image, index) => ({
        ...image,
        colSpan: 1,
        rowSpan: 1,
        ratio: 1,
        index,
        blur: image.blur || generateBlurDataURL()
      }));
      setItems(fallbackItems);
    } finally {
      setIsLoading(false);
    }
  }, [images]);

  useEffect(() => {
    processImages();
  }, [processImages]);

  return { items, isLoading };
}
