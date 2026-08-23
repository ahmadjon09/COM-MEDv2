'use client';
// Tugma — o'tkir burchakli, soyasiz, "texnik" ko'rinish.
// Har bir bosishda loading holati ko'rsatiladi.
import { forwardRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const VARIANTS = {
  solid:
    'bg-ink-900 text-white border border-ink-900 hover:bg-ink-800 hover:border-ink-800',
  accent:
    'bg-blue-500 text-white border border-blue-500 hover:bg-blue-600 hover:border-blue-600',
  outline:
    'bg-white text-ink-800 border border-ink-200 hover:border-ink-900 hover:text-ink-900',
  quiet:
    'bg-transparent text-ink-600 border border-transparent hover:bg-ink-50 hover:text-ink-900',
  danger:
    'bg-white text-danger border border-ink-200 hover:border-danger hover:bg-orange-50',
  link:
    'bg-transparent border-0 text-blue-600 hover:text-blue-700 px-0 h-auto',
};

const SIZES = {
  xs: 'h-7 px-2.5 text-micro gap-1.5',
  sm: 'h-9 px-3.5 text-xs gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-13 px-6 text-[0.9375rem] gap-2.5',
  icon: 'h-9 w-9 justify-center',
};

export function Spinner({ className, size = 15 }) {
  return (
    <svg className={cn('animate-spin', className)} viewBox="0 0 24 24" fill="none" width={size} height={size} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".28" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

const Button = forwardRef(function Button(
  { children, variant = 'solid', size = 'md', loading = false, disabled = false, href,
    className, icon, iconRight, full = false, type = 'button', prefetch, ...props },
  ref
) {
  const classes = cn(
    'group inline-flex select-none items-center justify-center whitespace-nowrap rounded font-medium',
    'transition-colors duration-200 ease-out active:translate-y-px',
    'disabled:pointer-events-none disabled:opacity-45',
    VARIANTS[variant], SIZES[size], full && 'w-full', className
  );

  const inner = (
    <>
      {loading ? <Spinner /> : icon}
      <span>{children}</span>
      {!loading && iconRight}
    </>
  );

  if (href && !disabled && !loading) {
    return (
      <Link ref={ref} href={href} className={classes} prefetch={prefetch} {...props}>
        {inner}
      </Link>
    );
  }

  return (
    <button ref={ref} type={type} className={classes} disabled={disabled || loading} aria-busy={loading} {...props}>
      {inner}
    </button>
  );
});

export default Button;
