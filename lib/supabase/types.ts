import type { User } from "@supabase/supabase-js";

export type UserRole = "admin" | "staff";
export type DbDogSize = "small" | "medium" | "large";
export type DbDogSex = "male" | "female";
export type DbFoodSource = "own" | "facility";

export interface DogRow {
  id: string;
  facility_id: string;
  client_id: string | null;
  name: string;
  breed: string;
  age: string;
  size: DbDogSize;
  sex: DbDogSex | null;
  photo_url: string | null;
  owner_name: string;
  owner_phone: string;
  emergency_contact: string | null;
  vet_contact: string | null;
  behavior_notes: string | null;
  medication_required: boolean;
  medication_notes: string | null;
  diet_notes: string | null;
  allergies: string | null;
  aggression_risk: boolean;
  escape_risk: boolean;
  microchip_number: string | null;
  is_neutered: boolean | null;
  aggression_towards_people: boolean | null;
  aggression_towards_dogs: boolean | null;
  separation_anxiety: string | null;
  kennel_trained: string | null;
  chewing_risk: string | null;
  health_certificate_number: string | null;
  feeding_source: "own" | "facility" | null;
  feeding_meals_per_day: number | null;
  feeding_notes: string | null;
  vaccination_expiry_date: string | null;
  vaccination_owner_week_before_email_sent_at: string | null;
  vaccination_owner_expired_email_sent_at: string | null;
  vaccination_facility_week_before_email_sent_at: string | null;
  vaccination_facility_expired_email_sent_at: string | null;
  is_active: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export type DogInsert = {
  id?: string;
  facility_id: string;
  client_id?: string | null;
  name: string;
  breed: string;
  age: string;
  size: DbDogSize;
  sex?: DbDogSex | null;
  photo_url?: string | null;
  owner_name: string;
  owner_phone: string;
  emergency_contact?: string | null;
  vet_contact?: string | null;
  behavior_notes?: string | null;
  medication_required?: boolean;
  medication_notes?: string | null;
  diet_notes?: string | null;
  allergies?: string | null;
  aggression_risk?: boolean;
  escape_risk?: boolean;
  microchip_number?: string | null;
  is_neutered?: boolean | null;
  aggression_towards_people?: boolean | null;
  aggression_towards_dogs?: boolean | null;
  separation_anxiety?: string | null;
  kennel_trained?: string | null;
  chewing_risk?: string | null;
  health_certificate_number?: string | null;
  feeding_source?: "own" | "facility" | null;
  feeding_meals_per_day?: number | null;
  feeding_notes?: string | null;
  vaccination_expiry_date?: string | null;
  vaccination_owner_week_before_email_sent_at?: string | null;
  vaccination_owner_expired_email_sent_at?: string | null;
  vaccination_facility_week_before_email_sent_at?: string | null;
  vaccination_facility_expired_email_sent_at?: string | null;
  is_active?: boolean;
  archived_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type DogUpdate = {
  id?: string;
  facility_id?: string;
  client_id?: string | null;
  name?: string;
  breed?: string;
  age?: string;
  size?: DbDogSize;
  sex?: DbDogSex | null;
  photo_url?: string | null;
  owner_name?: string;
  owner_phone?: string;
  emergency_contact?: string | null;
  vet_contact?: string | null;
  behavior_notes?: string | null;
  medication_required?: boolean;
  medication_notes?: string | null;
  diet_notes?: string | null;
  allergies?: string | null;
  aggression_risk?: boolean;
  escape_risk?: boolean;
  microchip_number?: string | null;
  is_neutered?: boolean | null;
  aggression_towards_people?: boolean | null;
  aggression_towards_dogs?: boolean | null;
  separation_anxiety?: string | null;
  kennel_trained?: string | null;
  chewing_risk?: string | null;
  health_certificate_number?: string | null;
  feeding_source?: "own" | "facility" | null;
  feeding_meals_per_day?: number | null;
  feeding_notes?: string | null;
  vaccination_expiry_date?: string | null;
  vaccination_owner_week_before_email_sent_at?: string | null;
  vaccination_owner_expired_email_sent_at?: string | null;
  vaccination_facility_week_before_email_sent_at?: string | null;
  vaccination_facility_expired_email_sent_at?: string | null;
  is_active?: boolean;
  archived_at?: string | null;
  created_at?: string;
  updated_at?: string;
};
export interface ClientRow {
  id: string;
  facility_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  notes: string | null;
  invite_code: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ClientInsert = {
  id?: string;
  facility_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  emergency_contact?: string | null;
  emergency_phone?: string | null;
  notes?: string | null;
  invite_code?: string | null;
  archived_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ClientUpdate = {
  id?: string;
  facility_id?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  emergency_contact?: string | null;
  emergency_phone?: string | null;
  notes?: string | null;
  invite_code?: string | null;
  archived_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export interface ClientAccountRow {
  id: string;
  email: string;
  full_name: string;
  email_reminders_enabled: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ClientAccountInsert = {
  id: string;
  email: string;
  full_name: string;
  email_reminders_enabled?: boolean;
  archived_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ClientAccountUpdate = {
  id?: string;
  email?: string;
  full_name?: string;
  email_reminders_enabled?: boolean;
  archived_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export interface ClientAccountLinkRow {
  id: string;
  client_account_id: string;
  client_id: string;
  facility_id: string;
  created_at: string;
}

export type ClientAccountLinkInsert = {
  id?: string;
  client_account_id: string;
  client_id: string;
  facility_id: string;
  created_at?: string;
};

export interface ClaimAttemptRow {
  id: string;
  ip_address: string;
  user_id: string | null;
  succeeded: boolean;
  attempted_at: string;
}

export type ClaimAttemptInsert = {
  id?: string;
  ip_address: string;
  user_id?: string | null;
  succeeded: boolean;
  attempted_at?: string;
};

export interface EmbedBookingAttemptRow {
  id: string;
  ip_address: string;
  facility_id: string | null;
  succeeded: boolean;
  attempted_at: string;
}

export type EmbedBookingAttemptInsert = {
  id?: string;
  ip_address: string;
  facility_id?: string | null;
  succeeded: boolean;
  attempted_at?: string;
};

export type DbDogDocumentType = "vaccination" | "pedigree" | "other";

export interface DogDocumentRow {
  id: string;
  dog_id: string;
  facility_id: string;
  document_type: DbDogDocumentType;
  file_path: string;
  uploaded_by_client_account_id: string | null;
  created_at: string;
}

export type DogDocumentInsert = {
  id?: string;
  dog_id: string;
  facility_id: string;
  document_type: DbDogDocumentType;
  file_path: string;
  uploaded_by_client_account_id?: string | null;
  created_at?: string;
};

export interface CheckinTokenRow {
  id: string;
  token: string;
  booking_id: string;
  dog_id: string;
  facility_id: string;
  created_by_client_account_id: string | null;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
  created_at: string;
}

export type CheckinTokenInsert = {
  id?: string;
  token: string;
  booking_id: string;
  dog_id: string;
  facility_id: string;
  created_by_client_account_id?: string | null;
  expires_at: string;
  used_at?: string | null;
  used_by?: string | null;
  created_at?: string;
};

export interface FacilityRow {
  id: string;
  name: string | null;
  currency: string;
  facility_code: string | null;
  booking_form_config: Record<string, "hidden" | "optional" | "required"> | null;
  subscription_plan: "dora" | "dora_unlimited";
  subscription_status: "trialing" | "active" | "past_due" | "canceled";
  trial_ends_at: string | null;
  staff_limit: number;
  subscription_started_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  past_due_since: string | null;
  trial_7day_email_sent_at: string | null;
  grace_started_email_sent_at: string | null;
  access_blocked_email_sent_at: string | null;
  created_at: string;
}

export interface ProfileRow {
  id: string;
  facility_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface StaffInviteRow {
  id: string;
  facility_id: string;
  email: string;
  token: string;
  invited_by: string;
  role: UserRole;
  accepted_at: string | null;
  created_at: string;
}

export type StaffInviteInsert = {
  id?: string;
  facility_id: string;
  email: string;
  token: string;
  invited_by: string;
  role?: UserRole;
  accepted_at?: string | null;
  created_at?: string;
};

export type StaffInviteUpdate = Partial<StaffInviteInsert>;

export interface DogCheckinRow {
  id: string;
  dog_id: string;
  facility_id: string;
  booking_id: string | null;
  current_service_type: DbBookingServiceType | null;
  checked_in_at: string;
  checked_out_at: string | null;
  notes: string | null;
  created_by: string;
}

export type DogCheckinInsert = {
  id?: string;
  dog_id: string;
  facility_id: string;
  booking_id?: string | null;
  current_service_type?: DbBookingServiceType | null;
  checked_in_at?: string;
  checked_out_at?: string | null;
  notes?: string | null;
  created_by: string;
};

export type DogCheckinUpdate = {
  id?: string;
  dog_id?: string;
  facility_id?: string;
  booking_id?: string | null;
  current_service_type?: DbBookingServiceType | null;
  checked_in_at?: string;
  checked_out_at?: string | null;
  notes?: string | null;
  created_by?: string;
};

export type DbBookingServiceType = "daycare" | "boarding";
export type DbBookingStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled";

export type DbBookingCancelledBy = "staff" | "client";
export type DbRecurrenceFrequency = "weekly" | "biweekly";
export type DbBookingSeriesStatus = "active" | "cancelled";
export type DbClientPassStatus =
  | "active"
  | "exhausted"
  | "expired"
  | "cancelled";

export interface BookingRow {
  id: string;
  facility_id: string;
  client_id: string;
  dog_id: string;
  service_type: DbBookingServiceType;
  start_date: string;
  end_date: string;
  arrival_time: string | null;
  end_time: string | null;
  transport_required: boolean;
  status: DbBookingStatus;
  cancelled_by: DbBookingCancelledBy | null;
  notes: string | null;
  pending_account_link: boolean;
  series_id: string | null;
  series_occurrence_date: string | null;
  food_source: DbFoodSource | null;
  created_at: string;
  updated_at: string;
}

export type BookingInsert = {
  id?: string;
  facility_id: string;
  client_id: string;
  dog_id: string;
  service_type: DbBookingServiceType;
  start_date: string;
  end_date: string;
  arrival_time?: string | null;
  end_time?: string | null;
  transport_required?: boolean;
  status?: DbBookingStatus;
  cancelled_by?: DbBookingCancelledBy | null;
  notes?: string | null;
  pending_account_link?: boolean;
  series_id?: string | null;
  series_occurrence_date?: string | null;
  food_source?: DbFoodSource | null;
  created_at?: string;
  updated_at?: string;
};

export type BookingUpdate = {
  id?: string;
  facility_id?: string;
  client_id?: string;
  dog_id?: string;
  service_type?: DbBookingServiceType;
  start_date?: string;
  end_date?: string;
  arrival_time?: string | null;
  end_time?: string | null;
  transport_required?: boolean;
  status?: DbBookingStatus;
  cancelled_by?: DbBookingCancelledBy | null;
  notes?: string | null;
  pending_account_link?: boolean;
  series_id?: string | null;
  series_occurrence_date?: string | null;
  food_source?: DbFoodSource | null;
  created_at?: string;
  updated_at?: string;
};

export interface BookingSeriesRow {
  id: string;
  facility_id: string;
  client_id: string;
  dog_id: string;
  service_type: DbBookingServiceType;
  recurrence_freq: DbRecurrenceFrequency;
  recurrence_days_of_week: number[];
  recurrence_start_date: string;
  recurrence_end_date: string;
  arrival_time: string | null;
  end_time: string | null;
  transport_required: boolean;
  food_source: DbFoodSource | null;
  notes: string | null;
  status: DbBookingSeriesStatus;
  created_at: string;
  updated_at: string;
}

export type BookingSeriesInsert = {
  id?: string;
  facility_id: string;
  client_id: string;
  dog_id: string;
  service_type: DbBookingServiceType;
  recurrence_freq: DbRecurrenceFrequency;
  recurrence_days_of_week: number[];
  recurrence_start_date: string;
  recurrence_end_date: string;
  arrival_time?: string | null;
  end_time?: string | null;
  transport_required?: boolean;
  food_source?: DbFoodSource | null;
  notes?: string | null;
  status?: DbBookingSeriesStatus;
  created_at?: string;
  updated_at?: string;
};

export type BookingSeriesUpdate = {
  id?: string;
  facility_id?: string;
  client_id?: string;
  dog_id?: string;
  service_type?: DbBookingServiceType;
  recurrence_freq?: DbRecurrenceFrequency;
  recurrence_days_of_week?: number[];
  recurrence_start_date?: string;
  recurrence_end_date?: string;
  arrival_time?: string | null;
  end_time?: string | null;
  transport_required?: boolean;
  food_source?: DbFoodSource | null;
  notes?: string | null;
  status?: DbBookingSeriesStatus;
  created_at?: string;
  updated_at?: string;
};

export interface FacilityCapacityRow {
  facility_id: string;
  daycare_capacity: number;
  boarding_capacity: number;
  created_at: string;
  updated_at: string;
}

export type FacilityCapacityInsert = {
  facility_id: string;
  daycare_capacity?: number;
  boarding_capacity?: number;
  created_at?: string;
  updated_at?: string;
};

export type FacilityCapacityUpdate = {
  facility_id?: string;
  daycare_capacity?: number;
  boarding_capacity?: number;
  created_at?: string;
  updated_at?: string;
};

export interface FacilityNotificationPreferencesRow {
  facility_id: string;
  notify_new_booking: boolean;
  notify_returning_dog_booking: boolean;
  notify_booking_cancelled_by_client: boolean;
  created_at: string;
  updated_at: string;
}

export type FacilityNotificationPreferencesInsert = {
  facility_id: string;
  notify_new_booking?: boolean;
  notify_returning_dog_booking?: boolean;
  notify_booking_cancelled_by_client?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type FacilityNotificationPreferencesUpdate = {
  facility_id?: string;
  notify_new_booking?: boolean;
  notify_returning_dog_booking?: boolean;
  notify_booking_cancelled_by_client?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type DbLocationType = "kennel" | "daycare" | "grooming" | "isolation";

export interface KennelRow {
  id: string;
  facility_id: string;
  name: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type KennelInsert = {
  id?: string;
  facility_id: string;
  name: string;
  capacity?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type KennelUpdate = {
  id?: string;
  facility_id?: string;
  name?: string;
  capacity?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export interface KennelAssignmentRow {
  id: string;
  checkin_id: string;
  facility_id: string;
  location_type: DbLocationType;
  kennel_id: string | null;
  assigned_at: string;
  assigned_by: string;
  notes: string | null;
}

export type KennelAssignmentInsert = {
  id?: string;
  checkin_id: string;
  facility_id: string;
  location_type: DbLocationType;
  kennel_id?: string | null;
  assigned_at?: string;
  assigned_by: string;
  notes?: string | null;
};

export type KennelAssignmentWithKennelRow = KennelAssignmentRow & {
  kennels: { name: string } | null;
};

export interface PricingRulesRow {
  facility_id: string;
  daycare_rate: number;
  boarding_rate: number;
  transport_fee: number;
  food_fee: number;
  seasonal_surcharge_enabled: boolean;
  seasonal_surcharge_percent: number;
  created_at: string;
  updated_at: string;
}

export type PricingRulesInsert = {
  facility_id: string;
  daycare_rate?: number;
  boarding_rate?: number;
  transport_fee?: number;
  food_fee?: number;
  seasonal_surcharge_enabled?: boolean;
  seasonal_surcharge_percent?: number;
  created_at?: string;
  updated_at?: string;
};

export type PricingRulesUpdate = {
  facility_id?: string;
  daycare_rate?: number;
  boarding_rate?: number;
  transport_fee?: number;
  food_fee?: number;
  seasonal_surcharge_enabled?: boolean;
  seasonal_surcharge_percent?: number;
  created_at?: string;
  updated_at?: string;
};

export type DbPaymentMethod = "cash" | "card" | "transfer" | "pass";

export interface PaymentRow {
  id: string;
  checkin_id: string;
  booking_id: string | null;
  facility_id: string;
  service_type: DbBookingServiceType;
  units: number;
  rate: number;
  transport_fee: number;
  food_fee: number;
  surcharge_percent: number;
  subtotal: number;
  total: number;
  payment_method: DbPaymentMethod;
  paid_at: string;
  recorded_by: string;
  client_pass_id: string | null;
}

export type PaymentInsert = {
  id?: string;
  checkin_id: string;
  booking_id?: string | null;
  facility_id: string;
  service_type: DbBookingServiceType;
  units: number;
  rate: number;
  transport_fee?: number;
  food_fee?: number;
  surcharge_percent?: number;
  subtotal: number;
  total: number;
  payment_method: DbPaymentMethod;
  paid_at?: string;
  recorded_by: string;
  client_pass_id?: string | null;
};

export interface PassTypeRow {
  id: string;
  facility_id: string;
  name: string;
  service_type: DbBookingServiceType;
  price: number;
  occasions: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PassTypeInsert = {
  id?: string;
  facility_id: string;
  name: string;
  service_type: DbBookingServiceType;
  price: number;
  occasions: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PassTypeUpdate = {
  id?: string;
  facility_id?: string;
  name?: string;
  service_type?: DbBookingServiceType;
  price?: number;
  occasions?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export interface ClientPassRow {
  id: string;
  facility_id: string;
  client_id: string;
  pass_type_id: string;
  service_type: DbBookingServiceType;
  price: number;
  occasions_total: number;
  occasions_used: number;
  expiry_date: string;
  status: DbClientPassStatus;
  assigned_at: string;
  assigned_by: string;
  created_at: string;
  updated_at: string;
}

export type ClientPassInsert = {
  id?: string;
  facility_id: string;
  client_id: string;
  pass_type_id: string;
  service_type: DbBookingServiceType;
  price: number;
  occasions_total: number;
  occasions_used?: number;
  expiry_date: string;
  status?: DbClientPassStatus;
  assigned_at?: string;
  assigned_by: string;
  created_at?: string;
  updated_at?: string;
};

export type ClientPassUpdate = {
  id?: string;
  facility_id?: string;
  client_id?: string;
  pass_type_id?: string;
  service_type?: DbBookingServiceType;
  price?: number;
  occasions_total?: number;
  occasions_used?: number;
  expiry_date?: string;
  status?: DbClientPassStatus;
  assigned_at?: string;
  assigned_by?: string;
  created_at?: string;
  updated_at?: string;
};

export interface PassUsageRow {
  id: string;
  client_pass_id: string;
  payment_id: string;
  facility_id: string;
  units_consumed: number;
  used_at: string;
}

export type PassUsageInsert = {
  id?: string;
  client_pass_id: string;
  payment_id: string;
  facility_id: string;
  units_consumed?: number;
  used_at?: string;
};

export interface BookingItemRow {
  id: string;
  booking_id: string;
  food_addon: boolean;
  created_at: string;
}

export type BookingItemInsert = {
  id?: string;
  booking_id: string;
  food_addon?: boolean;
  created_at?: string;
};

export type PaymentReportRowDb = PaymentRow & {
  dog_checkins: {
    dog_id: string;
    dogs: { name: string } | null;
  } | null;
};

export type Database = {
  public: {
    Tables: {
      facilities: {
        Row: FacilityRow;
        Insert: {
          id?: string;
          name?: string | null;
          currency?: string;
          facility_code?: string | null;
          booking_form_config?: Record<
            string,
            "hidden" | "optional" | "required"
          > | null;
          subscription_plan?: "dora" | "dora_unlimited";
          subscription_status?: "trialing" | "active" | "past_due" | "canceled";
          trial_ends_at?: string | null;
          staff_limit?: number;
          subscription_started_at?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          past_due_since?: string | null;
          trial_7day_email_sent_at?: string | null;
          grace_started_email_sent_at?: string | null;
          access_blocked_email_sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          currency?: string;
          facility_code?: string | null;
          booking_form_config?: Record<
            string,
            "hidden" | "optional" | "required"
          > | null;
          subscription_plan?: "dora" | "dora_unlimited";
          subscription_status?: "trialing" | "active" | "past_due" | "canceled";
          trial_ends_at?: string | null;
          staff_limit?: number;
          subscription_started_at?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          past_due_since?: string | null;
          trial_7day_email_sent_at?: string | null;
          grace_started_email_sent_at?: string | null;
          access_blocked_email_sent_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: {
          id: string;
          facility_id: string;
          full_name: string;
          email: string;
          role: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          facility_id?: string;
          full_name?: string;
          email?: string;
          role?: UserRole;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_facility_id_fkey";
            columns: ["facility_id"];
            isOneToOne: false;
            referencedRelation: "facilities";
            referencedColumns: ["id"];
          },
        ];
      };
      staff_invites: {
        Row: StaffInviteRow;
        Insert: StaffInviteInsert;
        Update: StaffInviteUpdate;
        Relationships: [
          {
            foreignKeyName: "staff_invites_facility_id_fkey";
            columns: ["facility_id"];
            isOneToOne: false;
            referencedRelation: "facilities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "staff_invites_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      dogs: {
        Row: DogRow;
        Insert: DogInsert;
        Update: DogUpdate;
        Relationships: [];
      };
      clients: {
        Row: ClientRow;
        Insert: ClientInsert;
        Update: ClientUpdate;
        Relationships: [];
      };
      client_accounts: {
        Row: ClientAccountRow;
        Insert: ClientAccountInsert;
        Update: ClientAccountUpdate;
        Relationships: [];
      };
      client_account_links: {
        Row: ClientAccountLinkRow;
        Insert: ClientAccountLinkInsert;
        Update: Partial<ClientAccountLinkInsert>;
        Relationships: [];
      };
      claim_attempts: {
        Row: ClaimAttemptRow;
        Insert: ClaimAttemptInsert;
        Update: Partial<ClaimAttemptInsert>;
        Relationships: [];
      };
      embed_booking_attempts: {
        Row: EmbedBookingAttemptRow;
        Insert: EmbedBookingAttemptInsert;
        Update: Partial<EmbedBookingAttemptInsert>;
        Relationships: [];
      };
      dog_documents: {
        Row: DogDocumentRow;
        Insert: DogDocumentInsert;
        Update: Partial<DogDocumentInsert>;
        Relationships: [];
      };
      checkin_tokens: {
        Row: CheckinTokenRow;
        Insert: CheckinTokenInsert;
        Update: Partial<CheckinTokenInsert>;
        Relationships: [];
      };
      bookings: {
        Row: BookingRow;
        Insert: BookingInsert;
        Update: BookingUpdate;
        Relationships: [];
      };
      booking_series: {
        Row: BookingSeriesRow;
        Insert: BookingSeriesInsert;
        Update: BookingSeriesUpdate;
        Relationships: [];
      };
      facility_capacity: {
        Row: FacilityCapacityRow;
        Insert: FacilityCapacityInsert;
        Update: FacilityCapacityUpdate;
        Relationships: [];
      };
      facility_notification_preferences: {
        Row: FacilityNotificationPreferencesRow;
        Insert: FacilityNotificationPreferencesInsert;
        Update: FacilityNotificationPreferencesUpdate;
        Relationships: [];
      };
      dog_checkins: {
        Row: DogCheckinRow;
        Insert: DogCheckinInsert;
        Update: DogCheckinUpdate;
        Relationships: [];
      };
      kennels: {
        Row: KennelRow;
        Insert: KennelInsert;
        Update: KennelUpdate;
        Relationships: [];
      };
      kennel_assignments: {
        Row: KennelAssignmentRow;
        Insert: KennelAssignmentInsert;
        Update: Partial<KennelAssignmentInsert>;
        Relationships: [];
      };
      pricing_rules: {
        Row: PricingRulesRow;
        Insert: PricingRulesInsert;
        Update: PricingRulesUpdate;
        Relationships: [];
      };
      payments: {
        Row: PaymentRow;
        Insert: PaymentInsert;
        Update: Partial<PaymentInsert>;
        Relationships: [];
      };
      booking_items: {
        Row: BookingItemRow;
        Insert: BookingItemInsert;
        Update: Partial<BookingItemInsert>;
        Relationships: [];
      };
      pass_types: {
        Row: PassTypeRow;
        Insert: PassTypeInsert;
        Update: PassTypeUpdate;
        Relationships: [];
      };
      client_passes: {
        Row: ClientPassRow;
        Insert: ClientPassInsert;
        Update: ClientPassUpdate;
        Relationships: [];
      };
      pass_usages: {
        Row: PassUsageRow;
        Insert: PassUsageInsert;
        Update: Partial<PassUsageInsert>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      record_pass_payment: {
        Args: {
          p_checkin_id: string;
          p_booking_id: string | null;
          p_facility_id: string;
          p_service_type: DbBookingServiceType;
          p_units: number;
          p_rate: number;
          p_transport_fee: number;
          p_food_fee: number;
          p_surcharge_percent: number;
          p_subtotal: number;
          p_total: number;
          p_recorded_by: string;
          p_client_pass_id: string;
          p_client_id: string;
        };
        Returns: PaymentRow;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export interface AuthSetupRequest {
  fullName?: string;
  facilityName?: string;
  email?: string;
  facilityId?: string;
}

export interface AuthSetupSuccessResponse {
  ok: true;
  alreadyExists?: boolean;
  facility: FacilityRow;
  profile: ProfileRow;
}

export interface AuthSetupErrorResponse {
  ok: false;
  error: string;
}

export type AuthSetupResponse = AuthSetupSuccessResponse | AuthSetupErrorResponse;

export const DOG_PHOTOS_BUCKET = "dog-photos" as const;
export const VACCINATION_DOCUMENTS_BUCKET = "vaccination-documents" as const;
