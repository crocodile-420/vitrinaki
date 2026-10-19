'use client';

import { useTranslator } from "@/lib/i18n/client"
import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { ClientError } from '@mercurjs/client';
import Link from 'next/link';
import { FieldError, FormProvider, useForm, useFormContext } from 'react-hook-form';

import { Button } from '@/components/atoms';
import { LabeledInput } from '@/components/cells';
import { sendResetPasswordEmail } from '@/lib/data/customer';
import { toast } from '@/lib/helpers/toast';

import { ForgotPasswordFormData, forgotPasswordSchema } from './schema';

export const ForgotPasswordForm = () => {
  const methods = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ''
    }
  });

  return (
    <FormProvider {...methods}>
      <Form />
    </FormProvider>
  );
};

const Form = () => {
  const { tr } = useTranslator();
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
    reset
  } = useFormContext<ForgotPasswordFormData>();

  const submit = async (data: ForgotPasswordFormData) => {
    if (!data.email) return;

    const result = await sendResetPasswordEmail(data.email);

    if (!result.success) {
      toast.error({ title: tr(result.error || 'Κάτι πήγε στραβά. Δοκίμασε ξανά.') });
      return;
    }

    reset({ email: '' });

    toast.success({
      title: `${tr('Το αίτημα επαναφοράς κωδικού στάλθηκε. Αν υπάρχει λογαριασμός για το')} ${data.email}, ${tr('θα λάβεις email με σύνδεσμο επαναφοράς. Έλεγξε τα εισερχόμενα και τα ανεπιθύμητα — ο σύνδεσμος ισχύει για μία ώρα.')}`
    });
  };

  return (
    <div
      className="mx-auto mt-6 w-full max-w-xl space-y-4 rounded-sm border p-4"
      data-testid="forgot-password-form-container"
    >
      <h1 className="heading-md my-0 mb-2 uppercase text-primary">{tr("Ξέχασες τον κωδικό σου;")}</h1>
      <p className="text-md">
        {tr("Γράψε το email με το οποίο εγγράφηκες και θα σου στείλουμε email για να ορίσεις νέο κωδικό.")}
      </p>
      <form
        onSubmit={handleSubmit(submit)}
        data-testid="forgot-password-form"
      >
        <div className="space-y-4">
          <LabeledInput
            label={tr("Email")}
            placeholder={tr("Η διεύθυνση email σου")}
            error={errors.email as FieldError}
            data-testid="forgot-password-email-input"
            {...register('email')}
          />
        </div>

        <div className="mt-8 space-y-4">
          <Button
            className="w-full uppercase"
            disabled={isSubmitting}
            data-testid="forgot-password-submit-button"
          >
            {tr("Επαναφορά κωδικού")}
          </Button>

          <Link
            href="/user"
            className="flex"
            data-testid="forgot-password-back-to-login-link"
          >
            <Button
              variant="tonal"
              className="flex w-full justify-center uppercase"
            >
              {tr("Πίσω στη σύνδεση")}
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
};
