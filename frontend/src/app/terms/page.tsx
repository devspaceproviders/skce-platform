export const metadata = {
  title: "Terms of Use — SK Computer Education",
};

export default function TermsPage() {
  return (
    <main className="bg-slate-50">
      {/* Hero */}
      <section className="bg-[#173B67] px-6 py-16 text-white">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-orange-400">
            Legal
          </p>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Terms of Use
          </h1>

          <p className="mt-4 text-sm text-slate-200">
            Please review these terms before using the SK Computer Education
            website and services.
          </p>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
          <div className="space-y-10 text-sm leading-7 text-slate-600">
            <TermsSection title="1. Acceptance of Terms">
              <p>
                By accessing or using the SK Computer Education website, you
                agree to comply with these Terms of Use and any applicable
                policies published on the website.
              </p>
            </TermsSection>

            <TermsSection title="2. Courses and Services">
              <p>
                SK Computer Education provides computer education, digital
                skills training, courses, packages, demonstrations, and
                related learning services.
              </p>

              <p>
                Course content, schedules, delivery methods, trainers, and
                other service details may be updated when necessary.
              </p>
            </TermsSection>

            <TermsSection title="3. Registration">
              <p>
                Users are responsible for providing accurate information when
                registering for an account, course, package, or other service.
              </p>

              <p>
                You are also responsible for maintaining the confidentiality of
                your account credentials and for activity carried out through
                your account.
              </p>
            </TermsSection>

            <TermsSection title="4. Payments">
              <p>
                Where payment is required, the applicable course or package
                price will be displayed before payment is submitted.
              </p>

              <p>
                Online payments may be processed through third-party payment
                providers. Payment processing is subject to the applicable
                terms and policies of those providers.
              </p>
            </TermsSection>

            <TermsSection title="5. Acceptable Use">
              <p>
                Users must not misuse the website, attempt to gain
                unauthorized access to systems, interfere with website
                operation, or use the services for unlawful purposes.
              </p>
            </TermsSection>

            <TermsSection title="6. Intellectual Property">
              <p>
                Website content, branding, course materials, text, graphics,
                and other materials provided by SK Computer Education may be
                protected by applicable intellectual property laws.
              </p>

              <p>
                Users should not reproduce, redistribute, sell, or commercially
                exploit protected course materials without appropriate
                permission.
              </p>
            </TermsSection>

            <TermsSection title="7. Website Availability">
              <p>
                We aim to keep the website and services available and
                functional. However, temporary interruptions may occur because
                of maintenance, technical issues, third-party services, or
                circumstances beyond our control.
              </p>
            </TermsSection>

            <TermsSection title="8. Changes to These Terms">
              <p>
                SK Computer Education may update these Terms of Use when
                necessary. Changes will be published on this page.
              </p>
            </TermsSection>

            <TermsSection title="9. Contact">
              <div className="rounded-xl bg-slate-50 p-5">
                <p className="font-bold text-[#173B67]">
                  SK Computer Education
                </p>

                <p className="mt-2">
                  Email: admissions@skce.in
                </p>

                <p>Phone: +91 98854 22483</p>
              </div>
            </TermsSection>
          </div>
        </div>
      </section>
    </main>
  );
}

function TermsSection({
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