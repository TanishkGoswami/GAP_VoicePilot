"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PrimaryButton } from "@/components/ui/primary-button";
import { GetDemoButton } from "@/components/demo/GetDemoButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  Globe2,
  Headphones,
  LogOut,
  Menu,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
  Check,
  Minus,
} from "lucide-react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const navItems = [
  { label: "Product", href: "/product" },
  { label: "Capabilities", href: "/#capabilities" },
  { label: "Workflow", href: "/#workflow" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/pricing#faq" },
];

const pricingPlans = [
  {
    name: "Start",
    monthlyPrice: 1499,
    annualPrice: 1199,
    note: "250 AI calling minutes • ₹6.00/min rate",
    action: "Start building",
    featured: false,
    badge: "FOR STARTERS",
    minutes: "250 AI Minutes",
    features: [
      "250 AI Calling Minutes",
      "₹6.00 / min per-minute rate",
      "Hindi, English & Hinglish Support",
      "Custom AI System Prompts",
      "Basic Lead & Contact Capture",
    ],
  },
  {
    name: "Build",
    monthlyPrice: 4999,
    annualPrice: 3999,
    note: "1,000 AI calling minutes • ₹5.00/min rate",
    action: "Start building",
    featured: true,
    badge: "FOR TEAMS",
    minutes: "1,000 AI Minutes",
    features: [
      "1,000 AI Calling Minutes",
      "₹5.00 / min per-minute rate",
      "Realtime Live Call Transfer",
      "Automatic CRM Auto-Syncing",
      "Live Call Transcripts & Recording",
    ],
  },
  {
    name: "Scale",
    monthlyPrice: 9999,
    annualPrice: 7999,
    note: "2,000 AI calling minutes • ₹5.00/min rate",
    action: "Start building",
    featured: false,
    badge: "FOR HIGH VOLUME",
    minutes: "2,000 AI Minutes",
    features: [
      "2,000 AI Calling Minutes",
      "₹5.00 / min per-minute rate",
      "Unlimited Multi-Agent Workflows",
      "Priority SIP Latency Routing",
      "Dedicated Account Manager",
    ],
  },
  {
    name: "Enterprise",
    monthlyPrice: 0,
    annualPrice: 0,
    note: "Dedicated infrastructure & custom SLA",
    action: "Talk to our team",
    featured: false,
    badge: "FOR ORGANIZATIONS",
    minutes: "Custom Volume",
    features: [
      "Concurrency sized to your volume",
      "Custom per-minute bulk rates",
      "Custom SIP trunking & on-prem",
      "Forward-deployed engineer",
      "TRAI, SOC2 & DLT compliance",
      "Zero data retention & SSO",
    ],
  },
];

const featureComparison = [
  {
    category: "AI Calling & Voice Engine",
    items: [
      { feature: "AI Calling Minutes Included", lite: "250 Mins", pro: "1,000 Mins", elite: "2,000 Mins" },
      { feature: "Effective Per Minute Rate", lite: "₹6.00/min", pro: "₹5.00/min", elite: "₹5.00/min" },
      { feature: "Cartesia & ElevenLabs Neural Pipeline", lite: true, pro: true, elite: true },
      { feature: "Regional Languages (Hindi, English, Hinglish)", lite: true, pro: true, elite: true },
      { feature: "Custom Voice Cloning", lite: false, pro: false, elite: true },
    ],
  },
  {
    category: "Telephony & Operations",
    items: [
      { feature: "Live Call Handoff / Human Transfer", lite: false, pro: true, elite: true },
      { feature: "Outbound Automated Campaigns", lite: false, pro: true, elite: true },
      { feature: "Inbound IVR & Call Routing", lite: true, pro: true, elite: true },
      { feature: "Custom SIP Trunking", lite: false, pro: false, elite: true },
    ],
  },
  {
    category: "Data & Analytics",
    items: [
      { feature: "Call Recording & Transcripts", lite: "Basic", pro: "Full HD", elite: "Unlimited HD" },
      { feature: "Realtime Sentiment & Intent Extraction", lite: false, pro: true, elite: true },
      { feature: "CRM Auto-Sync (HubSpot, Salesforce, Webhooks)", lite: false, pro: true, elite: true },
      { feature: "Export Data (CSV / JSON)", lite: true, pro: true, elite: true },
    ],
  },
  {
    category: "Security & SLA Support",
    items: [
      { feature: "SSL & Enterprise Data Encryption", lite: true, pro: true, elite: true },
      { feature: "Support SLA", lite: "Standard Email", pro: "Priority Email & Chat", elite: "24/7 Dedicated AM" },
      { feature: "99.9% Uptime SLA Guarantee", lite: false, pro: false, elite: true },
    ],
  },
];

