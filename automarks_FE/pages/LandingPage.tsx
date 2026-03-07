import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { BarChart3, ArrowRight, ShieldCheck, Zap, Search, CheckCircle2, Download, TrendingUp, Building2, GraduationCap, Users, Cpu, LayoutDashboard, Quote } from 'lucide-react';
import AutoMarksLogo from '../components/ui/AutoMarksLogo';
import Navbar from '../components/ui/Navbar';

const LandingPage = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (searchQuery) {
            setIsSearching(true);
            const timer = setTimeout(() => setIsSearching(false), 800);
            return () => clearTimeout(timer);
        } else {
            setIsSearching(false);
        }
    }, [searchQuery]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/results?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-inter overflow-hidden relative selection:bg-indigo-500 selection:text-white">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-rose-500/10 dark:bg-rose-500/20 rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDuration: '6s' }} />
            </div>

            {/* Navbar */}
            <Navbar variant="transparent">
                <Button onClick={() => navigate('/dashboard')} rightIcon={ArrowRight} className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:text-white dark:hover:bg-slate-100">
                    Login
                </Button>
            </Navbar>

            {/* Hero Section */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-24 text-center lg:text-left lg:flex lg:items-center lg:gap-16">
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
                        Transform PDF result sheets into actionable insights with 90% faster grading analysis and instant accessibility.
                    </p>

                    {/* Stats Grid */}
                    <div className="pt-8 grid grid-cols-2 sm:grid-cols-3 gap-6">
                        <div className="text-center lg:text-left">
                            <div className="text-3xl font-black text-slate-900 dark:text-white mb-1 flex items-center justify-center lg:justify-start gap-1">
                                <AnimatedCounter end={12500} />+
                            </div>
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Students Processed</div>
                        </div>
                        <div className="text-center lg:text-left">
                            <div className="text-3xl font-black text-emerald-500 mb-1 flex items-center justify-center lg:justify-start gap-1">
                                <ShieldCheck size={28} className="fill-emerald-100 dark:fill-emerald-900/30" />
                            </div>
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">AI-Verified & Secure</div>
                        </div>
                        <div className="text-center lg:text-left col-span-2 sm:col-span-1">
                            <div className="text-3xl font-black text-indigo-500 mb-1 flex items-center justify-center lg:justify-start gap-1">
                                90%
                            </div>
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Faster Analysis</div>
                        </div>
                    </div>
                </div>

                {/* Hero Image/Graphic */}
                <div className="lg:w-1/2 mt-16 lg:mt-0 relative perspective-1000 animate-in zoom-in-50 fade-in duration-1000 delay-200">
                    <div className="relative rounded-3xl bg-slate-900/5 dark:bg-white/5 border border-slate-200 dark:border-slate-800 p-4 shadow-2xl backdrop-blur-sm lg:rotate-y-[-10deg] lg:rotate-x-[5deg] hover:rotate-0 transition-transform duration-500">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-rose-500/10 rounded-3xl z-0" />
                        <div className="relative z-10 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-inner">
                            {/* Mock UI Header */}
                            <div className="h-10 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex items-center px-4 justify-between">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-rose-400" />
                                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                                </div>
                                <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded-md" />
                            </div>
                            {/* Mock UI Body */}
                            <MockAnalyticsDashboard />
                        </div>
                    </div>

                    {/* Floating badges */}
                    <div className="absolute -top-6 -right-6 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 animate-bounce" style={{ animationDuration: '3s' }}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><CheckCircle2 size={24} /></div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Live Status</p>
                                <p className="text-sm font-black text-slate-900 dark:text-white">98.5% Pass</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Trusted By Strip */}
            <div className="py-12 border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm relative z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Trusted by 50+ Top Institutions</p>
                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="flex items-center gap-2 text-xl font-bold text-slate-700 dark:text-slate-300"><Building2 /> Tech University</div>
                        <div className="flex items-center gap-2 text-xl font-bold text-slate-700 dark:text-slate-300"><GraduationCap /> Global Institute</div>
                        <div className="flex items-center gap-2 text-xl font-bold text-slate-700 dark:text-slate-300"><Users /> Future Academy</div>
                        <div className="flex items-center gap-2 text-xl font-bold text-slate-700 dark:text-slate-300"><Cpu /> State College</div>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <section id="features" className="py-24 bg-white dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 text-[10px] font-black uppercase tracking-widest mb-4">
                            <TrendingUp size={12} />
                            <span>Features</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-4">Everything you need</h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
                            Built for registrars and students to bring transparency and speed to result management.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={Zap}
                            title="Instant Result Access"
                            desc="View your marks immediately after verification. No more waiting for server crashes or physical lists."
                            color="indigo"
                            badge="Fastest"
                        />
                        <FeatureCard
                            icon={BarChart3}
                            title="Performance Analytics"
                            desc="Visual charts to track your progress across semesters. Identify strong subjects and areas for improvement."
                            color="purple"
                        />
                        <FeatureCard
                            icon={Download}
                            title="Downloadable Reports"
                            desc="One-click PDF generation for official marksheets and class-wise performance reports."
                            color="rose"
                            badge="PDF Ready"
                        />
                    </div>
                </div>
            </section>

            {/* How it Works / Timeline */}
            <section className="py-24 bg-slate-50 dark:bg-slate-950 relative overflow-hidden z-10">
                <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-800/50 [mask-image:linear-gradient(0deg,white,transparent)] pointer-events-none" />
                <div className="max-w-7xl mx-auto px-6 relative">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-4">
                            <Cpu size={12} />
                            <span>Workflow</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-4">How it works</h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
                            From PDF to Dashboard in three simple steps.
                        </p>
                    </div>

                    <div className="relative">
                        {/* Connecting Line */}
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent hidden md:block -translate-y-1/2 z-0" />

                        <div className="grid md:grid-cols-3 gap-12 relative z-10">
                            <div className="text-center group">
                                <div className="w-20 h-20 mx-auto bg-white dark:bg-slate-900 border-4 border-indigo-100 dark:border-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 shadow-xl mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <Download size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">1. Upload PDF</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Drag and drop your university result PDFs directly into the portal.</p>
                            </div>
                            <div className="text-center group">
                                <div className="w-20 h-20 mx-auto bg-white dark:bg-slate-900 border-4 border-purple-100 dark:border-purple-900/50 rounded-full flex items-center justify-center text-purple-600 shadow-xl mb-6 group-hover:scale-110 transition-transform duration-300 delay-100">
                                    <Cpu size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">2. AI Extraction</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Our intelligent parser reads every row, identifying USNs, marks, and subjects.</p>
                            </div>
                            <div className="text-center group">
                                <div className="w-20 h-20 mx-auto bg-white dark:bg-slate-900 border-4 border-emerald-100 dark:border-emerald-900/50 rounded-full flex items-center justify-center text-emerald-600 shadow-xl mb-6 group-hover:scale-110 transition-transform duration-300 delay-200">
                                    <LayoutDashboard size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">3. Get Insights</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Instantly view pass percentages, toppers, and fail statistics on your dashboard.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 bg-white dark:bg-slate-900/50 z-10 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 relative">
                            <Quote className="absolute top-8 right-8 text-indigo-100 dark:text-indigo-900 dark:text-indigo-100/20" size={64} />
                            <p className="text-lg font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic relative z-10 mb-6">
                                "This tool has completely transformed how we analyze semester results. What used to take days of manual entry now happens in seconds. Essential for any registrar."
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">JD</div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">John Doe</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Chief Registrar, SIT</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 relative">
                            <Quote className="absolute top-8 right-8 text-rose-100 dark:text-rose-900 dark:text-rose-100/20" size={64} />
                            <p className="text-lg font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic relative z-10 mb-6">
                                "Finally, I can check my results without the university website crashing! The visualization of my performance over 4 years is a game changer."
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-rose-200 rounded-full flex items-center justify-center text-rose-700 dark:text-rose-300 font-bold">AS</div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">Alice Smith</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Student, CSE</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-900 dark:bg-indigo-950 z-0" />
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-rose-600/20 z-0" />
                <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
                    <h2 className="text-4xl sm:text-5xl font-black text-white mb-8 tracking-tight dark:text-white">Ready to modernize your results?</h2>
                    <p className="text-lg text-indigo-100 mb-10 max-w-2xl mx-auto">
                        Join 50+ institutions that trust Auto Marks for fast, accurate result processing.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" onClick={() => navigate('/dashboard')} className="bg-white text-slate-900 dark:text-white hover:bg-slate-100 border-none shadow-2xl">
                            Start Free Trial
                        </Button>
                        <Button size="lg" variant="outline" className="border-slate-700 text-white hover:bg-white/10 hover:text-white">
                            Contact Sales
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-slate-200 dark:border-slate-800 text-center bg-slate-50 dark:bg-slate-950">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2 opacity-50">
                        <AutoMarksLogo size={24} />
                        <span className="font-bold text-slate-400">Auto Marks</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">© 2026 Auto_Marks. Built for VTU.</p>
                </div>
            </footer>
        </div>
    );
};

