"use client";

import { cn } from "@/lib/utils";

export type ConnectivityVisualState = "online" | "offline" | "simulated";

type Props = {
  state: ConnectivityVisualState;
  size?: "xs" | "sm" | "md" | "lg";
  pulse?: boolean;
  /** Softer styling for header pip */
  subtle?: boolean;
  className?: string;
};

const sizeClass = {
  xs: "h-1.5 w-1.5",
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
} as const;

export function ConnectivityDot({
  state,
  size = "md",
  pulse = true,
  subtle = false,
  className,
}: Props) {
  const isOnline = state === "online";

  return (
    <span
      className={cn(
        "connectivity-dot inline-block shrink-0 rounded-full",
        sizeClass[size],
        isOnline ? "connectivity-dot--online" : "connectivity-dot--offline",
        subtle && "connectivity-dot--subtle",
        pulse && !subtle && "connectivity-dot--pulse",
        className
      )}
      aria-hidden="true"
    />
  );
}
