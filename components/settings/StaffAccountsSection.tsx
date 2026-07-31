"use client";

import {
  useFacilityAccess,
  WRITE_LOCKED_TITLE,
} from "@/components/app/FacilityAccessContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { getCurrentUserProfile } from "@/lib/dogs";
import {
  formatStaffRoleLabel,
  promoteToAdmin,
  sendStaffInvite,
} from "@/lib/staff/manage";
import {
  formatStaffLimit,
  getFacilityStaff,
  getPendingStaffInvites,
  type PendingStaffInvite,
  getSubscriptionInfo,
} from "@/lib/subscription";
import type { UserRole } from "@/lib/supabase/types";
import type { StaffMember, SubscriptionInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Loader2, User, UserPlus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function StaffAccountsSection() {
  const { accessLevel } = useFacilityAccess();
  const writeLocked = accessLevel !== "full";
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingStaffInvite[]>(
    [],
  );
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [staffCount, setStaffCount] = useState(0);
  const [showLimitUi, setShowLimitUi] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("staff");
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const loadStaffSection = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [staffResult, pendingResult, subscriptionResult, profileResult] =
      await Promise.all([
        getFacilityStaff(),
        getPendingStaffInvites(),
        getSubscriptionInfo(),
        getCurrentUserProfile(),
      ]);

    if (profileResult.data) {
      setCurrentRole(profileResult.data.role);
    }

    if (staffResult.error) {
      setError(staffResult.error.message);
      setStaff([]);
      setPendingInvites([]);
      setLoading(false);
      return;
    }

    if (pendingResult.error) {
      setError(pendingResult.error.message);
      setStaff([]);
      setPendingInvites([]);
      setLoading(false);
      return;
    }

    setStaff(staffResult.data);
    setPendingInvites(pendingResult.data);

    const combinedCount =
      staffResult.data.length + pendingResult.data.length;

    if (subscriptionResult.error) {
      setShowLimitUi(false);
      setSubscription(null);
      setStaffCount(combinedCount);
    } else {
      setSubscription(subscriptionResult.data);
      setShowLimitUi(true);
      setStaffCount(combinedCount);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadStaffSection();
  }, [loadStaffSection]);

  useEffect(() => {
    if (!inviteSuccess) return;
    const timer = setTimeout(() => setInviteSuccess(null), 4000);
    return () => clearTimeout(timer);
  }, [inviteSuccess]);

  const staffLimitLabel = subscription
    ? formatStaffLimit(subscription.staffLimit)
    : null;

  const atStaffLimit = Boolean(
    subscription && staffCount >= subscription.staffLimit,
  );

  const usagePercent =
    subscription && subscription.staffLimit <= 100
      ? Math.min(100, (staffCount / subscription.staffLimit) * 100)
      : 0;

  const isAdmin = currentRole === "admin";

  function openInviteModal() {
    setInviteOpen(true);
    setInviteEmail("");
    setInviteRole("staff");
    setInviteError(null);
    setInviteSuccess(null);
  }

  function closeInviteModal() {
    setInviteOpen(false);
    setInviteEmail("");
    setInviteRole("staff");
    setInviteError(null);
    setInviteSending(false);
  }

  async function handleSendInvite() {
    const trimmed = inviteEmail.trim().toLowerCase();
    if (!trimmed) return;

    setInviteSending(true);
    setInviteError(null);
    setInviteSuccess(null);

    const result = await sendStaffInvite(trimmed, inviteRole);
    if (result.error) {
      setInviteError(result.error.message);
    } else {
      setInviteSuccess(`Invite sent to ${trimmed}`);
      setInviteEmail("");
      setInviteRole("staff");
      await loadStaffSection();
    }

    setInviteSending(false);
  }

  async function handleMakeAdmin(member: StaffMember) {
    const confirmed = window.confirm(
      `Make ${member.fullName} an admin? They will be able to manage billing.`,
    );
    if (!confirmed) return;

    setPromotingId(member.id);
    setActionError(null);

    const result = await promoteToAdmin(member.id);
    if (result.error) {
      setActionError(result.error.message);
    } else {
      await loadStaffSection();
    }

    setPromotingId(null);
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-5 w-5 text-muted-foreground" aria-hidden />
          Staff Accounts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {loading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading staff accounts...
          </div>
        ) : error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : (
          <>
            {showLimitUi && subscription && staffLimitLabel && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {staffCount} of {staffLimitLabel} staff accounts used
                </p>
                {subscription.plan === "dora" && subscription.staffLimit <= 100 && (
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${usagePercent}%` }}
                      role="progressbar"
                      aria-valuenow={staffCount}
                      aria-valuemin={0}
                      aria-valuemax={subscription.staffLimit}
                      aria-label={`${staffCount} of ${subscription.staffLimit} staff accounts used`}
                    />
                  </div>
                )}
              </div>
            )}

            {actionError && (
              <p className="text-sm text-danger" role="alert">
                {actionError}
              </p>
            )}

            <ul className="divide-y divide-border rounded-xl border border-border">
              {staff.length === 0 && pendingInvites.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No staff accounts yet.
                </li>
              ) : (
                <>
                  {staff.map((member) => (
                    <li
                      key={member.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {member.fullName}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {isAdmin && member.role === "staff" && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={promotingId === member.id}
                            onClick={() => void handleMakeAdmin(member)}
                          >
                            {promotingId === member.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : null}
                            Make Admin
                          </Button>
                        )}
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            member.role === "admin"
                              ? "bg-mint-wash text-primary"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {formatStaffRoleLabel(member.role)}
                        </span>
                      </div>
                    </li>
                  ))}
                  {pendingInvites.map((invite) => (
                    <li
                      key={`invite-${invite.id}`}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {invite.email}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          Invited{" "}
                          {new Date(invite.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            invite.role === "admin"
                              ? "bg-mint-wash text-primary"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {formatStaffRoleLabel(invite.role)}
                        </span>
                        <span className="shrink-0 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
                          Pending
                        </span>
                      </div>
                    </li>
                  ))}
                </>
              )}
            </ul>

            {isAdmin && (
              <>
                <Button
                  className="w-full sm:w-auto"
                  onClick={openInviteModal}
                  disabled={atStaffLimit || writeLocked}
                  title={
                    writeLocked
                      ? WRITE_LOCKED_TITLE
                      : atStaffLimit
                        ? "Staff limit reached — upgrade to invite more."
                        : undefined
                  }
                >
                  <UserPlus className="h-4 w-4" aria-hidden />
                  Invite Staff
                </Button>

                {inviteOpen && (
                  <div className="rounded-xl border border-border bg-muted/40 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        Invite Staff
                      </p>
                      <button
                        type="button"
                        onClick={closeInviteModal}
                        className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label="Close invite panel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <Input
                        label="Email"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@facility.com"
                        disabled={inviteSending}
                      />
                      <Select
                        label="Role"
                        value={inviteRole}
                        onChange={(e) =>
                          setInviteRole(
                            e.target.value === "admin" ? "admin" : "staff",
                          )
                        }
                        disabled={inviteSending}
                      >
                        <option value="staff">Member</option>
                        <option value="admin">Admin</option>
                      </Select>
                      {inviteError && (
                        <p className="text-sm text-danger" role="alert">
                          {inviteError}
                        </p>
                      )}
                      {inviteSuccess && (
                        <p className="text-sm text-primary" role="status">
                          {inviteSuccess}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={closeInviteModal}
                          disabled={inviteSending}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => void handleSendInvite()}
                          disabled={
                            inviteSending ||
                            !inviteEmail.trim() ||
                            atStaffLimit ||
                            writeLocked
                          }
                          title={writeLocked ? WRITE_LOCKED_TITLE : undefined}
                        >
                          {inviteSending && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          )}
                          {inviteSending ? "Sending..." : "Send"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
