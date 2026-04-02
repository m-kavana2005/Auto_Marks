import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'glass';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ElementType;
    rightIcon?: React.ElementType;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className = '',
            variant = 'primary',
            size = 'md',
            isLoading = false,
            leftIcon: LeftIcon,
            rightIcon: RightIcon,
            children,
            disabled,
            ...props
        },
        ref
    ) => {
        const baseStyles = 'inline-flex items-center justify-center font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

        const variants = {
            primary: 'bg-indigo-600 dark:bg-indigo-50 dark:bg-indigo-900/200 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 shadow-lg shadow-indigo-500/30 focus:ring-indigo-500 border border-transparent',
            secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-700 focus:ring-slate-500 border border-transparent',
            ghost: 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:text-white dark:hover:text-slate-200',
            outline: 'bg-transparent border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-800/50',
            danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-500/30 focus:ring-rose-500 border border-transparent',
            glass: 'bg-white dark:bg-slate-900/10 backdrop-blur-md border border-white/20 text-white hover:bg-white dark:bg-slate-900/20 shadow-xl'
        };

        const sizes = {
            sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
            md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
            lg: 'px-8 py-3.5 text-base rounded-2xl gap-2.5'
        };

        return (
            <button
                ref={ref}
                disabled={isLoading || disabled}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
                {...props}
            >
                {isLoading && <Loader2 className="animate-spin w-4 h-4" />}
                {!isLoading && LeftIcon && <LeftIcon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'} />}
                <span>{children}</span>
                {!isLoading && RightIcon && <RightIcon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'} />}
            </button>
        );
    }
);

Button.displayName = 'Button';
