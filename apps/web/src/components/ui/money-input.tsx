"use client";

import {
  digitsOnlyInput,
  formatDigitsWithCommas,
} from "@/lib/format-money";

type MoneyInputProps = {
  /** Chỉ chữ số 0–9 (không dấu phẩy) */
  digits: string;
  onDigitsChange: (digits: string) => void;
  className?: string;
  placeholder?: string;
  maxDigits?: number;
  id?: string;
  disabled?: boolean;
};

export function MoneyInput({
  digits,
  onDigitsChange,
  className,
  placeholder,
  maxDigits = 13,
  id,
  disabled,
}: MoneyInputProps) {
  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      disabled={disabled}
      className={className}
      placeholder={placeholder}
      value={formatDigitsWithCommas(digits)}
      onChange={(e) => onDigitsChange(digitsOnlyInput(e.target.value, maxDigits))}
    />
  );
}
