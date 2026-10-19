'use client';

import { useTranslator } from "@/lib/i18n/client"
import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FieldError, FieldValues, FormProvider, useForm, useFormContext } from 'react-hook-form';

import { Button } from '@/components/atoms';
import { Alert } from '@/components/atoms/Alert/Alert';
import { LabeledInput } from '@/components/cells';
import { login, transferCart } from '@/lib/data/customer';
import { toast } from '@/lib/helpers/toast';

import { LoginFormData, loginFormSchema } from './schema';

export const LoginForm = () => {
  const methods = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: ''
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
  const [isAuthError, setIsAuthError] = useState(false);
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting }
  } = useFormContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSessionExpired = searchParams.get('sessionExpired') === 'true';
  const isSessionRequired = searchParams.get('sessionRequired') === 'true';

  const submit = async (data: FieldValues) => {
    const formData = new FormData();
    formData.append('email', data.email);
    formData.append('password', data.password);

    const res = await login(formData);

    if (res.success) {
      router.push('/user');
      await transferCart();
    } else {
      toast.error({ title: tr(res.message || 'Κάτι πήγε στραβά. Δοκίμασε ξανά.') });
    }

    setIsAuthError(false);
    router.push('/user');
  };

  const clearApiError = () => {
    isAuthError && setIsAuthError(false);
  };

  const getAuthMessage = () => {
    if (isSessionExpired) {
      return tr('Η σύνδεσή σου έληξε. Συνδέσου ξανά για να συνεχίσεις.');
    }
    if (isSessionRequired) {
      return tr('Συνδέσου για να συνεχίσεις.');
    }
    return null;
  };

  const authMessage = getAuthMessage();

  return (
    <main
      className="container"
      data-testid="login-page"
    >
      <div className="mx-auto mt-6 w-full max-w-xl space-y-4">
        {authMessage && (
          <Alert
            title={authMessage}
            className="w-full"
            icon
            data-testid="login-auth-alert"
          />
        )}
        <div
          className="rounded-sm border p-4"
          data-testid="login-form-container"
        >
          <h1 className="heading-md mb-8 uppercase text-primary">{tr("Σύνδεση")}</h1>
          <form
            onSubmit={handleSubmit(submit)}
            data-testid="login-form"
          >
            <div className="space-y-4">
              <LabeledInput
                label={tr("Email")}
                placeholder={tr("Η διεύθυνση email σου")}
                error={
                  (errors.email as FieldError) ||
                  (isAuthError ? ({ message: '' } as FieldError) : undefined)
                }
                data-testid="login-email-input"
                {...register('email', {
                  onChange: clearApiError
                })}
              />
              <LabeledInput
                label={tr("Κωδικός")}
                placeholder={tr("Ο κωδικός σου")}
                type="password"
                error={
                  (errors.password as FieldError) ||
                  (isAuthError ? ({ message: '' } as FieldError) : undefined)
                }
                data-testid="login-password-input"
                {...register('password', {
                  onChange: clearApiError
                })}
              />
            </div>

            <Link
              href="/forgot-password"
              className="label-md mt-4 block text-right uppercase text-action-on-secondary"
              data-testid="login-forgot-password-link"
            >
              {tr("Ξέχασες τον κωδικό σου;")}
            </Link>

            <Button
              className="mt-8 w-full uppercase"
              disabled={isSubmitting}
              data-testid="login-submit-button"
            >
              {tr("Σύνδεση")}
            </Button>
          </form>
        </div>

        <div className="rounded-sm border p-4">
          <h2 className="heading-md mb-4 uppercase text-primary">
            {tr("Δεν έχεις ακόμη λογαριασμό;")}
          </h2>
          <Link
            href="/register"
            data-testid="login-register-link"
          >
            <Button
              variant="tonal"
              className="mt-8 flex w-full justify-center uppercase"
            >
              {tr("Δημιουργία λογαριασμού")}
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
};
