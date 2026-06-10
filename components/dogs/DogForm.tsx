"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { DogAlerts, DogSize, NewDogFormData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useState, type FormEvent } from "react";

const SIZES: DogSize[] = ["small", "medium", "large"];

const ALERT_FIELDS: {
  key: keyof DogAlerts;
  label: string;
  description: string;
}[] = [
  { key: "medication", label: "Medication", description: "Requires medication during stay" },
  { key: "allergy", label: "Allergy", description: "Has known allergies" },
  { key: "dietary", label: "Dietary Restriction", description: "Special feeding requirements" },
  { key: "aggression", label: "Aggression Caution", description: "May be reactive to dogs or people" },
  { key: "escapeRisk", label: "Escape Risk", description: "Known to jump fences or bolt" },
];

const defaultAlerts: DogAlerts = {
  medication: false,
  allergy: false,
  dietary: false,
  aggression: false,
  escapeRisk: false,
};

interface DogFormProps {
  onSubmit: (data: NewDogFormData) => void;
  submitLabel?: string;
}

export function DogForm({ onSubmit, submitLabel = "Create Dog Profile" }: DogFormProps) {
  const [form, setForm] = useState<NewDogFormData>({
    name: "",
    breed: "",
    age: "",
    size: "medium",
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    medication: "",
    feeding: "",
    allergies: "",
    behavior: "",
    alerts: { ...defaultAlerts },
    overnight: false,
  });

  function updateField<K extends keyof NewDogFormData>(
    key: K,
    value: NewDogFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleAlert(key: keyof DogAlerts) {
    setForm((prev) => ({
      ...prev,
      alerts: { ...prev.alerts, [key]: !prev.alerts[key] },
    }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dog Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Dog Name"
            required
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="e.g. Max"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Breed"
              required
              value={form.breed}
              onChange={(e) => updateField("breed", e.target.value)}
              placeholder="e.g. Golden Retriever"
            />
            <Input
              label="Age"
              required
              value={form.age}
              onChange={(e) => updateField("age", e.target.value)}
              placeholder="e.g. 3 years"
            />
          </div>
          <div>
            <span className="mb-2 block text-sm font-medium text-stone-700">
              Size
            </span>
            <div className="flex gap-2">
              {SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => updateField("size", size)}
                  className={cn(
                    "min-h-[44px] flex-1 rounded-xl border px-4 py-2 text-sm font-medium capitalize transition-colors",
                    form.size === size
                      ? "border-teal-500 bg-teal-50 text-teal-800"
                      : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50",
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
          <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-stone-200 px-4 py-3">
            <input
              type="checkbox"
              checked={form.overnight}
              onChange={(e) => updateField("overnight", e.target.checked)}
              className="h-5 w-5 rounded border-stone-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm font-medium text-stone-700">
              Overnight boarding stay
            </span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Owner Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Owner Name"
            required
            value={form.ownerName}
            onChange={(e) => updateField("ownerName", e.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Phone"
              type="tel"
              required
              value={form.ownerPhone}
              onChange={(e) => updateField("ownerPhone", e.target.value)}
              placeholder="(555) 123-4567"
            />
            <Input
              label="Email"
              type="email"
              value={form.ownerEmail}
              onChange={(e) => updateField("ownerEmail", e.target.value)}
              placeholder="owner@email.com"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Care Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {ALERT_FIELDS.map(({ key, label, description }) => (
            <label
              key={key}
              className={cn(
                "flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
                form.alerts[key]
                  ? "border-teal-200 bg-teal-50/50"
                  : "border-stone-200 hover:bg-stone-50",
              )}
            >
              <input
                type="checkbox"
                checked={form.alerts[key]}
                onChange={() => toggleAlert(key)}
                className="mt-0.5 h-5 w-5 rounded border-stone-300 text-teal-600 focus:ring-teal-500"
              />
              <div>
                <span className="text-sm font-medium text-stone-800">
                  {label}
                </span>
                <p className="text-xs text-stone-500">{description}</p>
              </div>
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Care Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            label="Medication"
            value={form.medication}
            onChange={(e) => updateField("medication", e.target.value)}
            placeholder="Medication schedule and dosage..."
            rows={3}
          />
          <Textarea
            label="Feeding"
            value={form.feeding}
            onChange={(e) => updateField("feeding", e.target.value)}
            placeholder="Feeding schedule and dietary notes..."
            rows={3}
          />
          <Textarea
            label="Allergies"
            value={form.allergies}
            onChange={(e) => updateField("allergies", e.target.value)}
            placeholder="Known allergies..."
            rows={2}
          />
          <Textarea
            label="Behavior Notes"
            value={form.behavior}
            onChange={(e) => updateField("behavior", e.target.value)}
            placeholder="Temperament, triggers, play preferences..."
            rows={3}
          />
        </CardContent>
      </Card>

      <Button type="submit" size="lg" className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
