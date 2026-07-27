'use client';

import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';
import styles from './OtpCodeInputGroup.module.css';

export interface OtpCodeInputGroupProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  hasError?: boolean;
}

/**
 * Figma Make `EmailVerifyScreen` — 6칸 OTP 입력.
 * 숫자 입력 시 다음 칸으로 자동 이동, backspace 는 이전 칸으로 이동한다.
 */
export default function OtpCodeInputGroup({
  value,
  onChange,
  length = 6,
  disabled,
  hasError,
}: OtpCodeInputGroupProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const digits = Array.from({ length }, (_, index) => value[index] ?? '');

  const setDigitAt = (index: number, digit: string) => {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join('').slice(0, length));
  };

  const handleChange = (index: number, rawInput: string) => {
    const digit = rawInput.replace(/\D/g, '').slice(-1);
    setDigitAt(index, digit);
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    event.preventDefault();
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className={styles.group} role="group" aria-label="인증번호 6자리">
      {digits.map((digit, index) => (
        <input
          // eslint-disable-next-line react/no-array-index-key -- 고정 길이 슬롯
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          className={`${styles.box} ${hasError ? styles.boxError : ''}`}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          data-testid={`otp-digit-${index}`}
        />
      ))}
    </div>
  );
}
