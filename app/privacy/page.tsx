import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Privacy Policy — hello DORA",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-[oklch(0.885_0.000_89.9)]">
        <div className="mx-auto flex max-w-3xl items-center px-4 py-4 sm:px-6">
          <Link href="/">
            <Image
              src="/dora-logo.svg"
              alt="hello DORA"
              width={120}
              height={32}
              className="h-7 w-auto"
            />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold text-[oklch(0.269_0.000_89.9)]">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-[oklch(0.556_0.000_89.9)]">
          Effective date: 3 July 2026 · Version 1.0
        </p>

        <div className="mt-8 space-y-8 text-[oklch(0.371_0.000_89.9)] [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[oklch(0.269_0.000_89.9)] [&_h3]:font-semibold [&_h3]:text-[oklch(0.269_0.000_89.9)] [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">
          <section>
            <h2>1. Who we are</h2>
            <p>
              hello DORA (&quot;DORA&quot;, &quot;we&quot;, &quot;us&quot;) is a
              dog daycare and boarding management platform operated by:
            </p>
            <ul>
              <li>
                <strong>Operator:</strong>{" "}Safadi Abdulsalam MWN E.V. (sole
                proprietorship registered in Hungary)
              </li>
              <li>
                <strong>Registered address:</strong>{" "}1095 Budapest, Lechner
                Ödön fasor 2., 1st floor, door 6, Hungary
              </li>
              <li>
                <strong>Registration number:</strong>{" "}[EV registration number]
              </li>
              <li>
                <strong>Tax number:</strong>{" "}[tax number]
              </li>
              <li>
                <strong>Contact:</strong>{" "}
                <a
                  href="mailto:info@hellodora.app"
                  className="text-[oklch(0.531_0.092_185.0)] underline"
                >
                  info@hellodora.app
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2>2. Our two roles under the GDPR</h2>
            <p>
              DORA is business software used by dog daycare and boarding
              facilities (&quot;Facilities&quot;). Depending on the data, we
              act in one of two roles:
            </p>
            <ul>
              <li>
                <strong>We are the data controller</strong>{" "}for the data of
                people who hold an account with us directly: Facility staff
                accounts, dog-owner portal accounts, billing records, and
                website visitor data.
              </li>
              <li>
                <strong>We are a data processor</strong>{" "}for the data a
                Facility stores in DORA about its own customers — dog owners,
                their contact details, and their dogs. For that data, the
                Facility is the controller and this processing is governed by
                our Service Agreement (including its data processing terms).
                If you are a dog owner with questions about how a Facility
                handles your data, please contact the Facility first.
              </li>
            </ul>
          </section>

          <section>
            <h2>3. What we collect and why</h2>
            <h3>3.1 Account data (we are controller)</h3>
            <ul>
              <li>
                <strong>Facility staff accounts:</strong>{" "}full name, email
                address, role, password (stored as a secure hash). Legal
                basis: performance of a contract (GDPR Art. 6(1)(b)).
              </li>
              <li>
                <strong>Dog-owner portal accounts:</strong>{" "}name, email
                address, password (hashed). Legal basis: performance of a
                contract (Art. 6(1)(b)).
              </li>
              <li>
                <strong>Billing data:</strong>{" "}subscription plan, payment
                status and invoicing details, processed through Stripe. We do
                not store card numbers. Legal bases: contract (Art. 6(1)(b))
                and legal obligation — accounting rules (Art. 6(1)(c)).
              </li>
              <li>
                <strong>Technical data:</strong>{" "}server logs (IP address,
                timestamps, requested pages) kept for security and fault
                diagnosis. Legal basis: legitimate interest (Art. 6(1)(f)) in
                keeping the service secure.
              </li>
            </ul>
            <h3>3.2 Facility data (we are processor)</h3>
            <ul>
              <li>
                Client records entered by a Facility: owner names, email
                addresses, phone numbers, addresses, emergency contacts.
              </li>
              <li>
                Dog records: name, breed, photos, health and behaviour notes,
                medication, vet contacts, microchip number, uploaded
                documents (e.g. vaccination records).
              </li>
              <li>
                Operational records: bookings, check-ins/check-outs, kennel
                assignments, payments recorded by the Facility.
              </li>
            </ul>
            <p>
              We process this data solely on the Facility&apos;s instructions
              and never use it for our own purposes.
            </p>
          </section>

          <section>
            <h2>4. Cookies</h2>
            <p>
              DORA uses only essential cookies required to keep you signed in
              (authentication session). We do not use advertising or
              third-party analytics cookies.
            </p>
          </section>

          <section>
            <h2>5. Who we share data with</h2>
            <p>
              We use a small number of service providers (subprocessors) to
              run DORA:
            </p>
            <ul>
              <li>
                <strong>Supabase</strong>{" "}— database, authentication and file
                storage.
              </li>
              <li>
                <strong>Stripe</strong>{" "}— subscription payments and invoicing.
              </li>
              <li>
                <strong>[Hosting provider]</strong>{" "}— application hosting.
              </li>
            </ul>
            <p>
              We do not sell personal data and do not share it with anyone
              else, except where required by law.
            </p>
          </section>

          <section>
            <h2>6. International transfers</h2>
            <p>
              Where a service provider processes data outside the European
              Economic Area, the transfer is protected by an adequacy
              decision of the European Commission or by Standard Contractual
              Clauses.
            </p>
          </section>

          <section>
            <h2>7. How long we keep data</h2>
            <ul>
              <li>
                <strong>Account data:</strong>{" "}for the life of the account,
                then deleted or anonymised within 90 days of account closure.
              </li>
              <li>
                <strong>Billing records:</strong>{" "}8 years, as required by
                Hungarian accounting law.
              </li>
              <li>
                <strong>Facility data (processor role):</strong>{" "}retained as
                long as the Facility&apos;s subscription is active; deleted
                within 90 days after termination of the Service Agreement, on
                the Facility&apos;s instruction.
              </li>
              <li>
                <strong>Server logs:</strong>{" "}up to 12 months.
              </li>
            </ul>
          </section>

          <section>
            <h2>8. Your rights</h2>
            <p>
              Under the GDPR you may request access to, correction of,
              deletion of, or a portable copy of your personal data; you may
              also object to or ask us to restrict certain processing.
              Contact us at{" "}
              <a
                href="mailto:info@hellodora.app"
                className="text-[oklch(0.531_0.092_185.0)] underline"
              >
                info@hellodora.app
              </a>{" "}
              — we respond within 30 days.
            </p>
            <p>
              You also have the right to lodge a complaint with the Hungarian
              supervisory authority: Nemzeti Adatvédelmi és
              Információszabadság Hatóság (NAIH), 1055 Budapest, Falk Miksa
              utca 9–11., naih.hu — or with the supervisory authority of your
              own EU member state.
            </p>
          </section>

          <section>
            <h2>9. Security</h2>
            <p>
              All traffic is encrypted in transit (TLS). Data is stored in
              access-controlled infrastructure with row-level security that
              isolates each Facility&apos;s data. Passwords are stored only
              as cryptographic hashes.
            </p>
          </section>

          <section>
            <h2>10. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. Material changes
              will be announced in the application or by email at least 15
              days before they take effect.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
