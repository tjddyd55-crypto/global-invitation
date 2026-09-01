'use client';

import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './adminUi.module.css';

export type AdminButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
export type AdminButtonSize = 'sm' | 'md';

type AdminButtonProps = {
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
  loading?: boolean;
  href?: string;
  children: ReactNode;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'>;

const variantClass: Record<AdminButtonVariant, string> = {
  primary: styles.variantPrimary,
  secondary: styles.variantSecondary,
  ghost: styles.variantGhost,
  danger: styles.variantDanger,
  link: styles.variantLink,
};

export default function AdminButton({
  variant = 'secondary',
  size = 'md',
  loading = false,
  href,
  children,
  className,
  disabled,
  type = 'button',
  ...rest
}: AdminButtonProps) {
  const classes = [
    styles.buttonBase,
    size === 'sm' ? styles.sizeSm : styles.sizeMd,
    variantClass[variant],
    disabled || loading ? styles.buttonDisabled : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ');

  const content = loading ? '처리 중...' : children;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...rest}>
      {content}
    </button>
  );
}
