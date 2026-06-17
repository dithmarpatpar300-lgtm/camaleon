"use client";

import { cn } from "@/lib/utils";

type SettingsSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
};

export function SettingsSwitch({ checked, onChange, label, disabled }: SettingsSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "settings-switch",
        checked && "settings-switch--on",
        "disabled:cursor-not-allowed disabled:opacity-50"
      )}
    >
      <span
        aria-hidden="true"
        className={cn("settings-switch-thumb", !checked && "settings-switch-thumb--off")}
      />
    </button>
  );
}
