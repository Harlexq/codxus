'use client';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Controller } from 'react-hook-form';
import useRegisterForm from '../../hooks/useRegisterForm';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import FieldRequired from '@/components/ui/fieldRequired';

const RegisterForm = () => {
  const { form, onSubmit } = useRegisterForm();

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FieldGroup>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Controller
            name="firstName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  Ad <FieldRequired />
                </FieldLabel>
                <Input
                  {...field}
                  type="text"
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  autoComplete="given-name"
                  placeholder="Adınızı giriniz."
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="lastName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  Soyad <FieldRequired />
                </FieldLabel>
                <Input
                  {...field}
                  type="text"
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  autoComplete="family-name"
                  placeholder="Soyadınızı giriniz."
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
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
                autoComplete="new-password"
                placeholder="Şifrenizi giriniz."
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="confirmPassword"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>
                Şifre Onaylama <FieldRequired />
              </FieldLabel>
              <Input
                {...field}
                type="password"
                id={field.name}
                aria-invalid={fieldState.invalid}
                autoComplete="new-password"
                placeholder="Şifrenizi tekrar giriniz."
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="roleType"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>
                Rolünüz <FieldRequired required={false} />
              </FieldLabel>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Rol Seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="developer">Yazılım Geliştirici</SelectItem>
                    <SelectItem value="designer">UI/UX Tasarımcısı</SelectItem>
                    <SelectItem value="project-manager">Proje Yöneticisi</SelectItem>
                    <SelectItem value="founder">Kurucu</SelectItem>
                    <SelectItem value="freelancer">Serbest Çalışan</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <Button type="submit" className="w-full">
        Kayıt Ol
      </Button>
    </form>
  );
};

export default RegisterForm;
