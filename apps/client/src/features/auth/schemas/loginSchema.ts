import z from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .nonempty({ message: 'E-posta adresi zorunludur.' })
    .email({ message: 'Geçerli bir e-posta adresi giriniz.' }),
  password: z.string().nonempty({ message: 'Şifre alanı zorunludur.' }),
});

export type LoginSchema = z.infer<typeof loginSchema>;
