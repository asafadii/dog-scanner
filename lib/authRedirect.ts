import { hasClientAccount } from "@/lib/portal/auth";
import { getCurrentUserProfile } from "@/lib/dogs";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type AuthDestination = "/dashboard" | "/portal";

export async function isPortalUser(): Promise<boolean> {
  if (await hasClientAccount()) {
    return true;
  }

  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.user_metadata?.account_type === "client";
}

export async function resolvePostLoginDestination(): Promise<AuthDestination> {
  const profileResult = await getCurrentUserProfile();
  if (profileResult.data) {
    return "/dashboard";
  }

  if (await isPortalUser()) {
    return "/portal";
  }

  return "/dashboard";
}

export async function shouldRunStaffAuthSetup(): Promise<boolean> {
  const profileResult = await getCurrentUserProfile();
  if (profileResult.data) {
    return false;
  }

  return !(await isPortalUser());
}
