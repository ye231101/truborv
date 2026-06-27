import { z } from 'zod';

export type CollectField = 'name' | 'email' | 'phone' | 'callTime';

export const COLLECT_ORDER: CollectField[] = ['name', 'email', 'phone'];
export const LIABILITY_COLLECT_ORDER: CollectField[] = ['name', 'phone', 'callTime'];

export const contactIntakeSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name.').max(120),
  email: z
    .string()
    .trim()
    .max(254)
    .refine(
      (v) => v === '' || z.string().email().safeParse(v).success,
      'Please enter a valid email address.',
    ),
  phone: z
    .string()
    .trim()
    .refine(
      (v) => v === '' || v.replace(/\D/g, '').length >= 10,
      'Please enter a valid phone number.',
    ),
  callTime: z
    .string()
    .trim()
    .max(120)
    .refine((v) => v === '' || v.length >= 2, 'Please share a good time for a call.'),
});

export type ContactIntakeForm = z.infer<typeof contactIntakeSchema>;

export type ContactLead = {
  name: string;
  email: string;
  phone: string;
  callTime?: string;
};

export function nextCollectPrompt(
  field: CollectField,
  name: string,
  options?: { liability?: boolean },
): {
  role: 'bot';
  field: CollectField;
  prompt: string;
  cardLabel: string;
  placeholder: string;
} {
  const liability = options?.liability ?? false;

  switch (field) {
    case 'phone':
      return {
        role: 'bot',
        field: 'phone',
        prompt: liability ? 'Thanks!' : "We'll send updates to that address.",
        cardLabel: 'Best number to reach you',
        placeholder: 'Please enter your phone number',
      };
    case 'callTime':
      return {
        role: 'bot',
        field: 'callTime',
        prompt: 'Got it.',
        cardLabel: 'What time works for a call?',
        placeholder: 'e.g. weekday mornings, after 5pm',
      };
    case 'email':
      return {
        role: 'bot',
        field: 'email',
        prompt: `Nice to meet you, ${name.split(' ')[0]}!`,
        cardLabel: 'Get notified by email',
        placeholder: 'Please enter your email',
      };
    default:
      return {
        role: 'bot',
        field: 'name',
        prompt: liability ? 'To get you an accurate answer:' : 'Give the team a way to reach you.',
        cardLabel: "What's your name?",
        placeholder: 'Please enter your name',
      };
  }
}

export const SPECIALIST_CONTACT_COMPLETE_MESSAGE =
  "Thanks! We'll have a specialist reach out as soon as one is available. Feel free to keep asking me anything in the meantime.";

export const LIABILITY_CONTACT_COMPLETE_MESSAGE =
  "Thanks! A specialist will verify this on the exact unit and follow up at the time you shared. Feel free to keep browsing in the meantime.";
