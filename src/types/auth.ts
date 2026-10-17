export type AuthFieldName = "name" | "email" | "password" | "confirmPassword";

export type FieldErrors = Partial<Record<AuthFieldName, string[]>>;
