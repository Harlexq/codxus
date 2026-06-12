import z from 'zod';

export const registerSchema = z.object({
  firstName: z.string().nonempty({ message: 'Ad alanı zorunludur.' }),
  lastName: z.string().nonempty({ message: 'Soyad alanı zorunludur.' }),
  email: z
    .string()
    .nonempty({ message: 'E-posta adresi zorunludur.' })
    .email({ message: 'Geçerli bir e-posta adresi giriniz.' }),
  password: z.string().nonempty({ message: 'Şifre alanı zorunludur.' }),
  confirmPassword: z.string().nonempty({ message: 'Şifre alanı zorunludur.' }),
  roleType: z.string().optional(),
});

export type RegisterSchema = z.infer<typeof registerSchema>;
