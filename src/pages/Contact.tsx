import { useState } from "react";
import { Mail, Github, MessageSquare, Clock, Users, HelpCircle, Send, CheckCircle2 } from "lucide-react";
import LegalPageLayout from "@/components/legal/LegalPageLayout";

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.subject || !form.message) return;
    const title = encodeURIComponent(`[${form.subject}] ${form.name}`);
    const body = encodeURIComponent(
      `**Name:** ${form.name}\n**Email:** ${form.email}\n\n**Message:**\n${form.message}`
    );
    window.open(
      `https://github.com/mohdmaazgani/symptom-scribe-clean/issues/new?title=${title}&body=${body}`,
      "_blank",
      "noopener,noreferrer"
    );
    setSubmitted(true);
  };

  return (
    <LegalPageLayout title="Contact Support" icon={MessageSquare} label="Support">

      {/* Intro */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-6">
        <p className="text-foreground text-sm leading-relaxed">
          Have a question, found a bug, or want to suggest a feature? Fill out the form below
          or reach us through GitHub. We aim to respond within 2-3 business days.
        </p>
      </div>

      {/* Contact Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: Github,
            label: "GitHub Issues",
            value: "Best for bug reports & features",
            href: "https://github.com/mohdmaazgani/symptom-scribe-clean/issues",
          },
          {
            icon: Mail,
            label: "Email Support",
            value: "support@symptomscribe.com",
            href: "mailto:support@symptomscribe.com",
          },
          {
            icon: Clock,
            label: "Response Time",
            value: "2-3 business days",
            href: null,
          },
        ].map(({ icon: Icon, label, value, href }) => (
          <div
            key={label}
            className="rounded-xl bg-card border border-border p-5 flex flex-col gap-3"
          >
            <div className="p-2 w-fit rounded-lg bg-primary/10 border border-primary/20" aria-hidden="true">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">{label}</p>
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-xs hover:underline mt-1 block"
                >
                  {value}
                </a>
              ) : (
                <p className="text-muted-foreground text-xs mt-1">{value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Contact Form */}
      <div className="rounded-xl bg-card border border-border p-6 md:p-8">
        <h2 className="text-lg font-semibold text-foreground mb-6 pb-3 border-b border-border flex items-center gap-2">
          <Send className="w-5 h-5 text-primary" aria-hidden="true" />
          Send us a Message
        </h2>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
            <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Message Submitted!</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              Your message has been opened as a GitHub Issue. Our team will respond within 2-3 business days.
            </p>
            <button
              onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
              className="text-primary text-sm hover:underline mt-2"
            >
              Send another message
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-sm font-medium text-foreground">
                  Full Name <span className="text-primary">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className="px-4 py-2.5 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address <span className="text-primary">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="px-4 py-2.5 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="subject" className="text-sm font-medium text-foreground">
                Subject <span className="text-primary">*</span>
              </label>
              <select
                id="subject"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                className="px-4 py-2.5 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">Select a topic</option>
                <option value="Bug Report">Bug Report</option>
                <option value="Feature Request">Feature Request</option>
                <option value="General Question">General Question</option>
                <option value="Account Issue">Account Issue</option>
                <option value="Privacy Concern">Privacy Concern</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="message" className="text-sm font-medium text-foreground">
                Message <span className="text-primary">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Describe your issue or question in detail..."
                rows={5}
                className="px-4 py-2.5 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!form.name || !form.email || !form.subject || !form.message}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              Send Message
            </button>

            <p className="text-xs text-muted-foreground text-center">
              Submitting will open a GitHub Issue with your message pre-filled.
            </p>
          </div>
        )}
      </div>

      {/* Emergency Note */}
      <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-5 flex gap-3">
        <HelpCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-foreground leading-relaxed">
          <strong>Medical Emergency?</strong> Do not use this form. Call your local emergency
          services immediately — <strong>112 / 911 / 999</strong>.
        </p>
      </div>

    </LegalPageLayout>
  );
};

export default Contact;
