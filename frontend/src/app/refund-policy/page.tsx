export const metadata = {
  title: "Refund Policy — SK Computer Education",
};

export default function RefundPolicyPage() {
  return (
    <main className="bg-slate-50">
      {/* Hero */}
      <section className="bg-[#173B67] px-6 py-16 text-white">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-orange-400">
            Legal
          </p>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Refund Policy
          </h1>

          <p className="mt-4 text-sm text-slate-200">
            Information regarding payments, cancellations, and refund
            requests for SK Computer Education services.
          </p>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
          <div className="space-y-10 text-sm leading-7 text-slate-600">
            <RefundSection title="1. General">
              <p>
                SK Computer Education aims to provide clear information about
                course and package fees before a user completes a payment.
              </p>

              <p>
                Refund requests are reviewed based on the nature of the
                service, payment status, and applicable terms communicated at
                the time of registration.
              </p>
            </RefundSection>

            <RefundSection title="2. Refund Requests">
              <p>
                If you believe that a payment has been made incorrectly or
                there is an issue with a transaction, please contact SK
                Computer Education as soon as possible with the relevant
                payment or registration details.
              </p>
            </RefundSection>

            <RefundSection title="3. Payment Processing Issues">
              <p>
                In cases where an amount has been debited from a bank account
                but the payment status is not successfully reflected, the
                transaction may require verification with the payment service
                provider before any further action is taken.
              </p>
            </RefundSection>

            <RefundSection title="4. Course and Package Registrations">
              <p>
                Refund eligibility for a course or package may depend on
                whether the learning service has already been activated,
                accessed, or delivered.
              </p>

              <p>
                Specific refund conditions may be communicated for individual
                courses, packages, or special offers where applicable.
              </p>
            </RefundSection>

            <RefundSection title="5. Processing">
              <p>
                Approved refunds, where applicable, will be processed using the
                appropriate payment method or payment service provider,
                subject to applicable processing requirements.
              </p>
            </RefundSection>

            <RefundSection title="6. Contact Us">
              <p>
                For questions regarding a payment or refund request, contact
                us with your registration and transaction details.
              </p>

              <div className="rounded-xl bg-slate-50 p-5">
                <p className="font-bold text-[#173B67]">
                  SK Computer Education
                </p>

                <p className="mt-2">
                  Email: admissions@skce.in
                </p>

                <p>Phone: +91 98854 22483</p>
              </div>
            </RefundSection>

            <div className="rounded-xl border border-orange-100 bg-orange-50 p-5 text-sm text-slate-600">
              <p className="font-semibold text-[#173B67]">
                Important
              </p>

              <p className="mt-1">
                This policy is intended as a website draft and should be
                reviewed and finalized according to SK Computer Education&apos;s
                actual commercial, payment, and legal requirements before
                publishing it as a final legal policy.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function RefundSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-extrabold text-[#173B67]">
        {title}
      </h2>

      <div className="space-y-3">{children}</div>
    </section>
  );
}