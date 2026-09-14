export const metadata = {
  title: "Privacy Policy — SK Computer Education",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="bg-slate-50">
      {/* Hero */}
      <section className="bg-[#173B67] px-6 py-16 text-white">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-orange-400">
            Legal
          </p>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Privacy Policy
          </h1>

          <p className="mt-4 text-sm text-slate-200">
            Your privacy is important to us. This page explains how SK
            Computer Education handles information provided through this
            website.
          </p>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
          <div className="space-y-10 text-sm leading-7 text-slate-600">
            <PolicySection title="1. Information We Collect">
              <p>
                When you use our website, contact us, register for a course,
                request a demo, or otherwise interact with SK Computer
                Education, we may collect information that you voluntarily
                provide.
              </p>

              <p>
                This may include your name, email address, phone number,
                location or state, course or package selection, and other
                information required to provide our services.
              </p>
            </PolicySection>

            <PolicySection title="2. How We Use Information">
              <p>
                Information provided by you may be used to process course
                registrations, communicate with you, respond to enquiries,
                provide requested services, manage your account, and improve
                our educational services.
              </p>
            </PolicySection>

            <PolicySection title="3. Payment Information">
              <p>
                Payments made through the website may be processed using
                third-party payment service providers. Payment information is
                handled according to the applicable policies and security
                practices of the payment provider.
              </p>

              <p>
                SK Computer Education does not intend to store sensitive
                payment credentials such as card PINs, CVVs, or UPI
                authentication information on its own systems.
              </p>
            </PolicySection>

            <PolicySection title="4. Communication">
              <p>
                We may use the contact information you provide to respond to
                enquiries, provide information about your registration or
                courses, and communicate regarding services you have requested.
              </p>
            </PolicySection>

            <PolicySection title="5. Data Security">
              <p>
                We take reasonable measures to protect information submitted
                through our website. However, no internet transmission or
                electronic storage system can be guaranteed to be completely
                secure.
              </p>
            </PolicySection>

            <PolicySection title="6. Third-Party Services">
              <p>
                Our website may use third-party services for functions such as
                payment processing, hosting, analytics, communication, or
                other technical services. Those services may process
                information according to their own privacy policies.
              </p>
            </PolicySection>

            <PolicySection title="7. Your Choices">
              <p>
                You may contact SK Computer Education if you have questions
                about information you have provided to us or wish to request
                clarification regarding its use.
              </p>
            </PolicySection>

            <PolicySection title="8. Changes to This Policy">
              <p>
                This Privacy Policy may be updated from time to time to reflect
                changes in our services, website, technology, or applicable
                requirements. Updated versions will be published on this page.
              </p>
            </PolicySection>

            <PolicySection title="9. Contact Us">
              <p>
                If you have questions regarding this Privacy Policy, please
                contact us:
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
            </PolicySection>
          </div>
        </div>
      </section>
    </main>
  );
}

function PolicySection({
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