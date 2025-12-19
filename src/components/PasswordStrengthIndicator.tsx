import { useMemo } from "react";
import { Check, X } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "" };

    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };

    if (checks.length) score++;
    if (checks.lowercase) score++;
    if (checks.uppercase) score++;
    if (checks.number) score++;
    if (checks.special) score++;

    if (score <= 2) return { score, label: "Weak", color: "bg-destructive" };
    if (score <= 3) return { score, label: "Fair", color: "bg-yellow-500" };
    if (score <= 4) return { score, label: "Good", color: "bg-primary" };
    return { score, label: "Strong", color: "bg-green-500" };
  }, [password]);

  const requirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Lowercase letter", met: /[a-z]/.test(password) },
    { label: "Uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Number", met: /[0-9]/.test(password) },
    { label: "Special character", met: /[^A-Za-z0-9]/.test(password) },
  ];

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span className={`font-medium ${
            strength.label === "Weak" ? "text-destructive" :
            strength.label === "Fair" ? "text-yellow-500" :
            strength.label === "Good" ? "text-primary" : "text-green-500"
          }`}>
            {strength.label}
          </span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strength.color}`}
            style={{ width: `${(strength.score / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
        {requirements.map((req) => (
          <div
            key={req.label}
            className={`flex items-center gap-1 text-[11px] ${
              req.met ? "text-green-500" : "text-muted-foreground"
            }`}
          >
            {req.met ? (
              <Check className="h-3 w-3 flex-shrink-0" />
            ) : (
              <X className="h-3 w-3 flex-shrink-0" />
            )}
            <span className="truncate">{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
