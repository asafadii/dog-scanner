"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getCurrentUserProfile } from "@/lib/dogs";
import {
  formatStaffLimit,
  getFacilityStaff,
  getStaffCount,
  getSubscriptionInfo,
} from "@/lib/subscription";
import type { StaffMember, SubscriptionInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Loader2, User, UserPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function StaffAccountsSection() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [staffCount, setStaffCount] = useState(0);
  const [showLimitUi, setShowLimitUi] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStaffSection = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [staffResult, subscriptionResult] = await Promise.all([
      getFacilityStaff(),
      getSubscriptionInfo(),
    ]);

    if (staffResult.error) {
      setError(staffResult.error.message);
      setStaff([]);
      setLoading(false);
      return;
    }

    setStaff(staffResult.data);

    if (subscriptionResult.error) {
      setShowLimitUi(false);
      setSubscription(null);
      setStaffCount(staffResult.data.length);
    } else {
      setSubscription(subscriptionResult.data);
      setShowLimitUi(true);

      const profileResult = await getCurrentUserProfile();
      if (profileResult.data) {
        const countResult = await getStaffCount(profileResult.data.facility_id);
        setStaffCount(
          countResult.error ? staffResult.data.length : countResult.data ?? 0,
        );
      } else {
        setStaffCount(staffResult.data.length);
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadStaffSection();
  }, [loadStaffSection]);

  const staffLimitLabel = subscription
    ? formatStaffLimit(subscription.staffLimit)
    : null;

  const usagePercent =
    subscription && subscription.staffLimit <= 100
      ? Math.min(100, (staffCount / subscription.staffLimit) * 100)
      : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-5 w-5 text-stone-400" aria-hidden />
          Staff Accounts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {loading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-stone-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading staff accounts...
          </div>
        ) : error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : (
          <>
            {showLimitUi && subscription && staffLimitLabel && (
              <div className="space-y-2">
                <p className="text-sm text-stone-600">
                  {staffCount} of {staffLimitLabel} staff accounts used
                </p>
                {subscription.plan === "dora" && subscription.staffLimit <= 100 && (
                  <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-[oklch(0.531_0.092_185.0)] transition-all"
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

            <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200">
              {staff.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-stone-500">
                  No staff accounts yet.
                </li>
              ) : (
                staff.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-stone-900">
                        {member.fullName}
                      </p>
                      <p className="truncate text-sm text-stone-500">
                        {member.email}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                        member.role === "admin"
                          ? "bg-[#F0FAF9] text-[oklch(0.531_0.092_185.0)]"
                          : "bg-stone-100 text-stone-600",
                      )}
                    >
                      {member.role}
                    </span>
                  </li>
                ))
              )}
            </ul>

            <Button disabled className="w-full sm:w-auto">
              <UserPlus className="h-4 w-4" aria-hidden />
              Invite Staff — Coming soon
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
