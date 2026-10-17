import { PasswordInput } from "@/components/auth/PasswordInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AuthFieldProps {
  name: string;
  label: string;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  error?: string;
}

export function AuthField({
  name,
  label,
  type = "text",
  autoComplete,
  error,
}: AuthFieldProps) {
  const errorId = `${name}-error`;
  const inputProps = {
    id: name,
    name,
    autoComplete,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      {type === "password" ? (
        <PasswordInput {...inputProps} className="h-9 pr-10" />
      ) : (
        <Input {...inputProps} type={type} className="h-9" />
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
