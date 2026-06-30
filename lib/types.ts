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
  inviteCode: string | null;
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
  currentAssignment: KennelAssignment | null;
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
  dogPhotoUrl: string | null;
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

export type LocationType = "kennel" | "daycare" | "grooming" | "isolation";

export interface Kennel {
  id: string;
  name: string;
  capacity: number;
  isActive: boolean;
}

export interface KennelAssignment {
  id: string;
  checkinId: string;
  locationType: LocationType;
  kennelId: string | null;
  kennelName: string | null;
  notes: string | null;
  assignedAt: string;
}

export type PaymentMethod = "cash" | "card" | "transfer";

export interface PricingRules {
  facilityId: string;
  daycareRate: number;
  boardingRate: number;
  transportFee: number;
  foodFee: number;
  seasonalSurchargeEnabled: boolean;
  seasonalSurchargePercent: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface StayPriceBreakdown {
  serviceType: BookingServiceType;
  units: number;
  rate: number;
  transportFee: number;
  foodFee: number;
  surchargePercent: number;
  subtotal: number;
  total: number;
}

export interface Payment {
  id: string;
  checkinId: string;
  bookingId: string | null;
  serviceType: BookingServiceType;
  units: number;
  rate: number;
  transportFee: number;
  foodFee: number;
  surchargePercent: number;
  subtotal: number;
  total: number;
  paymentMethod: PaymentMethod;
  paidAt: string;
}

export interface PaymentReportRow {
  id: string;
  dogName: string;
  serviceType: BookingServiceType;
  paidAt: string;
  total: number;
  paymentMethod: PaymentMethod;
}

export interface RevenueReport {
  totalRevenue: number;
  totalStays: number;
  daycareVisits: number;
  boardingStays: number;
  paymentBreakdown: {
    cash: number;
    card: number;
    transfer: number;
  };
  payments: PaymentReportRow[];
}

export type DogDocumentType = "vaccination" | "pedigree" | "other";

export interface DogDocument {
  id: string;
  dogId: string;
  facilityId: string;
  documentType: DogDocumentType;
  filePath: string;
  uploadedByClientAccountId: string | null;
  createdAt: string;
}

export interface SubscriptionInfo {
  plan: "dora" | "dora_unlimited";
  status: "trialing" | "active" | "past_due" | "canceled";
  trialEndsAt: string | null;
  staffLimit: number;
  isUnlimited: boolean;
  isActive: boolean;
  daysLeftInTrial: number | null;
}

export interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  role: "admin" | "staff";
  createdAt: string;
}
