import { FileText } from "lucide-react";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import Section from "@/components/legal/Section";

const Terms = () => {
  return (
    <LegalPageLayout title="Terms of Service" icon={FileText}>
        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using <strong className="text-foreground">Symptom Scribe</strong>, you agree to be bound
            by these Terms of Service and our Privacy Policy. If you do not agree to these terms, you may not access
            or use the platform.
          </p>
        </Section>

        <Section title="2. Description of Service">
          <p>
            Symptom Scribe is a health tracking and wellness platform that helps users monitor health goals, analyze
            symptoms, and receive AI-assisted health insights. The platform is intended for informational purposes only
            and does not constitute medical advice, diagnosis, or treatment.
          </p>
        </Section>

        <Section title="3. User Accounts">
          <p>To use certain features, you must create an account. You agree to:</p>
          <ul className="mt-3 space-y-2">
            {[
              "Provide accurate and complete registration information",
              "Maintain the security of your password",
              "Accept responsibility for all activities under your account",
              "Notify us immediately of any unauthorized account use",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="4. Acceptable Use">
          <p>You agree not to:</p>
          <ul className="mt-3 space-y-2">
            {[
              "Use the platform for any unlawful purpose",
              "Attempt to gain unauthorized access to any part of the system",
              "Upload malicious code or interfere with platform functionality",
              "Share your account credentials with others",
              "Reproduce, duplicate, or resell any portion of the service",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="5. Intellectual Property">
          <p>
            All content, features, and functionality of Symptom Scribe — including text, graphics, logos, and software
            — are the exclusive property of Symptom Scribe and are protected by intellectual property laws. You may not
            copy, modify, or distribute any portion without prior written consent.
          </p>
        </Section>

        <Section title="6. Disclaimers">
          <p>
            The platform is provided "as is" without warranties of any kind. We do not warrant that the service will be
            uninterrupted, error-free, or free of harmful components. Health information provided is not a substitute
            for professional medical advice.
          </p>
        </Section>

        <Section title="7. Limitation of Liability">
          <p>
            To the fullest extent permitted by law, Symptom Scribe shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages resulting from your use of or inability to use the platform.
          </p>
        </Section>

        <Section title="8. Termination">
          <p>
            We reserve the right to suspend or terminate your account at our sole discretion, without notice, for
            conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
          </p>
        </Section>

        <Section title="9. Changes to Terms">
          <p>
            We may update these Terms at any time. Continued use of the platform after changes constitutes acceptance
            of the new Terms. We encourage you to review these Terms periodically.
          </p>
        </Section>

        <Section title="10. Contact">
          <p>
            For questions regarding these Terms, contact us at{" "}
            <a 
              href="https://github.com/mohdmaazgani/symptom-scribe-clean/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Open a GitHub Issue
            </a>
            .
          </p>
        </Section>
    </LegalPageLayout>
  );
};

export default Terms;
