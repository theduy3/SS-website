import { NextResponse } from "next/server";
import { z } from "zod";

// Inferred contract for the original Squarespace contact form, rebuilt as a
// Next.js Route Handler. This is a STUB: it validates and accepts the submission.
// Wire to a real email/CRM provider (e.g. Resend) where noted below.
const ContactSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.email("A valid email is required"),
  message: z.string().trim().min(1, "Message is required"),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Validation failed";
    return NextResponse.json({ success: false, error: message }, { status: 422 });
  }

  // TODO(production): forward parsed.data to an email/CRM provider here.
  // e.g. await resend.emails.send({ to: site.contact.email, ... })

  return NextResponse.json({ success: true, data: { received: true } });
}
