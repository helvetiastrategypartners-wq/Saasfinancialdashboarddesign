import { PASSWORD_RULES } from "../passwordRules";

interface PasswordRulePillsProps {
  issues: string[];
}

export function PasswordRulePills({ issues }: PasswordRulePillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PASSWORD_RULES.map((rule) => {
        const valid = !issues.includes(rule);
        return (
          <span key={rule} className={`rounded-md px-2 py-1 text-xs ${valid ? "bg-emerald-500/12 text-emerald-400" : "bg-white/5 text-muted-foreground"}`}>
            {rule}
          </span>
        );
      })}
    </div>
  );
}

