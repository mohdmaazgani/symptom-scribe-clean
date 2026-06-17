import { z } from "zod";

// ─── Auth ────────────────────────────────────────────────────────────────────
export const signInSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export type SignInFormValues = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type SignUpFormValues = z.infer<typeof signUpSchema>;

// ─── Health Metrics ───────────────────────────────────────────────────────────
export const heartRateSchema = z.object({
  value: z.coerce
    .number({ invalid_type_error: "Enter a number" })
    .min(30, "Heart Rate must be at least 30 BPM")
    .max(250, "Heart Rate cannot exceed 250 BPM"),
  notes: z.string().max(200, "Notes cannot exceed 200 characters").optional(),
});

export const temperatureSchema = z.object({
  value: z.coerce
    .number({ invalid_type_error: "Enter a number" })
    .min(86, "Temperature must be at least 86°F")
    .max(113, "Temperature cannot exceed 113°F"),
  notes: z.string().max(200, "Notes cannot exceed 200 characters").optional(),
});

export const weightSchema = z.object({
  value: z.coerce
    .number({ invalid_type_error: "Enter a number" })
    .positive("Weight must be a positive number")
    .max(500, "Weight cannot exceed 500 lbs"),
  notes: z.string().max(200, "Notes cannot exceed 200 characters").optional(),
});

export const bloodSugarSchema = z.object({
  value: z.coerce
    .number({ invalid_type_error: "Enter a number" })
    .min(20, "Blood Sugar must be at least 20 mg/dL")
    .max(1000, "Blood Sugar cannot exceed 1000 mg/dL"),
  notes: z.string().max(200, "Notes cannot exceed 200 characters").optional(),
});

export const oxygenSaturationSchema = z.object({
  value: z.coerce
    .number({ invalid_type_error: "Enter a number" })
    .min(70, "Oxygen Saturation must be at least 70%")
    .max(100, "Oxygen Saturation cannot exceed 100%"),
  notes: z.string().max(200, "Notes cannot exceed 200 characters").optional(),
});

export const bloodPressureSchema = z.object({
  systolic: z.coerce
    .number({ invalid_type_error: "Enter a number" })
    .min(50, "Systolic must be at least 50 mmHg")
    .max(300, "Systolic cannot exceed 300 mmHg"),
  diastolic: z.coerce
    .number({ invalid_type_error: "Enter a number" })
    .min(30, "Diastolic must be at least 30 mmHg")
    .max(200, "Diastolic cannot exceed 200 mmHg"),
  notes: z.string().max(200, "Notes cannot exceed 200 characters").optional(),
});

export type BloodPressureFormValues = z.infer<typeof bloodPressureSchema>;
export type SingleValueMetricFormValues = { value: string; notes?: string };

// ─── Profile ─────────────────────────────────────────────────────────────────
export const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(80, "Full name cannot exceed 80 characters"),
  age: z.coerce
    .number({ invalid_type_error: "Enter a valid age" })
    .int("Age must be a whole number")
    .min(1, "Age must be at least 1")
    .max(130, "Age cannot exceed 130")
    .optional()
    .or(z.literal("")),
  height: z.coerce
    .number({ invalid_type_error: "Enter a valid height" })
    .positive("Height must be positive")
    .max(300, "Height cannot exceed 300 cm")
    .optional()
    .or(z.literal("")),
  weight: z.coerce
    .number({ invalid_type_error: "Enter a valid weight" })
    .positive("Weight must be positive")
    .max(500, "Weight cannot exceed 500 kg")
    .optional()
    .or(z.literal("")),
  medicalConditions: z
    .string()
    .max(500, "Medical conditions text cannot exceed 500 characters")
    .optional(),
  allergies: z
    .string()
    .max(300, "Allergies text cannot exceed 300 characters")
    .optional(),
  medications: z
    .string()
    .max(300, "Medications text cannot exceed 300 characters")
    .optional(),
});
export type ProfileFormValues = z.infer<typeof profileSchema>;

// ─── Change Password (Settings) ───────────────────────────────────────────────
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .regex(/[A-Z]/, "New password must contain at least one uppercase letter")
      .regex(/[0-9]/, "New password must contain at least one number"),
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

// ─── Contact ─────────────────────────────────────────────────────────────────
export const contactSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name cannot exceed 80 characters"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  subject: z
    .string()
    .min(3, "Subject must be at least 3 characters")
    .max(120, "Subject cannot exceed 120 characters"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message cannot exceed 2000 characters"),
});
export type ContactFormValues = z.infer<typeof contactSchema>;
