import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const MessageSchema = z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z
        .string()
        .min(1, "Message content cannot be empty")
        .max(2000, "Message content exceeds limit"),
});

export const RequestSchema = z.union([
  z.object({
    mode: z.literal("chat").optional(),
    messages: z
      .array(MessageSchema)
      .min(1, "At least one message is required")
      .max(20, "Too many messages provided"),
  }),
  z.object({
    mode: z.literal("predict"),
    symptoms: z
      .array(z.string())
      .max(50, "Too many symptoms provided"),
  }),
]);

export type RequestBody = z.infer<typeof RequestSchema>;
