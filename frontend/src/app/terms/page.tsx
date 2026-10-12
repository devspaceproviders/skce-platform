import LegalPage, {
  LegalContact,
  LegalSection,
} from "@/components/LegalPage";

export const metadata = {
  title: "Terms of Use — SK Computer Education",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      intro="Please review these terms before using the SK Computer Education website and services."
    >
      <LegalSection title="1. Acceptance of Terms">
        <p>
          By accessing or using the SK Computer Education website, you agree
          to comply with these Terms of Use and any applicable policies
          published on the website.
        </p>
      </LegalSection>

      <LegalSection title="2. Courses and Services">
        <p>
          SK Computer Education provides computer education, digital skills
          training, courses, packages, demonstrations, and related learning
          services.
        </p>

        <p>
          Course content, schedules, delivery methods, trainers, and other
          service details may be updated when necessary.
        </p>
      </LegalSection>

      <LegalSection title="3. Registration">
        <p>
          Users are responsible for providing accurate information when
          registering for an account, course, package, or other service.
        </p>

        <p>
          You are also responsible for maintaining the confidentiality of
          your account credentials and for activity carried out through your
          account.
        </p>
      </LegalSection>

      <LegalSection title="4. Payments">
        <p>
          Where payment is required, the applicable course or package price
          will be displayed before payment is submitted.
        </p>

        <p>
          Online payments may be processed through third-party payment
          providers. Payment processing is subject to the applicable terms
          and policies of those providers.
        </p>
      </LegalSection>

      <LegalSection title="5. Acceptable Use">
        <p>
          Users must not misuse the website, attempt to gain unauthorized
          access to systems, interfere with website operation, or use the
          services for unlawful purposes.
        </p>
      </LegalSection>

      <LegalSection title="6. Intellectual Property">
        <p>
          Website content, branding, course materials, text, graphics, and
          other materials provided by SK Computer Education may be protected
          by applicable intellectual property laws.
        </p>

        <p>
          Users should not reproduce, redistribute, sell, or commercially
          exploit protected course materials without appropriate permission.
        </p>
      </LegalSection>

      <LegalSection title="7. Website Availability">
        <p>
          We aim to keep the website and services available and functional.
          However, temporary interruptions may occur because of maintenance,
          technical issues, third-party services, or circumstances beyond
          our control.
        </p>
      </LegalSection>

      <LegalSection title="8. Changes to These Terms">
        <p>
          SK Computer Education may update these Terms of Use when
          necessary. Changes will be published on this page.
        </p>
      </LegalSection>

      <LegalSection title="9. Contact">
        <LegalContact />
      </LegalSection>
    </LegalPage>
  );
}
