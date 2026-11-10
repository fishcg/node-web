import { z } from "zod";

/** Trimmed username: letters (any language), numbers, underscore or hyphen. */
const usernameSchema = z
  .string()
  .trim()
  .min(2, "用户名至少 2 个字符")
  .max(20, "用户名最多 20 个字符")
  .regex(/^[\p{L}\p{N}_-]+$/u, "用户名只能包含文字、数字、下划线或短横线");

const passwordSchema = z
  .string()
  .min(8, "密码至少 8 位")
  .max(72, "密码最多 72 位");

export const loginSchema = z.object({
  username: z.string().trim().min(1, "请输入用户名").max(32, "用户名过长"),
  password: z.string().min(1, "请输入密码").max(72, "密码过长"),
});

export const registerSchema = z
  .object({
    username: usernameSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "请再次输入密码"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export const soundIdSchema = z.number().int().positive();
