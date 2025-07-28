import Image from "next/image";

interface UserProfileProps {
  username: string;
  coverImage: string;
  avatarImage: string;
  bio: string;
  stats: {
    followers: number;
    following: number;
  };
}

export function UserProfile({ username, coverImage, avatarImage, bio, stats }: UserProfileProps) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Cover Image */}
      <div className="relative h-64 w-full">
        <Image
          src={coverImage}
          alt="Cover artwork"
          fill
          className="object-cover rounded-3xl"
        />
      </div>

      {/* Profile Picture */}
      <div className="flex justify-center -mt-16 relative z-10">
        <div className="size-32 rounded-full border-4 border-white overflow-hidden bg-white">
          <Image
            src={avatarImage}
            alt={`${username} profile`}
            width={128}
            height={128}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Profile Info */}
      <div className="text-center mt-3 px-4">
        <h1 className="text-2xl font-bold text-gray-900">{username}</h1>

        <p className="mt-2 text-gray-600 max-w-md mx-auto">
          {bio}
        </p>

        <div className="flex justify-center items-center space-x-2 mt-3 text-sm text-gray-500">
          <span>
            <span className="font-semibold text-gray-900">{stats.followers.toLocaleString()}</span> Following
          </span>
          <span>•</span>
          <span>
            <span className="font-semibold text-gray-900">{stats.following.toLocaleString()}</span> Followers
          </span>
        </div>
      </div>
    </div>
  );
}
