"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, "type">;

export function PasswordInput(props: PasswordInputProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="relative">
      <Input {...props} type={revealed ? "text" : "password"} />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
        aria-label={revealed ? "Hide password" : "Show password"}
        onClick={() => setRevealed((value) => !value)}
      >
        {revealed ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  );
}
