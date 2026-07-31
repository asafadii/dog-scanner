"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";

interface ArchiveConfirmCardProps {
  entityName: string;
  onConfirm: () => Promise<{ error: { message: string } | null }>;
  onSuccess: () => void;
  bare?: boolean;
}

export function ArchiveConfirmCard({
  entityName,
  onConfirm,
  onSuccess,
  bare = false,
}: ArchiveConfirmCardProps) {
  const [open, setOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameMatches =
    confirmName.trim().toLowerCase() === entityName.trim().toLowerCase();

  async function handleConfirm() {
    if (!nameMatches) {
      setError("Name does not match. Type the name exactly to confirm.");
      return;
    }

    setLoading(true);
    setError(null);
    const result = await onConfirm();
    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }
    onSuccess();
  }

  const confirmBody = !open ? (
    <Button
      type="button"
      variant="danger"
      className="w-full"
      onClick={() => {
        setOpen(true);
        setConfirmName("");
        setError(null);
      }}
    >
      <Trash2 className="h-4 w-4" aria-hidden />
      Delete Profile
    </Button>
  ) : (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        This will remove {entityName}&apos;s profile from active use. Past
        bookings and payment records are preserved. This can&apos;t be
        undone from the app — contact support within 90 days if this was a
        mistake.
      </p>
      <Input
        label={`Type "${entityName}" to confirm`}
        value={confirmName}
        onChange={(e) => setConfirmName(e.target.value)}
        disabled={loading}
        autoComplete="off"
      />
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => {
            setOpen(false);
            setConfirmName("");
            setError(null);
          }}
        >
          Cancel
        </Button>
        <Button
          type="button"
          className="bg-danger text-white hover:bg-danger/90"
          disabled={loading || !nameMatches}
          onClick={() => void handleConfirm()}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : null}
          {loading ? "Deleting..." : "Confirm delete"}
        </Button>
      </div>
    </div>
  );

  if (bare) {
    return <div className="space-y-3">{confirmBody}</div>;
  }

  return (
    <Card className="border-danger/20">
      <CardContent className="space-y-3 pt-4">{confirmBody}</CardContent>
    </Card>
  );
}
