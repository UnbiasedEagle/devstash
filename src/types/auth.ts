type AuthFieldName =
  | "name"
  | "email"
  | "password"
  | "confirmPassword"
  | "currentPassword"
  | "newPassword";

export type FieldErrors = Partial<Record<AuthFieldName, string[]>>;
