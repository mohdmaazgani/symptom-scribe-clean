import { Shield } from "lucide-react";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import Section from "@/components/legal/Section";
import { Link } from "react-router-dom";
const Privacy = () => {
  return (
    <LegalPageLayout title="Privacy Policy" icon={Shield}>
        <Section title="1. Introduction">
          <p>
            Welcome to <strong className="text-foreground">Symptom Scribe</strong>. We are committed to protecting your
            personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose,
            and safeguard your information when you use our platform.
          </p>
          <p className="mt-3">
            Please read this policy carefully. If you disagree with its terms, please discontinue use of the application.
          </p>
        </Section>

        <Section title="2. Information We Collect">
          <p>We may collect the following types of information:</p>
          <ul className="mt-3 space-y-2">
            {[
              "Account information (name, email address, password)",
              "Health data you voluntarily provide (symptoms, health goals, metrics)",
              "Usage data (pages visited, features used, time spent)",
              "Device information (browser type, operating system, IP address)",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="3. How We Use Your Information">
          <p>We use the information we collect to:</p>
          <ul className="mt-3 space-y-2">
            {[
              "Provide, operate, and maintain the Symptom Scribe platform",
              "Personalize your health insights and recommendations",
              "Improve and develop new features",
              "Send you important account and service notifications",
              "Comply with legal obligations",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="4. Sharing of Information">
          <p>
            We do not sell, trade, or rent your personal information to third parties. We may share information with
            trusted service providers who assist us in operating the platform, subject to confidentiality agreements.
            We may also disclose information when required by law.
          </p>
        </Section>

        <Section title="5. Data Security">
          <p>
            We implement industry-standard security measures including encryption, secure servers, and regular security
            audits to protect your data. However, no method of internet transmission is 100% secure, and we cannot
            guarantee absolute security.
          </p>
        </Section>

        <Section title="6. Your Rights">
          <p>You have the right to:</p>
          <ul className="mt-3 space-y-2">
            {[
              "Access the personal data we hold about you",
              "Request correction of inaccurate data",
              "Request deletion of your data",
              "Withdraw consent at any time",
              "Lodge a complaint with a data protection authority",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="7. Contact Us">
          <p>
            If you have questions about this Privacy Policy or your data, please contact us at{" "}
            <a href="https://github.com/mohdmaazgani/symptom-scribe-clean/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
            >
              Open a GitHub Issue
            </a>
            {" "}or{" "}
            <Link to="/contact" className="text-primary hover:underline">
               Contact Support
            </Link>
            .
          </p>
        </Section>
    </LegalPageLayout>
  );
};

export default Privacy;
