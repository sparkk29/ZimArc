import type { SupabaseClient } from "@supabase/supabase-js";

export type UserProfile = {
  id: string;
  reminder_enabled: boolean;
  reminder_time: string; // HH:MM:SS from Postgres time
  reminder_days: number[];
};

export type ReminderSettings = {
  enabled: boolean;
  time: string; // HH:MM for form input
  days: number[];
};

const DEFAULT_DAYS = [1, 2, 3, 4, 5];

export function normalizeTimeForInput(time: string) {
  return time.slice(0, 5);
}

export function toReminderSettings(profile: UserProfile): ReminderSettings {
  return {
    enabled: profile.reminder_enabled,
    time: normalizeTimeForInput(profile.reminder_time),
    days: profile.reminder_days.length > 0 ? profile.reminder_days : DEFAULT_DAYS,
  };
}

export async function getUserProfile(
  supabase: SupabaseClient,
): Promise<UserProfile | null> {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!userData.user) return null;

  const userId = userData.user.id;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("id,reminder_enabled,reminder_time,reminder_days")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (data) return data as UserProfile;

  const { data: created, error: createErr } = await supabase
    .from("user_profiles")
    .insert({ id: userId })
    .select("id,reminder_enabled,reminder_time,reminder_days")
    .single();

  if (createErr) throw createErr;
  return created as UserProfile;
}

export async function updateReminderSettings(
  supabase: SupabaseClient,
  settings: ReminderSettings,
) {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!userData.user) throw new Error("Not signed in.");

  const { error } = await supabase
    .from("user_profiles")
    .upsert({
      id: userData.user.id,
      reminder_enabled: settings.enabled,
      reminder_time: `${settings.time}:00`,
      reminder_days: settings.days,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userData.user.id);

  if (error) throw error;
}
