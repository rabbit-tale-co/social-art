'use client';

import { UserProfile } from "@/components/user-profile";
import { ArtworkGrid } from "@/components/artwork-grid";
import { userProfile, artworks, userId } from "@/lib/user/data";

export default function Home() {

  return (
    <div className="min-h-screen">
      <UserProfile {...userProfile} />
      <ArtworkGrid
        artworks={artworks}
        userId={userId}
        showDebugInfo={true} // Wlaczam debug zeby zobaczyc aspect ratios
      />
    </div>
  );
}
