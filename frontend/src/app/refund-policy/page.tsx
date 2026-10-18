import LegalPage, {
  LegalContact,
  LegalSection,
} from "@/components/LegalPage";

export const metadata = {
  title: "Refund Policy — SK Computer Education",
};

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund Policy"
      intro="Information regarding payments, cancellations, and refund requests for SK Computer Education services."
    >
      <LegalSection title="1. General">
        <p>
          SK Computer Education aims to provide clear information about
          course and package fees before a user completes a payment.
        </p>

        <p>
          Refund requests are reviewed based on the nature of the service,
          payment status, and applicable terms communicated at the time of
          registration.
        </p>
      </LegalSection>

      <LegalSection title="2. Refund Requests">
        <p>
          If you believe that a payment has been made incorrectly or there
          is an issue with a transaction, please contact SK Computer
          Education as soon as possible with the relevant payment or
          registration details.
        </p>
      </LegalSection>

      <LegalSection title="3. Payment Processing Issues">
        <p>
          In cases where an amount has been debited from a bank account but
          the payment status is not successfully reflected, the transaction
          may require verification with the payment service provider before
          any further action is taken.
        </p>
      </LegalSection>

      <LegalSection title="4. Course and Package Registrations">
        <p>
          Refund eligibility for a course or package may depend on whether
          the learning service has already been activated, accessed, or
          delivered.
        </p>

        <p>
          Specific refund conditions may be communicated for individual
          courses, packages, or special offers where applicable.
        </p>
      </LegalSection>

      <LegalSection title="5. Processing">
        <p>
          Approved refunds, where applicable, will be processed using the
          appropriate payment method or payment service provider, subject to
          applicable processing requirements.
        </p>
      </LegalSection>

      <LegalSection title="6. Contact Us">
        <p>
          For questions regarding a payment or refund request, contact us
          with your registration and transaction details.
        </p>

        <LegalContact />
      </LegalSection>

    </LegalPage>
  );
}
