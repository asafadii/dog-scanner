"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { ClientFormData } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";

export type ClientFormSubmitPhase = "idle" | "saving";

interface ClientFormProps {
  onSubmit: (data: ClientFormData) => void | Promise<void>;
  submitLabel?: string;
  initialData?: ClientFormData;
  submitPhase?: ClientFormSubmitPhase;
}

export function ClientForm({
  onSubmit,
  submitLabel = "Create Client",
  initialData,
  submitPhase = "idle",
}: ClientFormProps) {
  const [form, setForm] = useState<ClientFormData>(
    initialData ?? {
      name: "",
      email: "",
      phone: "",
      address: "",
      emergencyContact: "",
      notes: "",
    },
  );

  const isSubmitting = submitPhase !== "idle";

  function updateField<K extends keyof ClientFormData>(
    key: K,
    value: ClientFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    void onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Name"
            required
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="e.g. Jane Smith"
            disabled={isSubmitting}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="(555) 123-4567"
              disabled={isSubmitting}
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="client@email.com"
              disabled={isSubmitting}
            />
          </div>
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => updateField("address", e.target.value)}
            placeholder="Street, city, state"
            disabled={isSubmitting}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Emergency & Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Emergency Contact"
            value={form.emergencyContact}
            onChange={(e) => updateField("emergencyContact", e.target.value)}
            placeholder="Name and relationship"
            disabled={isSubmitting}
          />
          <Textarea
            label="Notes"
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="Pickup instructions, preferences, billing notes..."
            rows={4}
            disabled={isSubmitting}
          />
        </CardContent>
      </Card>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting && (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        )}
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
