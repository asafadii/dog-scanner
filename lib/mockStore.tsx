"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MOCK_DOGS } from "./mockData";
import type { CareTask, Dog, DogStatus, NewDogFormData, TimelineEvent } from "./types";

interface MockStoreContextValue {
  dogs: Dog[];
  getDog: (id: string) => Dog | undefined;
  toggleCheckStatus: (id: string) => void;
  toggleCareTask: (dogId: string, taskId: string) => void;
  addDog: (data: NewDogFormData) => Dog;
  addTimelineNote: (dogId: string, note: string, staff?: string) => void;
}

const MockStoreContext = createContext<MockStoreContextValue | null>(null);

function createId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function MockStoreProvider({ children }: { children: ReactNode }) {
  const [dogs, setDogs] = useState<Dog[]>(MOCK_DOGS);

  const getDog = useCallback(
    (id: string) => dogs.find((d) => d.id === id),
    [dogs],
  );

  const toggleCheckStatus = useCallback((id: string) => {
    setDogs((prev) =>
      prev.map((dog) => {
        if (dog.id !== id) return dog;

        const now = new Date().toISOString();
        const checkingIn = dog.status === "checked_out";
        const event: TimelineEvent = {
          id: createId(),
          time: now,
          type: checkingIn ? "check-in" : "check-out",
          description: checkingIn
            ? `Checked in — ${dog.owner.name}`
            : `Checked out — ${dog.owner.name}`,
          staff: "Staff",
        };

        return {
          ...dog,
          status: (checkingIn ? "checked_in" : "checked_out") as DogStatus,
          lastCheckIn: checkingIn ? now : dog.lastCheckIn,
          lastCheckOut: checkingIn ? dog.lastCheckOut : now,
          timeline: [event, ...dog.timeline],
          todaysCare: checkingIn
            ? dog.todaysCare.length > 0
              ? dog.todaysCare
              : [
                  { id: createId(), task: "Morning feeding", completed: false },
                  { id: createId(), task: "Afternoon walk", completed: false },
                ]
            : [],
        };
      }),
    );
  }, []);

  const toggleCareTask = useCallback((dogId: string, taskId: string) => {
    setDogs((prev) =>
      prev.map((dog) => {
        if (dog.id !== dogId) return dog;
        return {
          ...dog,
          todaysCare: dog.todaysCare.map((task) => {
            if (task.id !== taskId) return task;
            const completed = !task.completed;
            return {
              ...task,
              completed,
              time: completed
                ? new Intl.DateTimeFormat("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  }).format(new Date())
                : undefined,
            } satisfies CareTask;
          }),
        };
      }),
    );
  }, []);

  const addDog = useCallback((data: NewDogFormData): Dog => {
    const id = createId();
    const newDog: Dog = {
      id,
      name: data.name,
      breed: data.breed,
      age: data.age,
      size: data.size,
      photoUrl: null,
      status: "checked_out",
      alerts: data.alerts,
      owner: {
        name: data.ownerName,
        phone: data.ownerPhone,
        email: data.ownerEmail,
        emergencyContact: data.ownerName,
        emergencyPhone: data.ownerPhone,
        veterinarian: "",
        vetPhone: "",
      },
      care: {
        medication: data.medication || "None",
        feeding: data.feeding || "Standard diet",
        allergies: data.allergies || "None known",
        behavior: data.behavior || "No notes",
      },
      overnight: data.overnight,
      lastCheckIn: null,
      lastCheckOut: null,
      todaysCare: [],
      timeline: [],
    };
    setDogs((prev) => [...prev, newDog]);
    return newDog;
  }, []);

  const addTimelineNote = useCallback(
    (dogId: string, note: string, staff = "Staff") => {
      setDogs((prev) =>
        prev.map((dog) => {
          if (dog.id !== dogId) return dog;
          const event: TimelineEvent = {
            id: createId(),
            time: new Date().toISOString(),
            type: "note",
            description: note,
            staff,
          };
          return { ...dog, timeline: [event, ...dog.timeline] };
        }),
      );
    },
    [],
  );

  const value = useMemo(
    () => ({
      dogs,
      getDog,
      toggleCheckStatus,
      toggleCareTask,
      addDog,
      addTimelineNote,
    }),
    [dogs, getDog, toggleCheckStatus, toggleCareTask, addDog, addTimelineNote],
  );

  return (
    <MockStoreContext.Provider value={value}>{children}</MockStoreContext.Provider>
  );
}

export function useMockStore(): MockStoreContextValue {
  const ctx = useContext(MockStoreContext);
  if (!ctx) {
    throw new Error("useMockStore must be used within MockStoreProvider");
  }
  return ctx;
}
