import { useLayoutEffect, useRef } from 'react';

const format = (value: string) => value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** Display Vietnamese thousands separators; keep the parent value as whole VND digits. */
export default function MoneyInput({
  value,
  onChange,
  min,
  max,
}: {
  value: string;
  onChange: (value: string) => void;
  min: number;
  max: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    const valid =
      !value ||
      (/^\d+$/.test(value) &&
        Number.isSafeInteger(Number(value)) &&
        Number(value) >= min &&
        Number(value) <= max);
    input.current?.setCustomValidity(
      valid
        ? ''
        : `Nhập số tiền từ ${min.toLocaleString('vi-VN')} đến ${max.toLocaleString('vi-VN')} VND.`,
    );
  }, [value, min, max]);

  return (
    <input
      ref={input}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      required
      value={format(value)}
      onPaste={(event) => {
        // A decimal amount must not silently become a larger whole-VND amount.
        const pasted = event.clipboardData.getData('text').trim();
        if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)$/.test(pasted)) event.preventDefault();
      }}
      onChange={(event) => {
        const field = event.currentTarget;
        const entered = field.value;
        const digits = entered.replace(/\./g, '');
        if (!/^\d*$/.test(digits)) {
          field.value = format(value);
          return;
        }
        const next = digits.replace(/^0+(?=\d)/, '');
        const beforeCursor = entered
          .slice(0, field.selectionStart ?? entered.length)
          .replace(/\D/g, '').length;
        const formatted = format(next);
        let cursor = 0,
          count = 0;
        while (cursor < formatted.length && count < beforeCursor) {
          if (/\d/.test(formatted[cursor])) count++;
          cursor++;
        }
        field.value = formatted;
        field.setSelectionRange(cursor, cursor);
        onChange(next);
      }}
    />
  );
}
