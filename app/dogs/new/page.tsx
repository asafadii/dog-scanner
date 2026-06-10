"use client";

import { DogForm } from "@/components/dogs/DogForm";
import { useMockStore } from "@/lib/mockStore";
import { useRouter } from "next/navigation";

export default function NewDogPage() {
  const { addDog } = useMockStore();
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">
          New Dog Profile
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Create a profile when an owner drops off a new dog.
        </p>
      </div>
      <DogForm
        onSubmit={(data) => {
          const dog = addDog(data);
          router.push(`/dogs/${dog.id}`);
        }}
      />
    </div>
  );
}
