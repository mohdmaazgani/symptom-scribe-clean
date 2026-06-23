import { useState } from "react";
import { Mail, MessageSquare, Phone, CheckCircle } from "lucide-react";

type ContactForm = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

type ContactFormErrors = Partial<Record<keyof ContactForm, string>>;

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<ContactForm>({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<ContactFormErrors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors((currentErrors) => ({ ...currentErrors, [name]: undefined }));
  };

  const validateForm = () => {
    const nextErrors: ContactFormErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.name.trim()) {
      nextErrors.name = "Name is required.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!emailPattern.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.subject) {
      nextErrors.subject = "Please select a topic.";
    }

    if (!form.message.trim()) {
      nextErrors.message = "Message is required.";
    } else if (form.message.trim().length < 10) {
      nextErrors.message = "Message must be at least 10 characters.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitted(true);
  };

  const resetForm = () => {
    setSubmitted(false);
    setForm({ name: "", email: "", subject: "", message: "" });
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-16 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <MessageSquare className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold mb-3">Contact Support</h1>
          <p className="text-muted-foreground text-lg">Have a question or need help? We're here for you.</p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-14 grid md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <h2 className="text-2xl font-semibold">Get in Touch</h2>
          <p className="text-muted-foreground">
            Whether you have a bug report, a feature request, or just need help using Symptom Scribe — our support team will get back to you within 24 hours.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Email Support</p>
                <p className="text-muted-foreground text-sm">support@symptomscribe.com</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Response Time</p>
                <p className="text-muted-foreground text-sm">Within 24 hours on weekdays</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-8">
          {submitted ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-8">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <h3 className="text-xl font-semibold">Message Sent!</h3>
              <p className="text-muted-foreground text-sm">Thanks for reaching out. We'll get back to you within 24 hours.</p>
              <button
                type="button"
                onClick={resetForm}
                className="mt-2 text-sm text-primary hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <h3 className="text-lg font-semibold">Send us a message</h3>
              <div>
                <label htmlFor="contact-name" className="text-sm font-medium block mb-1">Name</label>
                <input id="contact-name" name="name" value={form.name} onChange={handleChange} placeholder="Your full name"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "contact-name-error" : undefined}
                  className="w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                {errors.name && <p id="contact-name-error" className="mt-1 text-sm text-destructive">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="contact-email" className="text-sm font-medium block mb-1">Email</label>
                <input id="contact-email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "contact-email-error" : undefined}
                  className="w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                {errors.email && <p id="contact-email-error" className="mt-1 text-sm text-destructive">{errors.email}</p>}
              </div>
              <div>
                <label htmlFor="contact-subject" className="text-sm font-medium block mb-1">Subject</label>
                <select id="contact-subject" name="subject" value={form.subject} onChange={handleChange}
                  aria-invalid={Boolean(errors.subject)}
                  aria-describedby={errors.subject ? "contact-subject-error" : undefined}
                  className="w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Select a topic</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="account">Account Issue</option>
                  <option value="other">Other</option>
                </select>
                {errors.subject && <p id="contact-subject-error" className="mt-1 text-sm text-destructive">{errors.subject}</p>}
              </div>
              <div>
                <label htmlFor="contact-message" className="text-sm font-medium block mb-1">Message</label>
                <textarea id="contact-message" name="message" value={form.message} onChange={handleChange} rows={4}
                  placeholder="Describe your issue or question..."
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? "contact-message-error" : undefined}
                  className="w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                {errors.message && <p id="contact-message-error" className="mt-1 text-sm text-destructive">{errors.message}</p>}
              </div>
              <button type="submit"
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                Send Message
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

export default Contact;
