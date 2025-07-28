import { useEffect, useState } from "react";

// Funkcja do generowania deterministycznego hash z stringa
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Funkcja do automatycznego wykrywania aspect ratio z URL obrazu (tylko client-side)
async function detectImageAspectRatio(src: string): Promise<number> {
  if (typeof window === 'undefined') {
    return 1; // fallback dla SSR
  }

  return new Promise((resolve) => {
    const img = document.createElement('img');
    img.onload = () => {
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      resolve(aspectRatio);
    };
    img.onerror = () => {
      resolve(1); // fallback do kwadratowego
    };
    img.src = src;
  });
}

// Agresywny Grid Manager - wypelnia WSZYSTKIE luki
class GridLayoutManager {
  private grid: boolean[][] = [];
  private cols = 3;
  private maxRows = 20; // Zwiekszylem maksymalne rzedy

  constructor() {
    // Inicjalizuj pusty grid
    for (let row = 0; row < this.maxRows; row++) {
      this.grid[row] = new Array(this.cols).fill(false);
    }
  }

  // Znajdz najlepsze miejsce dla elementu o danym rozmiarze
  findBestSpot(colSpan: number, rowSpan: number): {row: number, col: number} | null {
    // Upewnij się że nie przekraczamy granic grid
    if (colSpan > this.cols) colSpan = this.cols;
    if (rowSpan > this.maxRows) rowSpan = this.maxRows;

    for (let row = 0; row <= this.maxRows - rowSpan; row++) {
      for (let col = 0; col <= this.cols - colSpan; col++) {
        if (this.canPlaceAt(row, col, colSpan, rowSpan)) {
          return {row, col};
        }
      }
    }
    return null;
  }

  // Sprawdz czy można umieścić element w danej pozycji
  private canPlaceAt(row: number, col: number, colSpan: number, rowSpan: number): boolean {
    for (let r = row; r < row + rowSpan; r++) {
      for (let c = col; c < col + colSpan; c++) {
        if (r >= this.maxRows || c >= this.cols || this.grid[r][c]) {
          return false;
        }
      }
    }
    return true;
  }

  // Publiczna wersja canPlaceAt dla gap filling
  canPlaceAtPosition(row: number, col: number, colSpan: number, rowSpan: number): boolean {
    return this.canPlaceAt(row, col, colSpan, rowSpan);
  }

  // Zaznacz miejsce jako zajęte
  markOccupied(row: number, col: number, colSpan: number, rowSpan: number) {
    for (let r = row; r < row + rowSpan; r++) {
      for (let c = col; c < col + colSpan; c++) {
        if (r < this.maxRows && c < this.cols) {
          this.grid[r][c] = true;
        }
      }
    }
  }

  // Znajdz wszystkie puste miejsca w grid
  findEmptySpots(): Array<{row: number, col: number}> {
    const emptySpots: Array<{row: number, col: number}> = [];
    for (let row = 0; row < this.maxRows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (!this.grid[row][col]) {
          emptySpots.push({row, col});
        }
      }
    }
    return emptySpots;
  }

  // Sprawdz ile wolnych miejsc jest w grid
  getAvailableSpots(): number {
    let count = 0;
    for (let row = 0; row < this.maxRows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (!this.grid[row][col]) count++;
      }
    }
    return count;
  }

  // Sprawdz czy grid ma jakiekolwiek luki
  hasAnyGaps(): boolean {
    return this.getAvailableSpots() > 0;
  }

  // Sprawdz jaki jest aktualny maksymalny uzywany rzad
  getActualUsedRows(): number {
    for (let row = this.maxRows - 1; row >= 0; row--) {
      for (let col = 0; col < this.cols; col++) {
        if (this.grid[row][col]) {
          return row + 1;
        }
      }
    }
    return 0;
  }

  // Znajdz najlepsze dostepne miejsce dla danego rozmiaru (preferencja dla wyzsych pozycji)
  findBestAvailableSpot(colSpan: number, rowSpan: number): {row: number, col: number} | null {
    const usedRows = this.getActualUsedRows();
    const searchLimit = Math.max(usedRows + 3, 10); // Szukaj troche nizej niz aktualnie uzywane

    for (let row = 0; row <= Math.min(searchLimit, this.maxRows) - rowSpan; row++) {
      for (let col = 0; col <= this.cols - colSpan; col++) {
        if (this.canPlaceAt(row, col, colSpan, rowSpan)) {
          return {row, col};
        }
      }
    }
    return null;
  }

  // Reset grid
  reset() {
    for (let row = 0; row < this.maxRows; row++) {
      this.grid[row] = new Array(this.cols).fill(false);
    }
  }

  // Debug - pokaz stan grid
  debugGrid() {
    console.log('Grid state (first 12 rows):');
    for (let row = 0; row < Math.min(12, this.maxRows); row++) {
      console.log(`Row ${row}: ${this.grid[row].map(cell => cell ? '■' : '□').join(' ')}`);
    }
    console.log(`Total gaps: ${this.getAvailableSpots()}`);
  }
}

