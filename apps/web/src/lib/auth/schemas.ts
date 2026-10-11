import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
});

export const registerStudentSchema = loginSchema.extend({
  fullName: z.string().min(2, "Nhập họ tên"),
  phone: z.string().optional(),
});

export const registerCompanySchema = registerStudentSchema.extend({
  companyName: z.string().min(2, "Nhập tên công ty"),
});

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterStudentForm = z.infer<typeof registerStudentSchema>;
export type RegisterCompanyForm = z.infer<typeof registerCompanySchema>;
