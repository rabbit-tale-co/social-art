'use client';

import { UserProfile } from "@/components/user-profile";
import { BentoGallery } from "@/components/BentoGallery";
import { userProfile, artworks } from "@/lib/user/data";
import { BentoImage } from "@/hooks/useDeterministicBento";

// Konwertuj format danych ze starego na nowy
const bentoImages: BentoImage[] = artworks.map(artwork => ({
  id: artwork.id.toString(),
  src: artwork.src,
  title: artwork.title,
  description: artwork.description,
}));

export default function Home() {
  return (
    <div className="min-h-screen">
      <UserProfile {...userProfile} />
      <BentoGallery
        images={bentoImages}
      />
    </div>
  );
}
