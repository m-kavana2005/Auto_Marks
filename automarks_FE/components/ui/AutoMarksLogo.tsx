import React from 'react';

interface AutoMarksLogoProps {
    size?: number;
    className?: string;
}

/**
 * AutoMarks Logo — An SVG icon combining a bar chart with a checkmark,
 * rendered in an indigo-to-violet gradient. Use this everywhere the brand icon appears.
 */
const AutoMarksLogo: React.FC<AutoMarksLogoProps> = ({ size = 40, className = '' }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4F46E5" />
                    <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>
            </defs>
            {/* Rounded square background */}
            <rect width="48" height="48" rx="12" fill="url(#logoGrad)" />
            {/* Bar chart bars */}
            <rect x="10" y="28" width="5" height="10" rx="1.5" fill="white" opacity="0.7" />
            <rect x="18" y="22" width="5" height="16" rx="1.5" fill="white" opacity="0.85" />
            <rect x="26" y="16" width="5" height="22" rx="1.5" fill="white" opacity="0.95" />
            {/* Checkmark */}
            <path
                d="M33 14L37 18L43 10"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </svg>
    );
};

export default AutoMarksLogo;
