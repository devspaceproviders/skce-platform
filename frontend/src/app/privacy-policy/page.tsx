import LegalPage, {
  LegalContact,
  LegalSection,
} from "@/components/LegalPage";

export const metadata = {
  title: "Privacy Policy — SK Computer Education",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="Your privacy is important to us. This page explains how SK Computer Education handles information provided through this website."
    >
      <LegalSection title="1. Information We Collect">
        <p>
          When you use our website, contact us, register for a course,
          request a demo, or otherwise interact with SK Computer Education,
          we may collect information that you voluntarily provide.
        </p>

        <p>
          This may include your name, email address, phone number, location
          or state, course or package selection, and other information
          required to provide our services.
        </p>
      </LegalSection>

      <LegalSection title="2. How We Use Information">
        <p>
          Information provided by you may be used to process course
          registrations, communicate with you, respond to enquiries, provide
          requested services, manage your account, and improve our
          educational services.
        </p>
      </LegalSection>

      <LegalSection title="3. Payment Information">
        <p>
          Payments made through the website may be processed using
          third-party payment service providers. Payment information is
          handled according to the applicable policies and security
          practices of the payment provider.
        </p>

        <p>
          SK Computer Education does not intend to store sensitive payment
          credentials such as card PINs, CVVs, or UPI authentication
          information on its own systems.
        </p>
      </LegalSection>

      <LegalSection title="4. Communication">
        <p>
          We may use the contact information you provide to respond to
          enquiries, provide information about your registration or courses,
          and communicate regarding services you have requested.
        </p>
      </LegalSection>

      <LegalSection title="5. Data Security">
        <p>
          We take reasonable measures to protect information submitted
          through our website. However, no internet transmission or
          electronic storage system can be guaranteed to be completely
          secure.
        </p>
      </LegalSection>

      <LegalSection title="6. Third-Party Services">
        <p>
          Our website may use third-party services for functions such as
          payment processing, hosting, analytics, communication, or other
          technical services. Those services may process information
          according to their own privacy policies.
        </p>
      </LegalSection>

      <LegalSection title="7. Your Choices">
        <p>
          You may contact SK Computer Education if you have questions about
          information you have provided to us or wish to request
          clarification regarding its use.
        </p>
      </LegalSection>

      <LegalSection title="8. Changes to This Policy">
        <p>
          This Privacy Policy may be updated from time to time to reflect
          changes in our services, website, technology, or applicable
          requirements. Updated versions will be published on this page.
        </p>
      </LegalSection>

      <LegalSection title="9. Contact Us">
        <p>
          If you have questions regarding this Privacy Policy, please
          contact us:
        </p>

        <LegalContact />
      </LegalSection>
    </LegalPage>
  );
}