// System z zbalansowanymi rozmiarami + super agresywne gap filling
function getOptimalGridSize(
  aspectRatio: number,
  hash: number,
  gridManager: GridLayoutManager,
  isFirstElement: boolean = false,
  itemIndex: number = 0,
  isGapFiller: boolean = false
): string {
  const randomValue = hash % 100;
  const availableSpots = gridManager.getAvailableSpots();

  // Dla gap fillers - systematycznie sprawdz wszystkie mozliwe rozmiary
  if (isGapFiller) {
    const gapSizes = [
      {colSpan: 1, rowSpan: 1, className: "md:col-span-1 md:row-span-1"},
      {colSpan: 2, rowSpan: 1, className: "md:col-span-2 md:row-span-1"},
      {colSpan: 1, rowSpan: 2, className: "md:col-span-1 md:row-span-2"},
      {colSpan: 3, rowSpan: 1, className: "md:col-span-3 md:row-span-1"},
      {colSpan: 2, rowSpan: 2, className: "md:col-span-2 md:row-span-2"},
    ];

    for (const size of gapSizes) {
      const spot = gridManager.findBestAvailableSpot(size.colSpan, size.rowSpan);
      if (spot) {
        gridManager.markOccupied(spot.row, spot.col, size.colSpan, size.rowSpan);
        return size.className;
      }
    }

    // Jesli nic nie pasuje, force 1x1
    const fallbackSpot = gridManager.findBestSpot(1, 1);
    if (fallbackSpot) {
      gridManager.markOccupied(fallbackSpot.row, fallbackSpot.col, 1, 1);
    }
    return "md:col-span-1 md:row-span-1";
  }

  // Preferowane rozmiary dla oryginalnych artworks
  let preferredSizes: Array<{colSpan: number, rowSpan: number, className: string, priority: number}> = [];

  if (aspectRatio > 2.0) {
    // Ultra szerokie obrazy
    preferredSizes = [
      {colSpan: 3, rowSpan: 1, className: "md:col-span-3 md:row-span-1", priority: 90},
      {colSpan: 2, rowSpan: 1, className: "md:col-span-2 md:row-span-1", priority: 85},
      {colSpan: 1, rowSpan: 1, className: "md:col-span-1 md:row-span-1", priority: 60},
    ];
  } else if (aspectRatio > 1.4) {
    // Szerokie obrazy
    preferredSizes = [
      {colSpan: 2, rowSpan: 1, className: "md:col-span-2 md:row-span-1", priority: 85},
      {colSpan: 2, rowSpan: 2, className: "md:col-span-2 md:row-span-2", priority: 75},
      {colSpan: 3, rowSpan: 1, className: "md:col-span-3 md:row-span-1", priority: 70},
      {colSpan: 1, rowSpan: 1, className: "md:col-span-1 md:row-span-1", priority: 60},
    ];
  } else if (aspectRatio < 0.6) {
    // Ultra wysokie obrazy
    preferredSizes = [
      {colSpan: 1, rowSpan: 3, className: "md:col-span-1 md:row-span-3", priority: 85},
      {colSpan: 1, rowSpan: 2, className: "md:col-span-1 md:row-span-2", priority: 80},
      {colSpan: 1, rowSpan: 1, className: "md:col-span-1 md:row-span-1", priority: 60},
    ];
  } else if (aspectRatio < 0.9) {
    // Wysokie obrazy
    preferredSizes = [
      {colSpan: 1, rowSpan: 2, className: "md:col-span-1 md:row-span-2", priority: 85},
      {colSpan: 2, rowSpan: 2, className: "md:col-span-2 md:row-span-2", priority: 70},
      {colSpan: 1, rowSpan: 1, className: "md:col-span-1 md:row-span-1", priority: 60},
    ];
  } else {
    // Kwadratowe obrazy
    preferredSizes = [
      {colSpan: 2, rowSpan: 2, className: "md:col-span-2 md:row-span-2", priority: 80},
      {colSpan: 2, rowSpan: 1, className: "md:col-span-2 md:row-span-1", priority: 75},
      {colSpan: 1, rowSpan: 2, className: "md:col-span-1 md:row-span-2", priority: 75},
      {colSpan: 1, rowSpan: 1, className: "md:col-span-1 md:row-span-1", priority: 70},
    ];
  }

  // Modyfikatory priorytetu

  // Pierwszy element ma preferencje dla większych rozmiarów
  if (isFirstElement) {
    preferredSizes.forEach(size => {
      if (size.colSpan >= 2 && size.rowSpan >= 2) {
        size.priority += 25;
      }
    });
  }

  // Co kilka elementow preferuj wieksze rozmiary dla variety
  if (itemIndex % 5 === 0 && itemIndex > 0) {
    preferredSizes.forEach(size => {
      if (size.colSpan >= 2 || size.rowSpan >= 2) {
        size.priority += 15;
      }
    });
  }

  // Sortuj według priorytetu z niewielka randomness
  preferredSizes.sort((a, b) => {
    const randomFactor = (hash % 16) - 8; // Mniejsza randomness
    return (b.priority + randomFactor) - (a.priority + randomFactor);
  });

  // Znajdz pierwszy rozmiar ktory pasuje
  for (const size of preferredSizes) {
    const spot = gridManager.findBestAvailableSpot(size.colSpan, size.rowSpan);
    if (spot) {
      gridManager.markOccupied(spot.row, spot.col, size.colSpan, size.rowSpan);
      return size.className;
    }
  }

  // Fallback - 1x1
  const fallbackSpot = gridManager.findBestSpot(1, 1);
  if (fallbackSpot) {
    gridManager.markOccupied(fallbackSpot.row, fallbackSpot.col, 1, 1);
  }
  return "md:col-span-1 md:row-span-1";
}