const faqs = [
  {
    question: "How are calling minutes calculated?",
    answer:
      "Minutes are billed strictly on connected call duration rounded up to the nearest second. If a call lasts 45 seconds, only 45 seconds of your minute balance is deducted.",
  },
  {
    question: "What happens if I run out of calling minutes?",
    answer:
      "You can easily recharge AI calling minutes anytime directly from your dashboard balance button or enable auto-recharge. Unused minutes on paid plans rollover to the next month.",
  },
  {
    question: "Can I bring my own existing phone numbers or SIP trunks?",
    answer:
      "Yes! Our Call Elite plan supports custom SIP trunking and direct PBX integration, allowing you to connect existing telephony infrastructure seamlessly.",
  },
  {
    question: "Does VoicePilot support mixed Hinglish conversations?",
    answer:
      "Absolutely. Our neural voice pipeline is specifically tuned for Indian business communication, smoothly understanding code-switched Hindi, English, and Hinglish phrases in live conversations.",
  },
  {
    question: "Is there any long-term contract or cancellation fee?",
    answer:
      "No long-term commitments required. You can upgrade, downgrade, or cancel your subscription at any time directly from the Plans & Billing dashboard.",
  },
];

export default function PricingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAnnual, setIsAnnual] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const [plansList, setPlansList] = useState(pricingPlans);

  useEffect(() => {
    const fetchDbPlans = async () => {
      try {
        const supabase = createClient();
        const { data: dbPlans } = await supabase
          .from("plans")
          .select("*")
          .eq("is_active", true)
          .order("price_monthly", { ascending: true });

        if (dbPlans && dbPlans.length > 0) {
          const mapped = dbPlans.map((p) => {
            const feats = p.features || {};
            const isEnt = p.id === "enterprise" || feats.is_enterprise;
            return {
              name: p.name || (isEnt ? "Enterprise" : "Plan"),
              monthlyPrice: p.price_monthly,
              annualPrice: Math.round(p.price_monthly * 0.8),
              note: feats.feeNote || (p.price_monthly > 0 ? `${p.included_credits} AI calling minutes` : "Contracted to your volume."),
              action: isEnt ? "Talk to our team" : "Start building",
              featured: feats.is_popular || false,
              badge: feats.audience || (isEnt ? "FOR ORGANIZATIONS" : undefined),
              minutes: p.included_credits > 0 ? `${p.included_credits} AI Minutes` : "Custom Volume",
              features: feats.feature_list || [
                `${p.included_credits} AI Calling Minutes`,
                "Hindi, English & Hinglish Support",
                "Custom AI System Prompts"
              ]
            };
          });
          setPlansList(mapped);
        }
      } catch (e) {}
    };
    fetchDbPlans();
  }, []);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (timeZone: string) => {
    if (!currentTime) return "00:00:00";
    return currentTime.toLocaleTimeString("en-US", {
      timeZone,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  useEffect(() => {
    const footerEl = footerRef.current;
    if (!footerEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFooterVisible(entry.isIntersecting);
      },
      { rootMargin: "0px", threshold: 0.05 }
    );

    observer.observe(footerEl);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      try {
        const { createClient } = await import("@/utils/supabase/client");
        const supabase = createClient();

        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted && session?.user) {
          setUser(session.user);
        }

        const { data: { user: serverUser } } = await supabase.auth.getUser();
        if (isMounted) {
          setUser(serverUser ?? session?.user ?? null);
        }
      } catch (e) {
        console.warn("Could not check auth status on pricing page:", e);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsAuthLoading(false);
      }
    };
    fetchUser();
    return () => {
      isMounted = false;
    };
  }, []);

  useGSAP(
    () => {
      const reveals = gsap.utils.toArray<HTMLElement>(".section-reveal");
      reveals.forEach((element) => {
        gsap.fromTo(
          element,
          { opacity: 0, y: 35 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power2.out",
            scrollTrigger: {
              trigger: element,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    },
    { scope: containerRef }
  );

  const displayName = user
    ? user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User"
    : "User";

  return (
    <div ref={containerRef} className="min-h-screen bg-[#f7f6f0] text-black antialiased font-sans">
      {/* Sticky Header Navigation */}
      <header
        className={`sticky top-2 z-50 mx-auto w-full md:w-[82%] lg:w-[76%] max-w-[1080px] px-3 sm:px-4 transition-all duration-300 ${
          isFooterVisible
            ? "opacity-0 -translate-y-8 pointer-events-none"
            : "opacity-100 translate-y-0 pointer-events-auto"
        }`}
      >
        <div className="flex h-16 items-center justify-between rounded-full border border-white/70 bg-white/80 p-2 pl-4 pr-2 shadow-[0_10px_35px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.9)_inset] backdrop-blur-2xl ring-1 ring-black/5 transition-all duration-300">
          <Link href="/" className="flex items-center gap-2 shrink-0" title="GAP VoicePilot Home">
            <Image src="/logo.png" alt="GAP VoicePilot Logo" width={40} height={40} className="h-9.5 w-9.5 object-contain" priority />
            <span className="text-xl font-extrabold tracking-tight text-black flex items-center gap-1">
              <span>GAP</span>
              <span className="font-array font-bold text-[#ff4b2f]">VoicePilot</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  item.href === "/pricing"
                    ? "bg-black text-white shadow-xs"
                    : "text-black/70 hover:bg-black/5 hover:text-black"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 sm:flex shrink-0">
            {isAuthLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-black/5 animate-pulse" />
              </div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm transition-all duration-200 hover:border-black/25 hover:shadow-md hover:scale-105"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-black text-xs font-semibold text-white">
                        {displayName.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={12} className="w-64 rounded-[20px] border border-black/10 bg-white p-2 shadow-2xl">
                  <DropdownMenuLabel className="px-3.5 py-2.5">
                    <span className="block truncate text-sm font-semibold text-black">{displayName}</span>
                    {user.email ? <span className="mt-0.5 block truncate text-xs font-medium text-black/45">{user.email}</span> : null}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-black/5" />
                  <DropdownMenuItem asChild className="rounded-xl px-3.5 py-2.5 font-medium cursor-pointer">
                    <Link href="/dashboard">Open Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-xl px-3.5 py-2.5 font-medium text-red-600 focus:bg-red-50 cursor-pointer"
                    onSelect={async () => {
                      const { signOut } = await import("@/app/actions/auth");
                      await signOut();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link
                  href="/demo"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#ff4b2f]/40 bg-[#fff5f3] px-4 py-2 text-xs font-bold text-[#d93620] shadow-xs transition-all hover:bg-[#ffece8] hover:border-[#ff4b2f] hover:scale-105 active:scale-95"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#ff4b2f]" />
                  <span>Get a Demo</span>
                </Link>
                <Link href="/login" className="rounded-full px-3.5 py-2 text-xs font-semibold text-black/70 hover:bg-black/5">
                  Sign In
                </Link>
                <PrimaryButton href="/dashboard" className="h-10 min-w-[145px]">
                  Get Started
                </PrimaryButton>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-black md:hidden"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="mt-2 md:hidden">
            <nav className="flex flex-col gap-1 rounded-3xl border border-black/10 bg-white p-4 shadow-2xl">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-black/80 hover:bg-black/5"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 flex flex-col gap-2 pt-2 border-t border-black/10">
                <Link href="/login" className="rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-black/80 hover:bg-black/5">
                  Sign In
                </Link>
                <PrimaryButton href="/dashboard" className="w-full">
                  Get Started Free
                </PrimaryButton>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="pt-16 md:pt-24 lg:pt-28">
        {/* Pricing Hero Section */}
        <section className="mx-auto max-w-[1340px] px-6 pb-16 lg:px-8 text-center pt-4 md:pt-8">
          <h1 className="section-reveal font-array text-4xl font-[340] leading-[1.04] tracking-[-0.03em] sm:text-6xl lg:text-7xl max-w-4xl mx-auto">
            Pay for voice minutes.<br />Scale autonomous agents.
          </h1>

          <p className="section-reveal mt-6 max-w-2xl mx-auto text-base sm:text-lg font-light leading-relaxed text-black/75">
            Deploy ultra-low latency Hindi, English & Hinglish AI voice agents. Simple predictable pricing with zero per-seat fees or lock-in contracts.
          </p>

          {/* Clean Monthly / Annual Billing Switcher */}
          <div className="section-reveal mt-10 inline-flex items-center rounded-full border border-black/10 bg-white p-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className={`rounded-full px-5 py-2.5 text-xs font-semibold transition-all ${
                !isAnnual ? "bg-black text-white shadow-xs font-bold" : "text-black/60 hover:text-black"
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={`flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-semibold transition-all ${
                isAnnual ? "bg-black text-white shadow-xs font-bold" : "text-black/60 hover:text-black"
              }`}
            >
              Annual Billing
              <span className="rounded-full bg-emerald-500/15 text-emerald-700 px-2 py-0.5 text-xs font-bold uppercase tracking-wider">
                Save 20%
              </span>
            </button>
          </div>
        </section>

        {/* Pricing Cards Grid */}
        <section className="mx-auto max-w-[1340px] px-6 pb-24 lg:px-8">
          <div className={`grid gap-6 items-stretch mx-auto ${
            plansList.length === 3 ? "max-w-5xl lg:grid-cols-3" : "lg:grid-cols-4"
          }`}>
            {plansList.map((plan) => {
              const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
              return (
                <article
                  key={plan.name}
                  className={`section-reveal relative flex h-full flex-col justify-between rounded-[16px] p-8 sm:p-9 transition-all duration-300 ${
                    plan.featured
                      ? "border-2 border-black/15 bg-white text-black shadow-xl scale-[1.02]"
                      : "border border-black/10 bg-white text-black shadow-xs hover:shadow-xl hover:-translate-y-1"
                  }`}
                >
                  {plan.badge && (
                    <div className={`absolute -top-3.5 right-8 inline-flex items-center gap-1.5 rounded-full px-4 py-1 text-xs font-extrabold uppercase tracking-widest text-white shadow-md ${
                      plan.featured ? "bg-[#ff4b2f]" : "bg-neutral-900"
                    }`}>
                      {plan.featured && <Sparkles className="h-3 w-3 fill-current" />}
                      <span>{plan.badge}</span>
                    </div>
                  )}

                  <div>
                    <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-black/45">
                      {plan.name}
                    </p>

                    <div className="mt-5 flex items-baseline gap-1.5">
                      <span className="text-4xl font-extrabold tracking-tight sm:text-5xl text-black">
                        ₹{price.toLocaleString()}
                      </span>
                      <span className="text-sm font-normal text-black/55">
                        / month
                      </span>
                    </div>

                    <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-700">
                      <Zap className="h-3.5 w-3.5 fill-current" />
                      <span>{plan.minutes}</span>
                    </div>

                    <p className="mt-3 text-sm font-normal leading-relaxed text-black/70 min-h-[40px]">
                      {plan.note}
                    </p>
                  </div>

                  {/* Feature List */}
                  <div className="my-8 flex-1 border-t border-black/8 pt-6">
                    <ul className="space-y-3.5">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-xs sm:text-sm font-medium leading-normal text-black/85">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-black/80" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Balanced Button Components */}
                  <Link
                    href="/dashboard"
                    className={`group flex h-12 w-full items-center justify-center gap-2 rounded-full font-bold text-sm shadow-sm transition-all duration-200 active:scale-[0.98] ${
                      plan.featured
                        ? "bg-[#ff4b2f] text-white hover:bg-[#e03a1e] shadow-md hover:shadow-lg"
                        : "bg-black text-white hover:bg-neutral-800 hover:shadow-md"
                    }`}
                  >
                    <span>{plan.action}</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </article>
              );
            })}
          </div>

          {/* Dedicated Telephony & Calling Channel Plan */}
          <div className="mt-10 rounded-[28px] border border-black/10 bg-white p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-left">
            <div className="space-y-2 max-w-2xl">
              <h3 className="text-2xl font-bold text-black tracking-tight">
                Dedicated Phone Number & Concurrent Calling Channel Plan
              </h3>
              <p className="text-sm text-black/70 font-light leading-relaxed">
                Add dedicated virtual business numbers (080, 022, 011, or 1800 Toll-Free) and dedicated multi-channel call concurrency for inbound call answering & outbound AI campaigns.
              </p>
              <div className="pt-2 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-black/80">
                <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-[#ff4b2f]" /> 1 Dedicated Business Virtual Number</span>
                <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-[#ff4b2f]" /> Dedicated Calling Concurrency Channel</span>
                <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-[#ff4b2f]" /> TRAI & DLT Compliant SIP Trunking</span>
                <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-[#ff4b2f]" /> Instant Setup & Number Activation</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0 w-full sm:w-auto">
              <div className="text-left md:text-right">
                <span className="text-3xl font-extrabold text-black">₹1,499</span>
                <span className="text-xs font-semibold text-black/60"> /month</span>
                <p className="text-[11px] text-black/50 font-medium mt-0.5">Per dedicated channel & number</p>
              </div>
              <Link
                href="/dashboard/phone-numbers"
                className="w-full sm:w-auto inline-flex h-11 items-center justify-center rounded-full bg-[#ff4b2f] hover:bg-[#e63e24] text-white px-6 text-xs font-bold shadow-sm transition-all hover:scale-[1.02]"
              >
                Get Dedicated Number
              </Link>
            </div>
          </div>
        </section>

        {/* Included in Your Per-Minute Rate Section */}
        <section className="mx-auto max-w-[1340px] px-6 pb-16 lg:px-8">
          <div className="section-reveal rounded-[16px] border border-black/10 bg-white p-8 md:p-10 shadow-xs">
            <p className="font-mono text-xs font-extrabold uppercase tracking-[0.18em] text-black/45 mb-6">
              INCLUDED IN YOUR PER-MINUTE RATE
            </p>
            <div className="grid gap-8 sm:grid-cols-3">
              <div className="flex items-start gap-3">
                <Check className="mt-1 h-5 w-5 shrink-0 text-emerald-600 font-bold" />
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-black">LLM</h3>
                  <p className="mt-1 text-xs font-medium text-black/60">No token charges</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Check className="mt-1 h-5 w-5 shrink-0 text-emerald-600 font-bold" />
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-black">STT</h3>
                  <p className="mt-1 text-xs font-medium text-black/60">Real-time transcription</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Check className="mt-1 h-5 w-5 shrink-0 text-emerald-600 font-bold" />
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-black">TTS</h3>
                  <p className="mt-1 text-xs font-medium text-black/60">Premium voices</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Comparison Table Section */}
        <section className="mx-auto max-w-[1340px] px-6 pb-24 lg:px-8">
          <div className="section-reveal mb-12 text-center">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-black/50">DETAILED COMPARISON</p>
            <h2 className="mt-3 text-3xl font-[340] tracking-[-0.03em] sm:text-5xl">
              Compare features across plans
            </h2>
          </div>

          <div className="section-reveal overflow-x-auto rounded-[16px] border border-black/10 bg-white shadow-xs">
            <table className="w-full min-w-[700px] text-left border-collapse">
              <thead>
                <tr className="border-b border-black/10 bg-neutral-50/80">
                  <th className="p-6 text-sm font-bold text-black">Features</th>
                  <th className="p-6 text-center text-sm font-bold text-black w-48">Call Lite</th>
                  <th className="p-6 text-center text-sm font-bold text-[#ff4b2f] w-48 bg-[#ff4b2f]/5">Call Pro</th>
                  <th className="p-6 text-center text-sm font-bold text-black w-48">Call Elite</th>
                </tr>
              </thead>
              <tbody>
                {featureComparison.map((cat) => (
                  <React.Fragment key={cat.category}>
                    <tr className="border-b border-black/10 bg-neutral-100/50">
                      <td colSpan={4} className="px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-black/60">
                        {cat.category}
                      </td>
                    </tr>
                    {cat.items.map((item) => (
                      <tr key={item.feature} className="border-b border-black/5 hover:bg-neutral-50/50 transition-colors">
                        <td className="p-6 text-xs sm:text-sm font-medium text-black">{item.feature}</td>
                        <td className="p-6 text-center text-xs sm:text-sm font-medium text-black/70">
                          {typeof item.lite === "boolean" ? (
                            item.lite ? <Check className="mx-auto h-4 w-4 text-emerald-600" /> : <Minus className="mx-auto h-4 w-4 text-black/20" />
                          ) : (
                            item.lite
                          )}
                        </td>
                        <td className="p-6 text-center text-xs sm:text-sm font-semibold text-black bg-[#ff4b2f]/5">
                          {typeof item.pro === "boolean" ? (
                            item.pro ? <Check className="mx-auto h-4 w-4 text-[#ff4b2f]" /> : <Minus className="mx-auto h-4 w-4 text-black/20" />
                          ) : (
                            item.pro
                          )}
                        </td>
                        <td className="p-6 text-center text-xs sm:text-sm font-medium text-black/70">
                          {typeof item.elite === "boolean" ? (
                            item.elite ? <Check className="mx-auto h-4 w-4 text-emerald-600" /> : <Minus className="mx-auto h-4 w-4 text-black/20" />
                          ) : (
                            item.elite
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ Accordion Section */}
        <section id="faq" className="mx-auto max-w-[1340px] px-6 pb-24 lg:px-8">
          <div className="section-reveal rounded-[28px] bg-block-cream border border-black/10 p-7 md:p-12">
            <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
              <div>
                <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-black/60">PRICING FAQ</p>
                <h2 className="text-3xl font-[340] leading-[1.06] tracking-[-0.03em] sm:text-5xl">
                  Frequently asked questions
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-black/70">
                  Have questions about plan limits or billing cycles? Reach out to our technical team anytime.
                </p>
                <PrimaryButton href="/dashboard" variant="primary" className="mt-8">
                  Open Dashboard
                </PrimaryButton>
              </div>

              <div className="grid gap-3">
                {faqs.map((faq, index) => {
                  const isOpen = openFaqIndex === index;
                  return (
                    <article
                      key={faq.question}
                      className="rounded-lg border border-black/10 bg-white transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                        className="flex w-full items-center justify-between p-5 text-left text-base font-semibold text-black"
                      >
                        <span>{faq.question}</span>
                        <ChevronDown
                          className={`ml-4 h-5 w-5 shrink-0 transition-transform duration-200 ${
                            isOpen ? "rotate-180 text-[#ff4b2f]" : "text-black/40"
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <p className="px-5 pb-5 text-sm font-light leading-relaxed text-black/75">
                          {faq.answer}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Reference-Matched 100vh Landscape Footer */}
      <footer
        ref={footerRef}
        className="relative z-10 flex min-h-screen w-full flex-col justify-between overflow-hidden bg-[#f7f6f0] bg-cover bg-bottom bg-no-repeat text-black px-6 pt-12 pb-8 sm:px-12 sm:pt-16 sm:pb-12"
        style={{ backgroundImage: "url('/assets/footer-bg.png')" }}
      >
        <div className="mx-auto flex w-full max-w-[1340px] flex-1 flex-col justify-between">
          {/* Top Section: Brand + Clocks (Left) & Nav Links (Right) */}
          <div className="flex flex-col justify-between gap-12 md:flex-row md:items-start">
            {/* Left Column: Brand & World Clocks */}
            <div className="max-w-xl">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="GAP VoicePilot Logo"
                  width={36}
                  height={36}
                  className="h-9 w-9 object-contain"
                />
                <span className="text-xl font-extrabold tracking-tight text-black">
                  GAP <span className="font-array font-bold text-[#ff4b2f]">VoicePilot</span>
                </span>
              </div>

              <p className="mt-4 text-xs sm:text-sm font-normal leading-relaxed text-black/70 max-w-md">
                Sub-240ms AI voice engine for live Indian calls. Built in India at GAP Studio.
                <br />
                An independent voice intelligence & AI calling platform.
              </p>

              {/* World Clocks Row */}
              <div className="mt-8 grid grid-cols-4 gap-4 max-w-md">
                <div>
                  <div className="font-mono text-xs font-bold text-black tracking-wider">
                    {currentTime ? formatTime("Asia/Kolkata") : "18:35:58"}
                  </div>
                  <div className="mt-1 text-xs font-medium text-black/80">Bengaluru</div>
                  <div className="text-xs font-mono font-medium tracking-wider text-black/40 uppercase scale-90 origin-left">INDIA</div>
                </div>

                <div>
                  <div className="font-mono text-xs font-bold text-black tracking-wider">
                    {currentTime ? formatTime("America/New_York") : "08:05:58"}
                  </div>
                  <div className="mt-1 text-xs font-medium text-black/80">New York</div>
                  <div className="text-xs font-mono font-medium tracking-wider text-black/40 uppercase scale-90 origin-left">N. AMERICA</div>
                </div>

                <div>
                  <div className="font-mono text-xs font-bold text-black tracking-wider">
                    {currentTime ? formatTime("Europe/London") : "13:05:58"}
                  </div>
                  <div className="mt-1 text-xs font-medium text-black/80">London</div>
                  <div className="text-xs font-mono font-medium tracking-wider text-black/40 uppercase scale-90 origin-left">EUROPE</div>
                </div>

                <div>
                  <div className="font-mono text-xs font-bold text-black tracking-wider">
                    {currentTime ? formatTime("Asia/Tokyo") : "21:05:58"}
                  </div>
                  <div className="mt-1 text-xs font-medium text-black/80">Tokyo</div>
                  <div className="text-xs font-mono font-medium tracking-wider text-black/40 uppercase scale-90 origin-left">ASIA</div>
                </div>
              </div>
            </div>

            {/* Right Column: Links Grid */}
            <div className="flex gap-16 sm:gap-24">
              <div>
                <h4 className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-black/40">
                  PRODUCT
                </h4>
                <ul className="mt-5 flex flex-col gap-3 text-xs font-medium text-black/75">
                  <li>
                    <Link href="/product" className="transition-colors hover:text-black">
                      Overview
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard" className="transition-colors hover:text-black">
                      Console Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link href="/pricing" className="transition-colors hover:text-black">
                      Pricing Plans
                    </Link>
                  </li>
                  <li>
                    <a href="#" className="inline-flex items-center gap-1 transition-colors hover:text-black">
                      <span>Developer Docs</span>
                      <span className="text-xs">↗</span>
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-black/40">
                  LEGAL
                </h4>
                <ul className="mt-5 flex flex-col gap-3 text-xs font-medium text-black/75">
                  <li>
                    <a href="#" className="transition-colors hover:text-black">
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="transition-colors hover:text-black">
                      Terms of Service
                    </a>
                  </li>
                  <li>
                    <a href="#" className="transition-colors hover:text-black">
                      TRAI & DLT Compliance
                    </a>
                  </li>
                  <li>
                    <a href="#" className="transition-colors hover:text-black">
                      Security & DPA
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Middle Centered Info Line (Positioned just above mountain peak) */}
          <div className="mt-auto mb-12 flex flex-col items-center justify-center text-center">
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-mono text-xs font-semibold uppercase tracking-wider text-black/70 sm:text-xs">
              <span>© {new Date().getFullYear()} GAP VOICEPILOT</span>
              <span className="text-black/30">•</span>
              <span className="hover:text-black cursor-pointer underline decoration-black/30 underline-offset-4">GAPVOICE.DEV</span>
              <span className="text-black/30">•</span>
              <span className="hover:text-black cursor-pointer underline decoration-black/30 underline-offset-4">HELLO@GAPVOICE.DEV</span>
              <span className="text-black/30">•</span>
              <span>BUILT IN INDIA</span>
              <span className="text-black/30">•</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                ALL SYSTEMS OPERATIONAL
              </span>
            </div>
            <p className="mt-2 text-xs font-medium text-black/40 max-w-xl leading-normal">
              GAP VoicePilot is an enterprise AI voice engine. All trademarks belong to their respective owners.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
