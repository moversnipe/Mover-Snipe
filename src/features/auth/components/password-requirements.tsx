"use client"

import { Check, Circle } from "lucide-react"

import { PASSWORD_RULES } from "@/features/auth/schemas"
import { cn } from "@/lib/utils"

type PasswordRequirementsProps = {
  /** The password as typed so far. */
  value: string
  /** Lets the password input reference the list with `aria-describedby`. */
  id?: string
}

/**
 * Live checklist of `PASSWORD_RULES` under a new-password input. Each rule
 * flips to a check mark as soon as the value satisfies it; a polite live
 * region gives screen-reader users the running count instead of the list.
 */
export const PasswordRequirements = ({
  value,
  id,
}: PasswordRequirementsProps) => {
  const results = PASSWORD_RULES.map((rule) => ({
    ...rule,
    isMet: rule.test(value),
  }))
  const metCount = results.filter((rule) => rule.isMet).length

  return (
    <div id={id} className="flex flex-col gap-1.5 text-sm">
      <p className="sr-only" aria-live="polite">
        {metCount} of {results.length} password requirements met
      </p>
      <ul aria-label="Password requirements" className="flex flex-col gap-1">
        {results.map((rule) => (
          <li
            key={rule.id}
            data-met={rule.isMet}
            className={cn(
              "flex items-center gap-2 transition-colors",
              rule.isMet ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {rule.isMet ? (
              <Check className="size-3.5 shrink-0" aria-hidden />
            ) : (
              <Circle className="size-3.5 shrink-0" aria-hidden />
            )}
            <span>{rule.label}</span>
            <span className="sr-only">
              {rule.isMet ? "(met)" : "(not met)"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
