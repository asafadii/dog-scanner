export type DogStatus = "checked_in" | "checked_out";

export type DogSize = "small" | "medium" | "large";

export interface DogAlerts {
  medication: boolean;
  allergy: boolean;
  dietary: boolean;
  aggression: boolean;
  escapeRisk: boolean;
}

export interface DogOwner {
  name: string;
  phone: string;
  email: string;
  emergencyContact: string;
  emergencyPhone: string;
  veterinarian: string;
  vetPhone: string;
}

export interface DogCare {
  medication: string;
  feeding: string;
  allergies: string;
  behavior: string;
}

export interface CareTask {
  id: string;
  task: string;
  completed: boolean;
  time?: string;
}

export interface TimelineEvent {
  id: string;
  time: string;
  type: "check-in" | "check-out" | "medication" | "care" | "activity" | "note";
  description: string;
  staff?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  emergencyContact: string | null;
  notes: string | null;
  dogCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  emergencyContact: string;
  notes: string;
}

export interface DogClientLink {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  emergencyContact: string | null;
  address: string | null;
  notes: string | null;
}

export interface Dog {
  id: string;
  name: string;
  breed: string;
  age: string;
  size: DogSize;
  photoUrl: string | null;
  status: DogStatus;
  alerts: DogAlerts;
  owner: DogOwner;
  care: DogCare;
  clientId: string | null;
  client: DogClientLink | null;
  isReturning: boolean;
  overnight: boolean;
  lastCheckIn: string | null;
  lastCheckOut: string | null;
  activeCheckinId: string | null;
  todaysCare: CareTask[];
  timeline: TimelineEvent[];
}

export interface NewDogFormData {
  name: string;
  breed: string;
  age: string;
  size: DogSize;
  clientId: string | null;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  medication: string;
  feeding: string;
  allergies: string;
  behavior: string;
  alerts: DogAlerts;
  overnight: boolean;
}

export type BookingServiceType = "daycare" | "boarding";

export type BookingStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "completed";

export interface Booking {
  id: string;
  facilityId: string;
  clientId: string;
  dogId: string;
  serviceType: BookingServiceType;
  startDate: string;
  endDate: string;
  transportRequired: boolean;
  status: BookingStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  clientName: string;
  dogName: string;
  dogBreed: string;
}

export interface BookingFormData {
  clientId: string;
  dogId: string;
  serviceType: BookingServiceType;
  startDate: string;
  endDate: string;
  transportRequired: boolean;
  notes: string;
}

export interface FacilityCapacity {
  facilityId: string;
  daycareCapacity: number;
  boardingCapacity: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CapacityFormData {
  daycareCapacity: number;
  boardingCapacity: number;
}

export interface CapacityUsage {
  used: number;
  capacity: number;
}
