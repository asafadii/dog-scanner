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
  created_at?: string;
  updated_at?: string;
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
