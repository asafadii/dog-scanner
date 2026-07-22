"use client";

import {
  buildFacilityOptions,
  type FacilityOption,
} from "@/components/portal/PortalFacilityPicker";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { getLinkedClients } from "@/lib/portal/auth";
import {
  getPortalProfile,
  updatePortalProfile,
} from "@/lib/portal/profile";
import { KeyRound, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

interface ContactFormState {
  name: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
}

const emptyForm: ContactFormState = {
  name: "",
  phone: "",
  email: "",
  address: "",
  emergencyContact: "",
  emergencyPhone: "",
};

export default function PortalSettingsPage() {
  const [facilityOptions, setFacilityOptions] = useState<FacilityOption[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState("");
  const [form, setForm] = useState<ContactFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedFacility = useMemo(
    () =>
      facilityOptions.find((option) => option.facilityId === selectedFacilityId) ??
      null,
    [facilityOptions, selectedFacilityId],
  );

  const loadLinks = useCallback(async () => {
    const result = await getLinkedClients();
    if (result.error) {
      setFacilityOptions([]);
      setSelectedFacilityId("");
      setError(result.error.message);
      setLoading(false);
      return;
    }

    const options = buildFacilityOptions(result.data);
    setFacilityOptions(options);
    setSelectedFacilityId((current) => current || options[0]?.facilityId || "");
    if (options.length === 0) {
      setLoading(false);
    }
  }, []);

  const loadProfile = useCallback(async (facilityId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await getPortalProfile(facilityId);
    if (result.error) {
      setForm(emptyForm);
      setError(result.error.message);
      setLoading(false);
      return;
    }

    setForm({
      name: result.data.name,
      phone: result.data.phone,
      email: result.data.email,
      address: result.data.address,
      emergencyContact: result.data.emergencyContact,
      emergencyPhone: result.data.emergencyPhone,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadLinks();
  }, [loadLinks]);

  useEffect(() => {
    if (!selectedFacilityId) return;
    void loadProfile(selectedFacilityId);
  }, [loadProfile, selectedFacilityId]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!selectedFacilityId || saving) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    const result = await updatePortalProfile(selectedFacilityId, form);
    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }

    setForm({
      name: result.data.name,
      phone: result.data.phone,
      email: result.data.email,
      address: result.data.address,
      emergencyContact: result.data.emergencyContact,
      emergencyPhone: result.data.emergencyPhone,
    });
    setSuccess("Contact details saved.");
    setSaving(false);
  }

  function updateField<K extends keyof ContactFormState>(
    key: K,
    value: ContactFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your portal account.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Contact Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {facilityOptions.length === 0 && !loading ? (
            <p className="text-sm text-muted-foreground">
              Link a facility to edit your contact details.
            </p>
          ) : (
            <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
              {facilityOptions.length > 1 && (
                <div>
                  <label
                    htmlFor="portal-settings-facility"
                    className="mb-2 block text-sm font-medium text-foreground"
                  >
                    Facility
                  </label>
                  <select
                    id="portal-settings-facility"
                    value={selectedFacilityId}
                    onChange={(e) => setSelectedFacilityId(e.target.value)}
                    disabled={saving || loading}
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {facilityOptions.map((option) => (
                      <option key={option.facilityId} value={option.facilityId}>
                        {option.facilityName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {facilityOptions.length === 1 && selectedFacility && (
                <p className="text-sm text-muted-foreground">
                  Updating contact details for{" "}
                  <span className="font-medium text-foreground">
                    {selectedFacility.facilityName}
                  </span>
                  .
                </p>
              )}

              {loading ? (
                <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Loading contact details...
                </div>
              ) : (
                <>
                  <Input
                    label="Name"
                    required
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="e.g. Jane Smith"
                    disabled={saving}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder="(555) 123-4567"
                      disabled={saving}
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder="client@email.com"
                      disabled={saving}
                    />
                  </div>
                  <Input
                    label="Address"
                    value={form.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="Street, city, state"
                    disabled={saving}
                  />
                  <Input
                    label="Emergency Contact"
                    value={form.emergencyContact}
                    onChange={(e) =>
                      updateField("emergencyContact", e.target.value)
                    }
                    placeholder="Name and relationship"
                    disabled={saving}
                  />
                  <Input
                    label="Emergency Contact Phone"
                    type="tel"
                    value={form.emergencyPhone}
                    onChange={(e) =>
                      updateField("emergencyPhone", e.target.value)
                    }
                    placeholder="(555) 987-6543"
                    disabled={saving}
                  />
                </>
              )}

              {error && (
                <p
                  className="rounded-xl border border-danger/25 bg-[#FEF2F2] px-4 py-3 text-sm text-danger"
                  role="alert"
                >
                  {error}
                </p>
              )}

              {success && (
                <p
                  className="rounded-xl border border-success/25 bg-[#ECFDF5] px-4 py-3 text-sm text-success"
                  role="status"
                >
                  {success}
                </p>
              )}

              <Button
                type="submit"
                disabled={saving || loading || !selectedFacilityId}
              >
                {saving && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                )}
                {saving ? "Saving..." : "Save contact details"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Link
            href="/forgot-password"
            className="flex min-h-[44px] items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <KeyRound className="h-4 w-4 text-primary" aria-hidden />
            Change password
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
