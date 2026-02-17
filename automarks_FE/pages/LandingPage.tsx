import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { BarChart3, UploadCloud, FileSearch, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-inter overflow-hidden relative selection:bg-indigo-500 selection:text-white">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-rose-500/10 dark:bg-rose-500/20 rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDuration: '6s' }} />
            </div>

            {/* Navbar */}
            <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30">V</div>
                    <span className="text-xl font-extrabold tracking-tight">VTU <span className="text-indigo-600 dark:text-indigo-400">Insight</span></span>
                </div>
                <div className="flex gap-4">
                    <Button variant="ghost" className="hidden sm:flex" onClick={() => window.open('https://github.com/mohitkgupta13/Auto_Marks', '_blank')}>GitHub</Button>
                    <Button onClick={() => navigate('/dashboard')} rightIcon={ArrowRight} className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
                        Login
                    </Button>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-32 text-center lg:text-left lg:flex lg:items-center lg:gap-16">
                <div className="lg:w-1/2 space-y-8 animate-in slide-in-from-bottom-10 fade-in duration-700">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-widest border border-indigo-100 dark:border-indigo-800">
                        <Zap size={14} className="fill-indigo-500 text-indigo-500" />
                        <span>Next-Gen Result Analysis</span>
                    </div>

                    <h1 className="text-5xl sm:text-7xl font-black leading-[1.1] tracking-tight text-slate-900 dark:text-white">
                        Unlock the power of <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 animate-gradient-x">Student Data.</span>
                    </h1>

                    <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg mx-auto lg:mx-0">
                        Transform PDF result sheets into actionable insights. Track performance, analyze trends, and manage student records with zero friction.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                        <Button size="lg" onClick={() => navigate('/dashboard')} rightIcon={ArrowRight} className="shadow-2xl shadow-indigo-500/40">
                            Get Started Now
                        </Button>
                        <Button size="lg" variant="outline" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                            Learn more
                        </Button>
                    </div>

                    <div className="pt-8 flex items-center justify-center lg:justify-start gap-8 text-slate-400 grayscale opacity-70">
                        <div className="flex items-center gap-2 font-bold"><ShieldCheck size={18} /> Secure</div>
                        <div className="flex items-center gap-2 font-bold"><Zap size={18} /> Fast</div>
                        <div className="flex items-center gap-2 font-bold"><BarChart3 size={18} /> Analytic</div>
                    </div>
                </div>

                {/* Hero Image/Graphic */}
                <div className="lg:w-1/2 mt-16 lg:mt-0 relative perspective-1000 animate-in zoom-in-50 fade-in duration-1000 delay-200">
                    <div className="relative rounded-3xl bg-slate-900/5 dark:bg-white/5 border border-slate-200 dark:border-slate-800 p-4 shadow-2xl backdrop-blur-sm lg:rotate-y-[-10deg] lg:rotate-x-[5deg] hover:rotate-0 transition-transform duration-500">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-rose-500/10 rounded-3xl z-0" />
                        <div className="relative z-10 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-inner">
                            {/* Mock UI */}
                            <div className="h-8 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex items-center px-4 gap-2">
                                <div className="w-3 h-3 rounded-full bg-rose-400" />
                                <div className="w-3 h-3 rounded-full bg-amber-400" />
                                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-1/3 h-24 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 animate-pulse" />
                                    <div className="w-1/3 h-24 rounded-xl bg-purple-50 dark:bg-purple-900/20 animate-pulse delay-75" />
                                    <div className="w-1/3 h-24 rounded-xl bg-rose-50 dark:bg-rose-900/20 animate-pulse delay-150" />
                                </div>
                                <div className="h-48 rounded-xl bg-slate-50 dark:bg-slate-800/50 w-full" />
                            </div>
                        </div>
                    </div>

                    {/* Floating badges */}
                    <div className="absolute -top-10 -right-10 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 animate-bounce" style={{ animationDuration: '3s' }}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><UploadCloud size={20} /></div>
                            <div>
                                <p className="text-xs font-bold text-slate-500">Upload Status</p>
                                <p className="text-sm font-black text-slate-900 dark:text-white">Complete</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Features Grid */}
            <section id="features" className="py-24 bg-white dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Everything you need</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto">
                            Built for registrars, faculty, and administrators to gain deep insights into academic performance.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={UploadCloud}
                            title="Batch PDF Processing"
                            desc="Drag & drop hundreds of VTU result PDFs. Our parser handles the heavy lifting instantly."
                            color="indigo"
                        />
                        <FeatureCard
                            icon={FileSearch}
                            title="Deep Search & Filters"
                            desc="Find any student by USN or name. Filter results by semester, branch, or CGPA range."
                            color="purple"
                        />
                        <FeatureCard
                            icon={BarChart3}
                            title="Advanced Analytics"
                            desc="Visualize pass percentages, SGPA trends, and subject-wise performance distributions."
                            color="rose"
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-slate-200 dark:border-slate-800 text-center">
                <p className="text-slate-500 text-sm font-medium">© 2026 Auto_Marks. Built for VTU.</p>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon: Icon, title, desc, color }: any) => {
    const colors = {
        indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
        purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
        rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
    };

    return (
        <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-all hover:-translate-y-1 group">
            <div className={`w-14 h-14 rounded-2xl ${colors[color]} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <Icon size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{title}</h3>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">{desc}</p>
        </div>
    );
};

export default LandingPage;
