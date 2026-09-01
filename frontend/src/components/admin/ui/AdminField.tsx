'use client';

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import styles from './adminUi.module.css';

type AdminFieldProps = {
  label: string;
  helper?: ReactNode;
  children: ReactNode;
};

export function AdminField({ label, helper, children }: AdminFieldProps) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {children}
      {helper ? <span className={styles.helper}>{helper}</span> : null}
    </label>
  );
}

type AdminInputProps = InputHTMLAttributes<HTMLInputElement>;

export function AdminInput({ className, readOnly, disabled, ...rest }: AdminInputProps) {
  return (
    <input
      className={[styles.control, readOnly ? styles.controlReadOnly : '', className || ''].filter(Boolean).join(' ')}
      readOnly={readOnly}
      disabled={disabled}
      {...rest}
    />
  );
}

type AdminSelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function AdminSelect({ className, disabled, ...rest }: AdminSelectProps) {
  return (
    <select
      className={[styles.control, className || ''].filter(Boolean).join(' ')}
      disabled={disabled}
      {...rest}
    />
  );
}

type AdminTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function AdminTextarea({ className, readOnly, disabled, ...rest }: AdminTextareaProps) {
  return (
    <textarea
      className={[styles.control, styles.textarea, readOnly ? styles.controlReadOnly : '', className || '']
        .filter(Boolean)
        .join(' ')}
      readOnly={readOnly}
      disabled={disabled}
      {...rest}
    />
  );
}

type AdminCheckboxProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  helper?: ReactNode;
};

export function AdminCheckbox({ label, checked, onChange, disabled, helper }: AdminCheckboxProps) {
  return (
    <label className={styles.field}>
      <span className={styles.checkboxRow}>
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className={styles.label}>{label}</span>
      </span>
      {helper ? <span className={styles.helper}>{helper}</span> : null}
    </label>
  );
}
