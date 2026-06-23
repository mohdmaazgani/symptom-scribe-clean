import { Accessibility } from "lucide-react";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import Section from "@/components/legal/Section";

const AccessibilityPage = () => {
  return (
    <LegalPageLayout title="Accessibility" icon={Accessibility}>
      {/* Commitment Banner */}
        <div role="note" className="rounded-xl bg-primary/5 border border-primary/20 p-5">
          <p className="text-foreground text-sm leading-relaxed">
            <strong>Our Commitment:</strong> Symptom Scribe is committed to ensuring digital accessibility for people
            with disabilities. We continually improve the user experience for everyone and apply relevant accessibility
            standards.
          </p>
        </div>

        <Section title="1. Our Standard">
          <p>
            We aim to conform to the{" "}
            <strong className="text-foreground">
              Web Content Accessibility Guidelines (WCAG) 2.1 Level AA
            </strong>
            . These guidelines explain how to make web content more accessible to people with disabilities, covering
            visual, auditory, physical, speech, cognitive, and neurological conditions.
          </p>
        </Section>

        <Section title="2. Measures We Take">
          <p>Symptom Scribe takes the following measures to ensure accessibility:</p>
          <ul className="mt-3 space-y-2">
            {[
              "Semantic HTML to support assistive technologies like screen readers",
              "Sufficient color contrast ratios for text and UI elements",
              "Keyboard navigability for all interactive elements",
              "Descriptive alt text for all meaningful images",
              "Responsive design that works across devices and zoom levels",
              "Focus indicators visible for keyboard users",
              "ARIA labels and roles where appropriate",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="3. Known Limitations">
          <p>
            While we strive for full accessibility, some areas of the platform may not yet fully meet all WCAG 2.1 AA
            criteria. We are actively working to address these gaps. Known areas under improvement include:
          </p>
          <ul className="mt-3 space-y-2">
            {[
              "Some AI-generated chart descriptions may not yet have detailed alt text",
              "Certain interactive game components are being enhanced for keyboard access",
              "Third-party embedded content may have accessibility limitations outside our control",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="4. Assistive Technology Support">
          <p>
            Symptom Scribe is designed to be compatible with commonly used assistive technologies, including:
          </p>
          <ul className="mt-3 space-y-2">
            {[
              "Screen readers (NVDA, JAWS, VoiceOver, TalkBack)",
              "Keyboard-only navigation",
              "Browser zoom up to 200% without loss of content or functionality",
              "High contrast display modes",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="5. Feedback & Support">
          <p>
            We welcome feedback on the accessibility of Symptom Scribe. If you encounter any barriers or have
            suggestions for improvement, please contact us:
          </p>
          <div className="mt-4 space-y-2 text-sm">
            <p>
              Email:{" "}
              <a 
                href="https://github.com/mohdmaazgani/symptom-scribe-clean/issues" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Open a GitHub Issue
              </a>
            </p>
            <p>We aim to respond to accessibility feedback within 2 business days.</p>
          </div>
        </Section>

        <Section title="6. Formal Complaints">
          <p>
            If you are not satisfied with our response to your accessibility concern, you may contact the relevant
            national or regional disability rights authority in your jurisdiction. We are committed to finding a
            constructive resolution.
          </p>
        </Section>
    </LegalPageLayout>
  );
};

export default AccessibilityPage;