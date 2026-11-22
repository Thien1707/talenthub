import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email")
    .email("Email không hợp lệ"),
  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu")
    .min(8, "Mật khẩu tối thiểu 8 ký tự"),
});

export const registerStudentSchema = loginSchema.extend({
  fullName: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập họ tên")
    .min(2, "Họ tên tối thiểu 2 ký tự"),
  phone: z.string().optional(),
});

export const registerCompanySchema = registerStudentSchema.extend({
  companyName: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên công ty")
    .min(2, "Tên công ty tối thiểu 2 ký tự"),
});

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterStudentForm = z.infer<typeof registerStudentSchema>;
export type RegisterCompanyForm = z.infer<typeof registerCompanySchema>;