export interface Artwork {
  id: number;
  src: string;
  title: string;
  description: string;
  aspectRatio?: number;
  className?: string;
  isGapFiller?: boolean;
}

export function useImageAspectRatio(artworks: Artwork[], userId: string) {
  const [artworksWithLayout, setArtworksWithLayout] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Tylko client-side
    if (typeof window === 'undefined') return;

    const generateLayoutWithAspectRatio = async () => {
      const gridManager = new GridLayoutManager();
      const processedArtworks: Artwork[] = [];

      // Faza 1: Umieść wszystkie oryginalne artworks
      for (let i = 0; i < artworks.length; i++) {
        const artwork = artworks[i];

        // Wykryj aspect ratio automatycznie
        const aspectRatio = await detectImageAspectRatio(artwork.src);

        // Wygeneruj hash dla deterministic layout
        const hash = simpleHash(userId + artwork.id.toString());

        // Znajdz optymalny rozmiar grid
        const className = getOptimalGridSize(
          aspectRatio,
          hash,
          gridManager,
          i === 0, // pierwszy element
          i, // index for special rules
          false // nie jest gap filler
        );

        processedArtworks.push({
          ...artwork,
          aspectRatio,
          className,
          isGapFiller: false
        });
      }

      console.log(`Po Fazie 1 - Gaps: ${gridManager.getAvailableSpots()}`);
      gridManager.debugGrid();

      // Faza 2: SUPER AGRESYWNE gap filling - wypelnia WSZYSTKIE luki
      let gapFillerCount = 0;
      const maxGapFillers = 30; // Bardzo wysoki limit

      while (gridManager.hasAnyGaps() && gapFillerCount < maxGapFillers) {
        // Wybierz losowy artwork do powielenia (preferuj wczesniejsze)
        const randomIndex = (simpleHash(userId + gapFillerCount.toString()) % Math.min(processedArtworks.length, 8));
        const sourceArtwork = processedArtworks[randomIndex];

        if (sourceArtwork) {
          // Znajdz dowolne dostepne miejsce - systematycznie sprawdz wszystkie rozmiary
          const gapFillerHash = simpleHash(userId + "gap" + gapFillerCount.toString());
          const gapClassName = getOptimalGridSize(
            sourceArtwork.aspectRatio || 1,
            gapFillerHash,
            gridManager,
            false,
            gapFillerCount,
            true // jest gap filler
          );

          // Sprawdz czy rzeczywiscie udalo sie umiescic
          if (gapClassName !== "md:col-span-1 md:row-span-1" || gridManager.findBestSpot(1, 1)) {
            processedArtworks.push({
              ...sourceArtwork,
              id: sourceArtwork.id + 2000 + gapFillerCount,
              className: gapClassName,
              isGapFiller: true,
              title: `${sourceArtwork.title} (Fill)`,
              description: sourceArtwork.description
            });
          } else {
            // Nie mozna juz nic umiescic
            break;
          }
        }

        gapFillerCount++;

        // Bezpieczenstwo - jesli nie ma postępu, przerwij
        if (gapFillerCount % 5 === 0) {
          console.log(`Gap filling progress: ${gapFillerCount} fillers, ${gridManager.getAvailableSpots()} gaps remaining`);
          if (gridManager.getAvailableSpots() === 0) break;
        }
      }

      console.log(`Po Fazie 2 - Final gaps: ${gridManager.getAvailableSpots()}`);
      gridManager.debugGrid();

      setArtworksWithLayout(processedArtworks);
      setIsLoading(false);
    };

    generateLayoutWithAspectRatio();
  }, [artworks, userId]);

  return { artworksWithLayout, isLoading };
}