const MockAnalyticsDashboard = () => {
    return (
        <div className="p-5 space-y-4">
            {/* Stat Cards Row */}
            <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Total Students</p>
                    <p className="text-lg font-black text-indigo-600 dark:text-indigo-300">1,247</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50">
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Pass Rate</p>
                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-300">94.2%</p>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50">
                    <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1">Avg SGPA</p>
                    <p className="text-lg font-black text-rose-600 dark:text-rose-300">7.8</p>
                </div>
            </div>

            {/* Chart Area */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Semester Performance</p>
                    <div className="flex gap-2">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                            <span className="text-[9px] text-slate-400">Pass</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-rose-400" />
                            <span className="text-[9px] text-slate-400">Fail</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-end gap-2 h-28">
                    {[
                        { pass: 85, fail: 15 },
                        { pass: 72, fail: 28 },
                        { pass: 90, fail: 10 },
                        { pass: 65, fail: 35 },
                        { pass: 88, fail: 12 },
                        { pass: 95, fail: 5 },
                        { pass: 78, fail: 22 },
                        { pass: 82, fail: 18 },
                    ].map((d, i) => (
                        <div key={i} className="flex-1 flex flex-col gap-0.5 h-full justify-end">
                            <div
                                className="w-full bg-indigo-500 rounded-t-sm transition-all duration-1000 ease-out"
                                style={{ height: `${d.pass}%`, opacity: 0.85 }}
                            />
                            <div
                                className="w-full bg-rose-400 rounded-b-sm transition-all duration-1000 ease-out"
                                style={{ height: `${d.fail}%`, opacity: 0.6 }}
                            />
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-2">
                    {['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'].map(s => (
                        <span key={s} className="text-[9px] text-slate-400 font-medium flex-1 text-center">{s}</span>
                    ))}
                </div>
            </div>

            {/* Top Performers Row */}
            <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Performers</p>
                {[
                    { name: 'Rohan S.', usn: '1SV25CS001', sgpa: '9.8', color: 'bg-amber-400' },
                    { name: 'Priya M.', usn: '1SV25CS042', sgpa: '9.6', color: 'bg-slate-300' },
                ].map((s, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                        <div className={`w-6 h-6 rounded-full ${s.color} flex items-center justify-center text-[9px] font-black text-white`}>{i + 1}</div>
                        <div className="flex-1">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{s.name}</p>
                            <p className="text-[9px] text-slate-400">{s.usn}</p>
                        </div>
                        <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">{s.sgpa}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const FeatureCard = ({ icon: Icon, title, desc, color, badge }: any) => {
    const colors: Record<string, string> = {
        indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
        purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
        rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    };

    return (
        <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-all hover:-translate-y-1 group relative overflow-hidden">
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity`}>
                <Icon size={120} />
            </div>

            <div className={`w-14 h-14 rounded-2xl ${colors[color]} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm`}>
                <Icon size={28} strokeWidth={1.5} />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-3">
                {title}
                {badge && <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">{badge}</span>}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm font-medium">{desc}</p>
        </div>
    );
};

// Simple animated counter component
const AnimatedCounter = ({ end, duration = 2000 }: { end: number, duration?: number }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number | null = null;
        const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }, [end, duration]);

    return <span>{count.toLocaleString()}</span>;
};

export default LandingPage;
