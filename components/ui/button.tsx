import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium cursor-pointer select-none outline-none transition-all duration-500 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-primary-hover active:bg-primary-active hover:scale-[1.02]",
        dark:
          "bg-foreground text-background shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:opacity-90 hover:scale-[1.02]",
        glass:
          "bg-white/72 text-foreground backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] border border-black/[0.06] hover:bg-white/90 hover:scale-[1.01]",
        secondary:
          "bg-surface text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] border border-black/[0.06] hover:bg-black/[0.035]",
        outline:
          "bg-transparent text-foreground border border-black/[0.06] hover:bg-black/[0.025]",
        ghost:
          "bg-transparent text-foreground hover:bg-black/[0.04]",
        destructive:
          "bg-danger text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-danger/90",
        soft:
          "bg-accent-warm text-foreground border border-black/[0.06] hover:bg-accent-peach",
        link:
          "bg-transparent text-foreground underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3.5 text-xs",
        default: "h-10 px-5 text-sm",
        lg: "h-12 px-7 text-[15px]",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
