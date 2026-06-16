import { ClientDetailView } from "@/components/clients/ClientDetailView";

interface ClientDetailPageProps {
  params: Promise<{ clientId: string }>;
}

export default async function ClientDetailPage({
  params,
}: ClientDetailPageProps) {
  const { clientId } = await params;
  return <ClientDetailView clientId={clientId} />;
}
