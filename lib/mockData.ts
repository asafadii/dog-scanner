import type { Dog } from "./types";

export const MOCK_DOGS: Dog[] = [
  {
    id: "max-001",
    name: "Max",
    breed: "Golden Retriever",
    age: "3 years",
    size: "large",
    photoUrl:
      "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=400&h=400&fit=crop",
    status: "checked_in",
    alerts: {
      medication: true,
      allergy: true,
      dietary: true,
      aggression: false,
      escapeRisk: false,
    },
    owner: {
      name: "Sarah Johnson",
      phone: "(555) 123-4567",
      email: "sarah.j@email.com",
      emergencyContact: "Mike Johnson",
      emergencyPhone: "(555) 987-6543",
      veterinarian: "Dr. Emily Chen — Coastal Vet Clinic",
      vetPhone: "(555) 246-8135",
    },
    care: {
      medication:
        "Carprofen 75mg twice daily with food. Give at 8 AM and 8 PM.",
      feeding:
        "2 cups grain-free kibble twice daily. No chicken-based treats.",
      allergies:
        "Chicken protein — causes skin irritation and digestive issues.",
      behavior:
        "Friendly and social. Anxious during thunderstorms. Loves fetch.",
    },
    overnight: false,
    lastCheckIn: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    lastCheckOut: null,
    todaysCare: [
      { id: "tc1", task: "Morning medication", completed: true, time: "8:00 AM" },
      { id: "tc2", task: "Morning feeding", completed: true, time: "7:15 AM" },
      { id: "tc3", task: "Morning walk", completed: true, time: "9:30 AM" },
      { id: "tc4", task: "Afternoon medication", completed: false },
      { id: "tc5", task: "Evening feeding", completed: false },
    ],
    timeline: [
      {
        id: "tl1",
        time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        type: "check-in",
        description: "Checked in by Sarah Johnson",
        staff: "Mike T.",
      },
      {
        id: "tl2",
        time: new Date(Date.now() - 1.75 * 60 * 60 * 1000).toISOString(),
        type: "care",
        description: "Fed morning meal — ate well",
        staff: "Mike T.",
      },
      {
        id: "tl3",
        time: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
        type: "medication",
        description: "Carprofen 75mg administered",
        staff: "Jessica L.",
      },
      {
        id: "tl4",
        time: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        type: "activity",
        description: "Played well in group play",
        staff: "Jessica L.",
      },
    ],
  },
  {
    id: "luna-002",
    name: "Luna",
    breed: "Border Collie",
    age: "2 years",
    size: "medium",
    photoUrl:
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=400&fit=crop",
    status: "checked_in",
    alerts: {
      medication: false,
      allergy: false,
      dietary: false,
      aggression: false,
      escapeRisk: true,
    },
    owner: {
      name: "David Park",
      phone: "(555) 234-5678",
      email: "david.park@email.com",
      emergencyContact: "Amy Park",
      emergencyPhone: "(555) 876-5432",
      veterinarian: "Dr. James Wu — Riverside Animal Hospital",
      vetPhone: "(555) 345-6789",
    },
    care: {
      medication: "None",
      feeding: "1.5 cups kibble twice daily. High-energy formula.",
      allergies: "None known",
      behavior:
        "Very active, needs mental stimulation. Jumps fences — use double-gate protocol.",
    },
    overnight: true,
    lastCheckIn: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    lastCheckOut: null,
    todaysCare: [
      { id: "tc1", task: "Morning feeding", completed: true, time: "7:00 AM" },
      { id: "tc2", task: "Agility session", completed: true, time: "10:00 AM" },
      { id: "tc3", task: "Afternoon walk", completed: false },
      { id: "tc4", task: "Evening feeding", completed: false },
    ],
    timeline: [
      {
        id: "tl1",
        time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        type: "check-in",
        description: "Overnight boarding check-in",
        staff: "Tom R.",
      },
      {
        id: "tl2",
        time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        type: "activity",
        description: "Agility course — 30 minutes",
        staff: "Tom R.",
      },
    ],
  },
  {
    id: "rocky-003",
    name: "Rocky",
    breed: "Pit Bull Mix",
    age: "5 years",
    size: "large",
    photoUrl:
      "https://images.unsplash.com/photo-1568393691622-c7ba131d63b4?w=400&h=400&fit=crop",
    status: "checked_in",
    alerts: {
      medication: true,
      allergy: false,
      dietary: false,
      aggression: true,
      escapeRisk: false,
    },
    owner: {
      name: "Maria Garcia",
      phone: "(555) 345-6789",
      email: "maria.g@email.com",
      emergencyContact: "Carlos Garcia",
      emergencyPhone: "(555) 765-4321",
      veterinarian: "Dr. Lisa Patel — Sunny Paws Vet",
      vetPhone: "(555) 456-7890",
    },
    care: {
      medication: "Gabapentin 100mg once daily for anxiety. Give with breakfast.",
      feeding: "2 cups standard kibble, morning and evening.",
      allergies: "None known",
      behavior:
        "Reactive to unfamiliar male dogs. Keep separate during group play. Sweet with people.",
    },
    overnight: false,
    lastCheckIn: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    lastCheckOut: null,
    todaysCare: [
      { id: "tc1", task: "Morning medication", completed: true, time: "8:30 AM" },
      { id: "tc2", task: "Solo play session", completed: false },
      { id: "tc3", task: "Evening medication", completed: false },
    ],
    timeline: [
      {
        id: "tl1",
        time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        type: "check-in",
        description: "Checked in by Maria Garcia",
        staff: "Jessica L.",
      },
    ],
  },
  {
    id: "bella-004",
    name: "Bella",
    breed: "French Bulldog",
    age: "4 years",
    size: "small",
    photoUrl:
      "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop",
    status: "checked_out",
    alerts: {
      medication: false,
      allergy: true,
      dietary: true,
      aggression: false,
      escapeRisk: false,
    },
    owner: {
      name: "James Wilson",
      phone: "(555) 456-7890",
      email: "james.w@email.com",
      emergencyContact: "Emma Wilson",
      emergencyPhone: "(555) 654-3210",
      veterinarian: "Dr. Emily Chen — Coastal Vet Clinic",
      vetPhone: "(555) 246-8135",
    },
    care: {
      medication: "None",
      feeding: "Limited ingredient diet — salmon formula only.",
      allergies: "Beef and dairy — severe digestive reaction.",
      behavior: "Calm, prefers quiet areas. Heat-sensitive — limit outdoor time.",
    },
    overnight: false,
    lastCheckIn: null,
    lastCheckOut: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    todaysCare: [],
    timeline: [
      {
        id: "tl1",
        time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        type: "check-out",
        description: "Checked out by James Wilson",
        staff: "Mike T.",
      },
    ],
  },
  {
    id: "cooper-005",
    name: "Cooper",
    breed: "Labrador Retriever",
    age: "1 year",
    size: "medium",
    photoUrl:
      "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=400&fit=crop",
    status: "checked_out",
    alerts: {
      medication: false,
      allergy: false,
      dietary: false,
      aggression: false,
      escapeRisk: false,
    },
    owner: {
      name: "Emily Chen",
      phone: "(555) 567-8901",
      email: "emily.chen@email.com",
      emergencyContact: "Robert Chen",
      emergencyPhone: "(555) 543-2109",
      veterinarian: "Dr. James Wu — Riverside Animal Hospital",
      vetPhone: "(555) 345-6789",
    },
    care: {
      medication: "None",
      feeding: "Puppy formula kibble, 3x daily.",
      allergies: "None known",
      behavior: "Energetic puppy. Still learning recall. Very friendly.",
    },
    overnight: false,
    lastCheckIn: null,
    lastCheckOut: null,
    todaysCare: [],
    timeline: [],
  },
];

export function getDashboardStats(dogs: Dog[]) {
  return {
    checkedIn: dogs.filter((d) => d.status === "checked_in").length,
    needMedication: dogs.filter(
      (d) => d.status === "checked_in" && d.alerts.medication,
    ).length,
    overnight: dogs.filter((d) => d.overnight && d.status === "checked_in")
      .length,
    total: dogs.length,
  };
}
