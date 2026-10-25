import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary';

function classes(variant: Variant, block: boolean, extra?: string) {
  return [styles.button, styles[variant], block && styles.block, extra].filter(Boolean).join(' ');
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; block?: boolean };

export function Button({ variant = 'secondary', block = false, className, ...rest }: ButtonProps) {
  return <button type="button" className={classes(variant, block, className)} {...rest} />;
}

type ButtonLinkProps = Omit<LinkProps, 'className'> & {
  variant?: Variant;
  block?: boolean;
  className?: string;
};

export function ButtonLink({ variant = 'secondary', block = false, className, ...rest }: ButtonLinkProps) {
  return <Link className={classes(variant, block, className)} {...rest} />;
}
