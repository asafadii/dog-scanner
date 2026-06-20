import type { User } from "@supabase/supabase-js";

export type UserRole = "admin" | "staff";
export type DbDogSize = "small" | "medium" | "large";

export interface DogRow {
  id: string;
  facility_id: string;
  client_id: string | null;
  name: string;
  breed: string;
  age: string;
  size: DbDogSize;
  sex: string | null;
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
  is_active: boolean;
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
  sex?: string | null;
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
  is_active?: boolean;
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
  sex?: string | null;
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
  is_active?: boolean;
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
  notes: string | null;
  invite_code: string | null;
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
  notes?: string | null;
  invite_code?: string | null;
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
  notes?: string | null;
  invite_code?: string | null;
  created_at?: string;
  updated_at?: string;
};

export interface ClientAccountRow {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export type ClientAccountInsert = {
  id: string;
  email: string;
  full_name: string;
  created_at?: string;
  updated_at?: string;
};

export type ClientAccountUpdate = {
  id?: string;
  email?: string;
  full_name?: string;
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

export interface FacilityRow {
  id: string;
  name: string;
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

export interface DogCheckinRow {
  id: string;
  dog_id: string;
  facility_id: string;
  booking_id: string | null;
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
  | "completed";

export interface BookingRow {
  id: string;
  facility_id: string;
  client_id: string;
  dog_id: string;
  service_type: DbBookingServiceType;
  start_date: string;
  end_date: string;
  transport_required: boolean;
  status: DbBookingStatus;
  notes: string | null;
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
  transport_required?: boolean;
  status?: DbBookingStatus;
  notes?: string | null;
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
  transport_required?: boolean;
  status?: DbBookingStatus;
  notes?: string | null;
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

export type DbPaymentMethod = "cash" | "card" | "transfer";

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
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
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
      bookings: {
        Row: BookingRow;
        Insert: BookingInsert;
        Update: BookingUpdate;
        Relationships: [];
      };
      facility_capacity: {
        Row: FacilityCapacityRow;
        Insert: FacilityCapacityInsert;
        Update: FacilityCapacityUpdate;
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
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
