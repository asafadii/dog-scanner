import { DogDetailView } from "@/components/dogs/DogDetailView";

interface DogDetailPageProps {
  params: Promise<{ dogId: string }>;
}

export default async function DogDetailPage({ params }: DogDetailPageProps) {
  const { dogId } = await params;
  return <DogDetailView dogId={dogId} />;
}
