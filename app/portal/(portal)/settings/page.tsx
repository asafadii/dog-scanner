"use client";

import {
  buildFacilityOptions,
  type FacilityOption,
} from "@/components/portal/PortalFacilityPicker";
import { useAuth } from "@/components/auth/AuthProvider";
import { ArchiveConfirmCard } from "@/components/ui/ArchiveConfirmCard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { deletePortalAccount } from "@/lib/portal/account";
import { getLinkedClients, requireClientAccount } from "@/lib/portal/auth";
import {
  getAllPortalDocuments,
  getPortalDocumentUrl,
} from "@/lib/portal/documents";
import { unlinkFacility } from "@/lib/portal/facilities";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/lib/portal/notifications";
import {
  getPortalProfile,
  updatePortalProfile,
} from "@/lib/portal/profile";
import type { DogDocument } from "@/lib/types";
import { KeyRound, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

interface ContactFormState {
  name: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
}

type PortalDocumentWithDog = DogDocument & { dogName: string };

const emptyForm: ContactFormState = {
  name: "",
  phone: "",
  email: "",
  address: "",
  emergencyContact: "",
  emergencyPhone: "",
};

function formatDocumentType(type: DogDocument["documentType"]): string {
  switch (type) {
    case "vaccination":
      return "Vaccination";
    case "pedigree":
      return "Pedigree";
    default:
      return "Other";
  }
}

function formatUploadDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PortalSettingsPage() {
  const router = useRouter();
  const { signOut } = useAuth();

  const [facilityOptions, setFacilityOptions] = useState<FacilityOption[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState("");
  const [form, setForm] = useState<ContactFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [emailRemindersEnabled, setEmailRemindersEnabled] = useState(true);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsError, setPrefsError] = useState<string | null>(null);

  const [documents, setDocuments] = useState<PortalDocumentWithDog[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [openingDocumentId, setOpeningDocumentId] = useState<string | null>(
    null,
  );

  const [unlinkingFacilityId, setUnlinkingFacilityId] = useState<string | null>(
    null,
  );
  const [unlinkError, setUnlinkError] = useState<string | null>(null);

  const [accountLabel, setAccountLabel] = useState("");

  const selectedFacility = useMemo(
    () =>
      facilityOptions.find((option) => option.facilityId === selectedFacilityId) ??
      null,
    [facilityOptions, selectedFacilityId],
  );

  const loadAccountLabel = useCallback(async () => {
    const result = await requireClientAccount();
    if (result.data) {
      const label =
        result.data.full_name?.trim() || result.data.email?.trim() || "account";
      setAccountLabel(label);
    }
  }, []);

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
    setSelectedFacilityId((current) => {
      if (current && options.some((option) => option.facilityId === current)) {
        return current;
      }
      return options[0]?.facilityId || "";
    });
    if (options.length === 0) {
      setLoading(false);
      setDocuments([]);
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

  const loadDocuments = useCallback(async (facilityId: string) => {
    setDocumentsLoading(true);
    setDocumentsError(null);

    const result = await getAllPortalDocuments(facilityId);
    if (result.error) {
      setDocuments([]);
      setDocumentsError(result.error.message);
      setDocumentsLoading(false);
      return;
    }

    setDocuments(result.data);
    setDocumentsLoading(false);
  }, []);

  const loadPreferences = useCallback(async () => {
    setPrefsLoading(true);
    setPrefsError(null);

    const result = await getNotificationPreferences();
    if (result.error) {
      setPrefsError(result.error.message);
      setPrefsLoading(false);
      return;
    }

    setEmailRemindersEnabled(result.data.emailRemindersEnabled);
    setPrefsLoading(false);
  }, []);

  useEffect(() => {
    void loadLinks();
    void loadPreferences();
    void loadAccountLabel();
  }, [loadLinks, loadPreferences, loadAccountLabel]);

  useEffect(() => {
    if (!selectedFacilityId) return;
    void loadProfile(selectedFacilityId);
    void loadDocuments(selectedFacilityId);
  }, [loadProfile, loadDocuments, selectedFacilityId]);

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

  async function handleToggleReminders(nextValue: boolean) {
    if (prefsSaving) return;

    const previous = emailRemindersEnabled;
    setEmailRemindersEnabled(nextValue);
    setPrefsSaving(true);
    setPrefsError(null);

    const result = await updateNotificationPreferences(nextValue);
    if (result.error) {
      setEmailRemindersEnabled(previous);
      setPrefsError(result.error.message);
      setPrefsSaving(false);
      return;
    }

    setEmailRemindersEnabled(result.data.emailRemindersEnabled);
    setPrefsSaving(false);
  }

  async function handleViewDocument(documentId: string) {
    if (openingDocumentId) return;

    setOpeningDocumentId(documentId);
    setDocumentsError(null);

    const result = await getPortalDocumentUrl(documentId);
    if (result.error) {
      setDocumentsError(result.error.message);
      setOpeningDocumentId(null);
      return;
    }

    window.open(result.data, "_blank", "noopener,noreferrer");
    setOpeningDocumentId(null);
  }

  async function handleUnlink(facility: FacilityOption) {
    const confirmed = window.confirm(
      `Unlink from ${facility.facilityName}? You can re-link anytime using their facility code.`,
    );
    if (!confirmed) return;

    setUnlinkingFacilityId(facility.facilityId);
    setUnlinkError(null);

    const result = await unlinkFacility(facility.facilityId);
    if (result.error) {
      setUnlinkError(result.error.message);
      setUnlinkingFacilityId(null);
      return;
    }

    await loadLinks();
    setUnlinkingFacilityId(null);
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
          <CardTitle className="text-base">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {prefsLoading ? (
            <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Loading preferences...
            </div>
          ) : (
            <label className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border border-border px-4 py-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                checked={emailRemindersEnabled}
                disabled={prefsSaving}
                onChange={(e) => void handleToggleReminders(e.target.checked)}
              />
              <span>
                <span className="block text-sm font-medium text-foreground">
                  Email me the day before my dog&apos;s stay
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Reminder emails go to the contact email on your booking.
                </span>
              </span>
            </label>
          )}
          {prefsError && (
            <p
              className="rounded-xl border border-danger/25 bg-[#FEF2F2] px-4 py-3 text-sm text-danger"
              role="alert"
            >
              {prefsError}
            </p>
          )}
        </CardContent>
      </Card>

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
          <CardTitle className="text-base">Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {facilityOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Link a facility to view uploaded documents.
            </p>
          ) : documentsLoading ? (
            <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No documents uploaded yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex flex-col gap-2 rounded-xl border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {doc.dogName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDocumentType(doc.documentType)} ·{" "}
                      {formatUploadDate(doc.createdAt)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    disabled={openingDocumentId === doc.id}
                    onClick={() => void handleViewDocument(doc.id)}
                  >
                    {openingDocumentId === doc.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : null}
                    {openingDocumentId === doc.id ? "Opening..." : "View"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {documentsError && (
            <p
              className="rounded-xl border border-danger/25 bg-[#FEF2F2] px-4 py-3 text-sm text-danger"
              role="alert"
            >
              {documentsError}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Linked Facilities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {facilityOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No facilities linked yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {facilityOptions.map((facility) => (
                <li
                  key={facility.facilityId}
                  className="flex flex-col gap-2 rounded-xl border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="text-sm font-medium text-foreground">
                    {facility.facilityName}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 border-danger/40 text-danger hover:bg-danger/10"
                    disabled={unlinkingFacilityId === facility.facilityId}
                    onClick={() => void handleUnlink(facility)}
                  >
                    {unlinkingFacilityId === facility.facilityId ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : null}
                    {unlinkingFacilityId === facility.facilityId
                      ? "Unlinking..."
                      : "Unlink"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {unlinkError && (
            <p
              className="rounded-xl border border-danger/25 bg-[#FEF2F2] px-4 py-3 text-sm text-danger"
              role="alert"
            >
              {unlinkError}
            </p>
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

      {accountLabel ? (
        <ArchiveConfirmCard
          entityName={accountLabel}
          onConfirm={async () => {
            const result = await deletePortalAccount();
            return { error: result.error };
          }}
          onSuccess={() => {
            void (async () => {
              await signOut();
              router.push("/login");
              router.refresh();
            })();
          }}
        />
      ) : null}
    </div>
  );
}
