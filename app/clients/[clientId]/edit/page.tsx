"use client";

import {
  ClientForm,
  type ClientFormSubmitPhase,
} from "@/components/clients/ClientForm";
import { Button } from "@/components/ui/Button";
import {
  clientToFormData,
  getClientById,
  INCOMPLETE_SETUP_MESSAGE,
  updateClient,
} from "@/lib/clients";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams<{ clientId: string }>();
  const clientId = params.clientId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitPhase, setSubmitPhase] = useState<ClientFormSubmitPhase>("idle");
  const [initialData, setInitialData] = useState<ReturnType<
    typeof clientToFormData
  > | null>(null);

  const loadClient = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getClientById(clientId);
    if (result.error) {
      setError(result.error.message);
      setInitialData(null);
    } else {
      setInitialData(clientToFormData(result.data));
    }

    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    void loadClient();
  }, [loadClient]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2
          className="h-8 w-8 animate-spin text-teal-600"
          aria-hidden
        />
        <p className="text-sm text-stone-500">Loading client...</p>
      </div>
    );
  }

  if (error && !initialData) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-12 text-center">
        <p className="text-sm font-medium text-red-800" role="alert">
          {error}
        </p>
        {error !== INCOMPLETE_SETUP_MESSAGE && (
          <Button variant="outline" onClick={() => void loadClient()}>
            Try again
          </Button>
        )}
        <Button variant="outline" onClick={() => router.push("/clients")}>
          Back to Clients
        </Button>
      </div>
    );
  }

  if (!initialData) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">
          Edit Client
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Update contact details and notes for this client.
        </p>
      </div>

      {error && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}

      <ClientForm
        initialData={initialData}
        submitPhase={submitPhase}
        submitLabel="Save Changes"
        onSubmit={async (data) => {
          if (submitPhase !== "idle") return;

          setError(null);
          setSubmitPhase("saving");

          const result = await updateClient(clientId, data);
          if (result.error) {
            setError(result.error.message);
            setSubmitPhase("idle");
            return;
          }

          router.push(`/clients/${clientId}`);
          router.refresh();
        }}
      />
    </div>
  );
}
