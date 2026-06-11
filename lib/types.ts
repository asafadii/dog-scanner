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
