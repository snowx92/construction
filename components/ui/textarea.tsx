import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[80px] w-full px-3.5 py-2.5 text-sm",
      "bg-surface border border-black/[0.06] rounded-[var(--radius-sm)]",
      "text-foreground placeholder:text-foreground-subtle",
      "outline-none transition-all duration-500 ease-out",
      "focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "resize-none",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
