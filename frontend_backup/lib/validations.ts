import { z } from 'zod';

// Turkce hata mesajlari
const msg = {
  required: 'Bu alan zorunludur',
  minLength: (min: number) => `En az ${min} karakter olmalidir`,
  maxLength: (max: number) => `En fazla ${max} karakter olmalidir`,
  email: 'Gecerli bir e-posta adresi giriniz',
  phone: 'Gecerli bir telefon numarasi giriniz',
  uuid: 'Gecersiz ID formati',
};

// Yolcu validation semasi
export const passengerSchema = z.object({
  firstName: z
    .string({ message: msg.required })
    .min(2, msg.minLength(2))
    .max(50, msg.maxLength(50)),
  lastName: z
    .string({ message: msg.required })
    .min(2, msg.minLength(2))
    .max(50, msg.maxLength(50)),
  phone: z
    .string()
    .regex(/^[\d\s\-\+\(\)]*$/, msg.phone)
    .optional()
    .or(z.literal('')),
  passportNo: z
    .string()
    .max(20, msg.maxLength(20))
    .optional()
    .or(z.literal('')),
  nationality: z.string().default('TR'),
  gender: z.enum(['MALE', 'FEMALE']).default('MALE'),
  groupId: z.string().uuid(msg.uuid).optional().or(z.literal('')),
});

// Yolcu guncelleme semasi (parcali)
export const passengerUpdateSchema = passengerSchema.partial();

// E-posta validation semasi
export const emailSchema = z.object({
  address: z
    .string({ message: msg.required })
    .email(msg.email),
  isActive: z.boolean().default(true),
});

// E-posta olusturma semasi
export const emailCreateSchema = z.object({
  passengerId: z.string().uuid(msg.uuid),
  customUsername: z
    .string()
    .min(3, msg.minLength(3))
    .max(30, msg.maxLength(30))
    .regex(/^[a-zA-Z0-9._-]+$/, 'Sadece harf, rakam, nokta, tire ve alt cizgi kullanilanilir')
    .optional(),
});

// Grup validation semasi
export const groupSchema = z.object({
  name: z
    .string({ message: msg.required })
    .min(2, msg.minLength(2))
    .max(100, msg.maxLength(100)),
  description: z
    .string()
    .max(500, msg.maxLength(500))
    .optional()
    .or(z.literal('')),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Gecerli bir tarih giriniz (YYYY-MM-DD)')
    .optional()
    .or(z.literal('')),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Gecerli bir tarih giriniz (YYYY-MM-DD)')
    .optional()
    .or(z.literal('')),
});

// Grup guncelleme semasi
export const groupUpdateSchema = groupSchema.partial();

// Login validation semasi
export const loginSchema = z.object({
  email: z
    .string({ message: msg.required })
    .email(msg.email),
  password: z
    .string({ message: msg.required })
    .min(6, msg.minLength(6)),
});

// Sifre degistirme semasi
export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ message: msg.required })
    .min(6, msg.minLength(6)),
  newPassword: z
    .string({ message: msg.required })
    .min(6, msg.minLength(6)),
  confirmPassword: z
    .string({ message: msg.required })
    .min(6, msg.minLength(6)),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Sifreler eslesmeli',
  path: ['confirmPassword'],
});

// Profil guncelleme semasi
export const profileUpdateSchema = z.object({
  name: z
    .string({ message: msg.required })
    .min(2, msg.minLength(2))
    .max(100, msg.maxLength(100)),
});

// Type exports
export type PassengerInput = z.infer<typeof passengerSchema>;
export type PassengerUpdateInput = z.infer<typeof passengerUpdateSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
export type EmailCreateInput = z.infer<typeof emailCreateSchema>;
export type GroupInput = z.infer<typeof groupSchema>;
export type GroupUpdateInput = z.infer<typeof groupUpdateSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// Validation helper function
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  });

  return { success: false, errors };
}
