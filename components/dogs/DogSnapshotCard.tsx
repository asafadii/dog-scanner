import { getDogPhotoSrc } from "@/lib/dogAssets";
import Image from "next/image";
import Link from "next/link";

interface DogSnapshotCardProps {
  dogName: string;
  dogBreed: string;
  dogPhotoUrl: string | null;
  viewProfileUrl: string;
}

export function DogSnapshotCard({
  dogName,
  dogBreed,
  dogPhotoUrl,
  viewProfileUrl,
}: DogSnapshotCardProps) {
  const photoSrc = getDogPhotoSrc(dogPhotoUrl);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
      <Image
        src={photoSrc}
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 rounded-full object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{dogName}</p>
        <p className="text-sm text-muted-foreground">{dogBreed}</p>
      </div>
      <Link
        href={viewProfileUrl}
        className="shrink-0 text-sm font-medium text-primary hover:underline"
      >
        View full profile →
      </Link>
    </div>
  );
}
