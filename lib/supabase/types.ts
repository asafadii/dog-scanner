import type { User } from "@supabase/supabase-js";

export type UserRole = "admin" | "staff";

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

export interface Database {
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
  };
}

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export interface AuthSetupRequest {
  fullName: string;
  facilityName: string;
  email: string;
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
