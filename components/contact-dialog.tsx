'use client';

import { useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Lock, Mail, MessageSquare, Phone, Shield, Tag, User, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { cn, unitThumbnailSrc } from '@/lib/utils';
import { type InventoryUnit } from '@/lib/types';

const MESSAGE_MAX = 300;

const inquirySchema = z.object({
  name: z.string().min(1, 'Enter your name').max(120),
  email: z.string().email('Enter a valid email').max(254),
  phone: z.string().max(40).optional(),
  message: z.string().max(MESSAGE_MAX, `Max ${MESSAGE_MAX} characters`).optional(),
});

type InquiryForm = z.infer<typeof inquirySchema>;

type ContactDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit?: InventoryUnit;
};

export function ContactDialog({ open, onOpenChange, unit }: ContactDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InquiryForm>({
    resolver: zodResolver(inquirySchema),
    defaultValues: { name: '', email: '', phone: '', message: '' },
  });

  const messageValue = watch('message') ?? '';
  const messageLen = messageValue.length;

  const onSubmit = async (data: InquiryForm) => {
    setSubmitError(null);
    try {
      const payload: { name: string; email: string; phone?: string; message?: string } = {
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone?.trim() ?? undefined,
        message: data.message?.trim() ?? undefined,
      };
      await api.post('contact', payload);
      reset({ name: '', email: '', phone: '', message: '' });
      onOpenChange(false);
      toast.success('Thanks! We received your inquiry and will be in touch soon.');
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="h-full w-full gap-0 overflow-y-auto rounded-xl border-neutral-200 p-0 shadow-xl sm:h-[90vh] sm:max-h-[90vh] sm:max-w-xl"
      >
        <DialogHeader className="border-b border-neutral-200 p-4">
          <DialogTitle className="text-foreground text-xl leading-tight font-bold tracking-tight md:text-2xl">
            Get Your Best Price
          </DialogTitle>
          <p className="text-primary text-sm font-medium">It's fast, easy & no obligation.</p>
          <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
            Tell us a little about yourself and we'll send you{' '}
            <span className="text-foreground font-semibold">our best available price and availability.</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
          <div className="space-y-5 p-4">
            {unit && (
              <div className="flex gap-3 rounded-lg border border-neutral-200 bg-neutral-50/80 p-3">
                <div className="bg-muted relative h-auto w-24 shrink-0 overflow-hidden rounded-md border border-neutral-200">
                  <Image
                    src={unitThumbnailSrc(unit)}
                    alt={unit.title}
                    fill
                    className="object-cover"
                    sizes="96px"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-foreground text-sm font-semibold">{unit.title}</p>
                  <p className="text-muted-foreground text-xs">
                    <span className="block">Stock# {unit.stockNumber}</span>
                    <span className="block">{unit.location}</span>
                  </p>
                </div>
              </div>
            )}

            <div className="divide-border grid grid-cols-1 divide-y rounded-lg border border-neutral-200 bg-neutral-50/80 md:grid-cols-3 md:divide-x md:divide-y-0">
              {[
                {
                  label: 'Best Prices',
                  description: 'Every Day',
                  Icon: Tag,
                },
                {
                  label: 'Fast Response',
                  description: 'Typically within minutes',
                  Icon: Zap,
                },
                {
                  label: 'No Obligation',
                  description: "You're in control",
                  Icon: Shield,
                },
              ].map(({ label, description, Icon }) => (
                <div key={label} className="flex items-center gap-2 p-2">
                  <Icon className="text-primary size-5 shrink-0" strokeWidth={2} aria-hidden />
                  <div className="min-w-0 text-left">
                    <p className="text-foreground text-sm font-semibold">{label}</p>
                    <p className="text-muted-foreground text-xs">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="inquiry-name" className="text-foreground flex items-center gap-2 text-sm font-medium">
                  <User className="text-muted-foreground size-4 shrink-0" aria-hidden />
                  Full Name
                </Label>
                <Input
                  id="inquiry-name"
                  autoComplete="name"
                  placeholder="e.g. John Smith"
                  aria-invalid={!!errors.name}
                  className={cn('border-neutral-200 bg-white', errors.name && 'border-destructive')}
                  {...register('name')}
                />
                {errors.name ? <p className="text-destructive text-sm">{errors.name.message}</p> : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inquiry-email" className="text-foreground flex items-center gap-2 text-sm font-medium">
                  <Mail className="text-muted-foreground size-4 shrink-0" aria-hidden />
                  Email
                </Label>
                <Input
                  id="inquiry-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@email.com"
                  aria-invalid={!!errors.email}
                  className={cn('border-neutral-200 bg-white', errors.email && 'border-destructive')}
                  {...register('email')}
                />
                <p className="text-muted-foreground text-xs">We&apos;ll email you our best price and details.</p>
                {errors.email ? <p className="text-destructive text-sm">{errors.email.message}</p> : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inquiry-phone" className="text-foreground flex items-center gap-2 text-sm font-medium">
                  <Phone className="text-muted-foreground size-4 shrink-0" aria-hidden />
                  Phone (optional)
                </Label>
                <Input
                  id="inquiry-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="(555) 123-4567"
                  aria-invalid={!!errors.phone}
                  className={cn('border-neutral-200 bg-white', errors.phone && 'border-destructive')}
                  {...register('phone')}
                />
                <p className="text-muted-foreground text-xs">Optional, but helps us respond faster.</p>
                {errors.phone ? <p className="text-destructive text-sm">{errors.phone.message}</p> : null}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="inquiry-message"
                  className="text-foreground flex items-center gap-2 text-sm font-medium"
                >
                  <MessageSquare className="text-muted-foreground size-4 shrink-0" aria-hidden />
                  What can we help you with? (Optional)
                </Label>
                <div className="relative">
                  <Textarea
                    id="inquiry-message"
                    rows={4}
                    maxLength={MESSAGE_MAX}
                    placeholder="Trade-in, financing, questions, preferred contact time, etc."
                    aria-invalid={!!errors.message}
                    className={cn(
                      'max-h-[10lh] min-h-[4.5lh] resize-y overflow-y-auto border-neutral-200 bg-white pb-7',
                      errors.message && 'border-destructive',
                    )}
                    {...register('message')}
                  />
                  <span className="text-muted-foreground pointer-events-none absolute right-3 bottom-2 text-xs tabular-nums">
                    {messageLen}/{MESSAGE_MAX}
                  </span>
                </div>
                {errors.message ? <p className="text-destructive text-sm">{errors.message.message}</p> : null}
              </div>
            </div>
          </div>

          <div className="border-border bg-muted/30 space-y-4 border-t p-4">
            {submitError ? <p className="text-destructive text-center text-sm">{submitError}</p> : null}
            <p className="text-muted-foreground flex items-center justify-center gap-1.5 text-xs">
              <Lock className="size-3.5 shrink-0" aria-hidden />
              Your information is safe and secure.
            </p>
            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={isSubmitting} size="lg" className="w-full cursor-pointer font-semibold">
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Get My Best Price'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => onOpenChange(false)}
                className="text-foreground hover:text-foreground w-full cursor-pointer border-neutral-300 bg-white font-medium shadow-none hover:bg-neutral-100"
              >
                No thanks, I&apos;ll pass
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
