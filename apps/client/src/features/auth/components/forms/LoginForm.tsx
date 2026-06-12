'use client';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Controller } from 'react-hook-form';
import useLoginForm from '../../hooks/useLoginForm';
import { Button } from '@/components/ui/button';
import FieldRequired from '@/components/ui/fieldRequired';

const LoginForm = () => {
  const { form, onSubmit } = useLoginForm();

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FieldGroup>
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>
                E-Posta <FieldRequired />
              </FieldLabel>
              <Input
                {...field}
                type="email"
                id={field.name}
                aria-invalid={fieldState.invalid}
                autoComplete="email"
                placeholder="E-posta adresinizi giriniz."
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>
                Şifre <FieldRequired />
              </FieldLabel>
              <Input
                {...field}
                type="password"
                id={field.name}
                aria-invalid={fieldState.invalid}
                autoComplete="current-password"
                placeholder="Şifrenizi giriniz."
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <Button type="submit" className="w-full">
        Giriş Yap
      </Button>
    </form>
  );
};

export default LoginForm;
