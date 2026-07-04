import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Service Agreement — hello DORA",
};

export default function TermsPage() {
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
          Service Agreement
        </h1>
        <p className="mt-2 text-sm text-[oklch(0.556_0.000_89.9)]">
          Effective date: 3 July 2026 · Version 1.0
        </p>

        <div className="mt-8 space-y-8 text-[oklch(0.371_0.000_89.9)] [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[oklch(0.269_0.000_89.9)] [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">
          <section>
            <h2>1. Parties and scope</h2>
            <p>
              This Service Agreement (&quot;Agreement&quot;) is concluded
              between:
            </p>
            <ul>
              <li>
                <strong>Provider:</strong>{" "}Safadi Abdulsalam MWN E.V., 1095
                Budapest, Lechner Ödön fasor 2., 1st floor, door 6, Hungary
                (registration number: [EV registration number], tax number:
                [tax number]; &quot;Provider&quot;), operator of the hello
                DORA platform (&quot;Service&quot;); and
              </li>
              <li>
                <strong>Customer:</strong>{" "}the business (dog daycare or
                boarding facility) that registers an account
                (&quot;Customer&quot;).
              </li>
            </ul>
            <p>
              By creating an account, the Customer accepts this Agreement.
              The Service is offered to businesses only; consumers use the
              owner portal free of charge under the Privacy Policy and
              Section 9 below.
            </p>
          </section>

          <section>
            <h2>2. The Service</h2>
            <p>
              hello DORA is a software-as-a-service platform for managing dog
              daycare and boarding operations: client and dog records,
              bookings, check-ins, kennel assignments, capacity planning,
              payments tracking, reporting, and a self-service portal for dog
              owners. The Service is provided as-is at the current feature
              level; the Provider continuously develops the Service and may
              add, change, or retire features.
            </p>
          </section>

          <section>
            <h2>3. Accounts</h2>
            <ul>
              <li>
                The Customer must provide accurate information at signup and
                keep credentials confidential.
              </li>
              <li>
                The first registered user becomes the Customer&apos;s
                administrator and may invite staff up to the plan&apos;s
                staff limit.
              </li>
              <li>
                The Customer is responsible for all activity under its
                accounts.
              </li>
            </ul>
          </section>

          <section>
            <h2>4. Trial, plans and fees</h2>
            <ul>
              <li>
                <strong>Free trial:</strong>{" "}new Customers receive a 14-day
                free trial. No payment details are required to start. At the
                end of the trial, continued use requires an active
                subscription.
              </li>
              <li>
                <strong>Plans:</strong>{" "}the available plans, their staff
                limits and current prices are communicated in the application
                (Subscription page) or in an individual offer.
              </li>
              <li>
                <strong>Billing:</strong>{" "}subscriptions are billed in advance
                on a recurring basis through Stripe. Prices are net of VAT
                where applicable.
              </li>
              <li>
                <strong>Non-payment:</strong>{" "}if a renewal payment fails, the
                Provider may restrict access after 14 days until payment is
                settled.
              </li>
              <li>
                <strong>No partial refunds:</strong>{" "}fees for started billing
                periods are non-refundable, except where required by law.
              </li>
              <li>
                <strong>Price changes:</strong>{" "}the Provider may change
                prices with at least 30 days&apos; notice, effective from the
                next billing period.
              </li>
            </ul>
          </section>

          <section>
            <h2>5. Customer data and data processing</h2>
            <ul>
              <li>
                All data the Customer enters into the Service (client
                records, dog records, bookings, documents) remains the
                Customer&apos;s property.
              </li>
              <li>
                For personal data in such records, the Customer is the data
                controller and the Provider acts as data processor under
                Article 28 GDPR. The Provider processes such data only to
                provide the Service, keeps it confidential, and implements
                appropriate technical and organisational measures (encryption
                in transit, per-facility data isolation, access control).
              </li>
              <li>
                The Provider uses the subprocessors listed in the Privacy
                Policy (currently Supabase and Stripe, plus the hosting
                provider). The Provider will give notice before adding new
                subprocessors.
              </li>
              <li>
                The Customer warrants that it has a lawful basis to store its
                clients&apos; data in the Service.
              </li>
              <li>
                Upon termination, the Provider deletes the Customer&apos;s
                data within 90 days; on request made before deletion, the
                Provider supplies an export of the data in a common
                machine-readable format.
              </li>
            </ul>
          </section>

          <section>
            <h2>6. Acceptable use</h2>
            <p>The Customer must not:</p>
            <ul>
              <li>use the Service for unlawful purposes;</li>
              <li>
                attempt to breach the security or data isolation of the
                Service, or access another customer&apos;s data;
              </li>
              <li>
                resell or provide the Service to third parties as a service
                bureau;
              </li>
              <li>
                upload malicious code or place unreasonable load on the
                infrastructure.
              </li>
            </ul>
            <p>
              The Provider may suspend accounts that violate this section,
              with notice where practicable.
            </p>
          </section>

          <section>
            <h2>7. Availability and support</h2>
            <p>
              The Provider aims to keep the Service available continuously
              but does not guarantee a specific availability level. Planned
              maintenance will be announced in advance where possible.
              Support is provided in English and Hungarian by email at{" "}
              <a
                href="mailto:info@hellodora.app"
                className="text-[oklch(0.531_0.092_185.0)] underline"
              >
                info@hellodora.app
              </a>{" "}
              on business days.
            </p>
          </section>

          <section>
            <h2>8. Intellectual property</h2>
            <p>
              The Service, its software, design and branding are the
              Provider&apos;s intellectual property. The Customer receives a
              non-exclusive, non-transferable right to use the Service for
              the duration of the subscription. No rights are granted to the
              Customer&apos;s data other than those needed to provide the
              Service.
            </p>
          </section>

          <section>
            <h2>9. Dog-owner portal</h2>
            <p>
              Dog owners invited by a Customer may use the portal free of
              charge to view and manage their own dogs and bookings with that
              Customer. The portal is provided as an auxiliary feature of the
              Customer&apos;s subscription; the contractual relationship for
              daycare services exists solely between the dog owner and the
              Customer.
            </p>
          </section>

          <section>
            <h2>10. Warranties and liability</h2>
            <ul>
              <li>
                The Service is provided &quot;as is&quot;; to the extent
                permitted by law, the Provider disclaims implied warranties.
              </li>
              <li>
                The Provider is not liable for indirect or consequential
                damages, loss of profit, or loss of data caused by factors
                outside its reasonable control.
              </li>
              <li>
                The Provider&apos;s total liability under this Agreement is
                capped at the fees paid by the Customer in the 12 months
                preceding the event giving rise to the claim.
              </li>
              <li>
                Nothing in this Agreement excludes liability that cannot be
                excluded under Hungarian law (e.g. damage caused
                intentionally).
              </li>
            </ul>
          </section>

          <section>
            <h2>11. Term and termination</h2>
            <ul>
              <li>
                This Agreement is effective for the duration of the
                subscription and renews with each billing period.
              </li>
              <li>
                The Customer may cancel at any time with effect from the end
                of the current billing period.
              </li>
              <li>
                Either party may terminate with immediate effect in case of a
                material breach that is not remedied within 15 days of
                written notice.
              </li>
              <li>Data handling after termination is governed by Section 5.</li>
            </ul>
          </section>

          <section>
            <h2>12. Changes to this Agreement</h2>
            <p>
              The Provider may amend this Agreement with at least 30
              days&apos; notice given in the application or by email.
              Continued use of the Service after the effective date
              constitutes acceptance. If the Customer does not accept an
              amendment, it may cancel with effect from the amendment&apos;s
              effective date.
            </p>
          </section>

          <section>
            <h2>13. Governing law and disputes</h2>
            <p>
              This Agreement is governed by Hungarian law. The parties will
              attempt to resolve disputes amicably; failing that, the
              Hungarian courts with jurisdiction over the Provider&apos;s
              registered seat shall decide the dispute.
            </p>
          </section>

          <section>
            <h2>14. Hosting and imprint</h2>
            <p>
              Information required under the Hungarian E-commerce Act (2001.
              évi CVIII. törvény): operator details as in Section 1; hosting
              is provided by [hosting provider name and address]. Contact:{" "}
              <a
                href="mailto:info@hellodora.app"
                className="text-[oklch(0.531_0.092_185.0)] underline"
              >
                info@hellodora.app
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
