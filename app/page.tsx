import { Button } from "@/components/ui/Button";
import {
  AlertTriangle,
  ClipboardCheck,
  Dog,
  PawPrint,
  Shield,
} from "lucide-react";
import Link from "next/link";

const FEATURES = [
  {
    icon: PawPrint,
    title: "Instant dog lookup",
    description:
      "Search profiles in seconds so drop-off never backs up the front desk.",
  },
  {
    icon: AlertTriangle,
    title: "Critical care alerts",
    description:
      "Medication, allergies, and behavior flags visible before you scroll.",
  },
  {
    icon: ClipboardCheck,
    title: "Check-in & check-out",
    description:
      "One-tap status updates with a full activity timeline for every stay.",
  },
  {
    icon: Shield,
    title: "Trusted by staff",
    description:
      "Owner contacts, vet info, and care instructions in one place.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-col bg-[#FAFAF8]">
      <header className="border-b border-stone-200/80 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2 text-teal-700">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
              <Dog className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              Dog Scanner
            </span>
          </div>
          <Link href="/login">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:py-24">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-teal-600">
            For daycare & boarding facilities
          </p>
          <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
            Every dog&apos;s care details,{" "}
            <span className="text-teal-600">one scan away</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-stone-600">
            Dog Scanner helps trainers and staff manage check-ins, care alerts,
            and owner information — built for busy floors and mobile-first
            workflows.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/login">
              <Button size="lg" className="min-w-[200px]">
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline" size="lg" className="min-w-[200px]">
                Create Account
              </Button>
            </Link>
          </div>
        </section>

        <section className="border-t border-stone-200/80 bg-white py-16">
          <div className="mx-auto grid max-w-5xl gap-6 px-4 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl border border-stone-200/80 bg-[#FAFAF8] p-6"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-stone-900">
                  {title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200/80 py-8 text-center text-sm text-stone-500">
        Dog Scanner — Sprint 3 (auth + mock data)
      </footer>
    </div>
  );
}
