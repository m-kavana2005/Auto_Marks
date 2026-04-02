import React from 'react';
import { Link } from 'react-router-dom';
import AutoMarksLogo from './AutoMarksLogo';

interface NavbarProps {
    /** Content rendered on the right side of the navbar (buttons, links, etc.) */
    children?: React.ReactNode;
    /** Whether the navbar should have a transparent/overlay style (for landing pages) */
    variant?: 'default' | 'transparent';
    /** Optional className override for the outer nav element */
    className?: string;
}

/**
 * Reusable Navbar component. Always shows the AutoMarks logo + brand name on the left.
 * Pass dynamic right-side content (buttons, links, etc.) as children.
 *
 * @example
 * // Landing page — transparent, with GitHub + Login buttons
 * <Navbar variant="transparent">
 *   <Button variant="ghost">GitHub</Button>
 *   <Button>Login</Button>
 * </Navbar>
 *
 * @example
 * // Dashboard page — default style, with settings + profile
 * <Navbar>
 *   <ThemeToggle />
 *   <ProfileDropdown />
 * </Navbar>
 */
const Navbar: React.FC<NavbarProps> = ({ children, variant = 'default', className = '' }) => {
    const baseStyles = 'relative z-50 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto';

    const variantStyles = {
        default: 'bg-white dark:bg-slate-900/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800',
        transparent: '',
    };

    return (
        <nav className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
            {/* Left side — Logo + Brand */}
            <Link to="/" className="flex items-center gap-3 group">
                <AutoMarksLogo size={36} className="group-hover:scale-105 transition-transform" />
                <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Auto <span className="text-indigo-600 dark:text-indigo-400">Marks</span>
                </span>
            </Link>

            {/* Right side — Dynamic content */}
            {children && (
                <div className="flex items-center gap-3">
                    {children}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
