import React, { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'flat' | 'hover';
}

export const Card = ({
    className = '',
    variant = 'default',
    children,
    ...props
}: CardProps) => {
    const baseStyles = 'rounded-2xl transition-all duration-300';

    const variants = {
        default: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm',
        glass: 'glass-card text-slate-800 dark:text-white', // Uses global CSS class
        flat: 'bg-slate-50 dark:bg-slate-800/50 border border-transparent',
        hover: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1'
    };

    return (
        <div
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};
