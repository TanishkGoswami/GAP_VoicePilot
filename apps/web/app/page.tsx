"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { RuixenGradientFooter } from "@/components/ui/ruixen-gradient-footer";
import { LiveAgentDemoSection } from "@/components/LiveAgentDemoSection";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Activity,
  ArrowRight,
  ArrowUp,
  BarChart3,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Code2,
  DatabaseZap,
  Globe2,
  Headphones,
  LineChart,
  LogOut,
  Menu,
  Mic,
  Phone,
  PhoneCall,
  Play,
  ShieldCheck,
  Sparkles,
  Split,
  Star,
  Terminal,
  X,
  Zap,
} from "lucide-react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const navItems = [
  { label: "Product", href: "/product" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "Workflow", href: "#workflow" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "#faq" },
];

const capabilityBlocks = [
  {
    label: "Streaming voice",
    title: "A direct voice loop tuned for fast, natural replies.",
    description:
      "Speech recognition, reasoning, and voice output stay stitched together through a realtime pipeline built for live phone conversations.",
    icon: Zap,
    surface: "bg-block-lime",
  },
  {
    label: "Regional language",
    title: "Hindi, English, and Hinglish conversations feel local.",
    description:
      "Agents can greet, qualify, and recover naturally across mixed-language calls without making your customer feel transferred to a script.",
    icon: Globe2,
    surface: "bg-block-lilac",
  },
  {
    label: "Telephony ready",
    title: "Bind numbers, route calls, and launch campaigns from one place.",
    description:
      "Use dedicated business numbers, SIP routes, and campaign dispatching without hiding the operational state from your team.",
    icon: Phone,
    surface: "bg-block-mint",
  },
];

const workflowSteps = [
  {
    title: "Design the agent",
    copy: "Define the goal, language, fallback behavior, and handoff rules before the first call goes live.",
    icon: Bot,
  },
  {
    title: "Connect numbers",
    copy: "Attach phone numbers and choose inbound support, outbound campaign, or mixed routing.",
    icon: PhoneCall,
  },
  {
    title: "Watch every call",
    copy: "Review live status, transcript notes, outcomes, recordings, and follow-up signals in the dashboard.",
    icon: LineChart,
  },
];

const pricingPlans = [
  {
    audience: "FOR STARTERS",
    name: "Start",
    description: "250 AI calling minutes included.",
    price: "₹1,499",
    unit: "/mo",
    feeNote: "Effective rate: ₹6.00 / min • ₹0 platform fee.",
    action: "Start building",
    headerBg: "bg-[#e4ebd9] border-b border-black/10",
    buttonVariant: "dark",
    features: [
      "250 AI Calling Minutes",
      "₹6.00 / min per-minute rate",
      "Hindi, English & Hinglish Support",
      "Custom AI System Prompts",
      "Basic Lead & Contact Capture",
    ],
  },
  {
    audience: "FOR TEAMS",
    name: "Build",
    description: "Daily sales calls, live transfers & auto-CRM sync.",
    price: "₹4,999",
    unit: "/mo",
    feeNote: "Effective rate: ₹5.00 / min • Includes 1,000 mins.",
    action: "Start building",
    headerBg: "bg-[#f9f3e5] border-b border-black/10",
    buttonVariant: "dark",
    features: [
      "1,000 AI Calling Minutes",
      "₹5.00 / min per-minute rate",
      "Realtime Live Call Transfer",
      "Automatic CRM Auto-Syncing",
      "Live Call Transcripts & Recording",
    ],
  },
  {
    audience: "FOR HIGH VOLUME",
    name: "Scale",
    description: "Lowest per-minute rates for high-volume dialers.",
    price: "₹9,999",
    unit: "/mo",
    feeNote: "Effective rate: ₹5.00 / min • Includes 2,000 mins.",
    action: "Start building",
    headerBg: "bg-[#faeae1] border-b border-black/10",
    buttonVariant: "dark",
    features: [
      "2,000 AI Calling Minutes",
      "₹5.00 / min per-minute rate",
      "Unlimited Multi-Agent Workflows",
      "Priority SIP Latency Routing",
      "Dedicated Account Manager",
    ],
  },
  {
    audience: "FOR ORGANIZATIONS",
    name: "Enterprise",
    description: "Dedicated infrastructure with controls regulated teams require.",
    price: "Custom",
    unit: "",
    feeNote: "Contracted to your volume.",
    action: "Talk to our team",
    headerBg: "bg-[#e7e9e8] border-b border-black/10",
    buttonVariant: "outline",
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

const faqs = [
  {
    question: "Can I test VoicePilot without a custom setup?",
    answer:
      "Yes. The public landing page stays open, and the dashboard flow lets you configure agents, phone numbers, campaigns, and call tests when you are ready.",
  },
  {
    question: "What makes the voice experience feel fast?",
    answer:
      "The product is organized around a realtime speech-to-reasoning-to-speech loop, with live call state visible instead of hidden behind batch jobs.",
  },
  {
    question: "Does it support Indian language workflows?",
    answer:
      "Yes. The homepage and product copy center Hindi, English, and Hinglish use cases for sales, support, and local business calls.",
  },
  {
    question: "Can I connect real business numbers?",
    answer:
      "Yes. The dashboard includes phone-number and campaign areas so teams can connect numbers and run inbound or outbound workflows.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const pageRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
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
              audience: feats.audience || (isEnt ? "FOR ORGANIZATIONS" : "FOR STARTERS"),
              name: p.name || (isEnt ? "Enterprise" : "Plan"),
              description: feats.description || `${p.included_credits} AI calling minutes included.`,
              price: p.price_monthly > 0 ? `₹${p.price_monthly.toLocaleString()}` : "Custom",
              unit: p.price_monthly > 0 ? "/mo" : "",
              feeNote: feats.feeNote || (p.price_monthly > 0 ? `Includes ${p.included_credits} mins.` : "Contracted to your volume."),
              action: isEnt ? "Talk to our team" : "Start building",
              headerBg: p.id === "call_lite" ? "bg-[#e4ebd9] border-b border-black/10" : p.id === "call_pro" ? "bg-[#f9f3e5] border-b border-black/10" : p.id === "call_elite" ? "bg-[#faeae1] border-b border-black/10" : "bg-[#e7e9e8] border-b border-black/10",
              buttonVariant: isEnt ? "outline" : "dark",
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
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 350);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    let isMounted = true;
    const checkUser = async () => {
      try {
        const { createClient } = await import("@/utils/supabase/client");
        const supabase = createClient();

        // 0. Handle URL hash tokens (from Supabase Magic Link / SSO redirect)
        if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
          const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (data?.session) {
              window.location.href = "/dashboard";
              return;
            }
          }
        }

        // 1. Instant check from local session storage
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (isMounted && session?.user) {
          setUser(session.user);
        }

        // 2. Validate with Supabase server
        const {
          data: { user: serverUser },
        } = await supabase.auth.getUser();
        if (isMounted) {
          setUser(serverUser ?? session?.user ?? null);
        }
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsAuthLoading(false);
      }
    };

    void checkUser();
    return () => {
      isMounted = false;
    };
  }, []);

  useGSAP(
    () => {
      const root = pageRef.current;
      if (!root) return;

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const heroItems = gsap.utils.toArray<HTMLElement>(".hero-reveal", root);
      const revealItems = gsap.utils.toArray<HTMLElement>(
        ".section-reveal",
        root,
      );

      if (reduceMotion) {
        gsap.set([...heroItems, ...revealItems], {
          autoAlpha: 1,
          y: 0,
          clearProps: "transform",
        });
        return;
      }

      gsap.set(heroItems, { autoAlpha: 0, y: 28 });
      gsap.set(revealItems, { autoAlpha: 0, y: 34 });

      gsap
        .timeline({ defaults: { duration: 0.8, ease: "power3.out" } })
        .to(heroItems, { autoAlpha: 1, y: 0, stagger: 0.09 })
        .fromTo(
          ".hero-pulse",
          { scale: 0.96, rotate: -1 },
          { scale: 1, rotate: 0, duration: 1.1, ease: "elastic.out(1, 0.65)" },
          "-=0.65",
        );

      ScrollTrigger.batch(revealItems, {
        start: "top 82%",
        once: true,
        onEnter: (batch) => {
          gsap.to(batch, {
            autoAlpha: 1,
            y: 0,
            duration: 0.75,
            ease: "power3.out",
            stagger: 0.08,
            overwrite: true,
          });
        },
      });
    },
    { scope: pageRef },
  );

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email ? user.email.split("@")[0] : "User");

  return (
    <div
      ref={pageRef}
      className="min-h-screen bg-[#f7f6f0] text-black font-sans selection:bg-block-lime selection:text-black"
    >
      {/*
        THESIS: VoicePilot becomes an editorial operating-room homepage, not another blue SaaS pitch.
        OWN-WORLD: White canvas, black ink, pill controls, pastel poster blocks, and flat product-system compositions from DESIGN.md.
        STORY: A visitor sees the live-call mechanism, then understands setup, monitoring, pricing, and next action.
        FIRST VIEWPORT: Sticky monochrome nav, oversized headline, dual CTA, and a lilac realtime console artifact.
        FORM: Established DESIGN.md world extended into a full persuasive homepage; GSAP animates one staged reveal system.
      */}

      <header
        className={`sticky top-2 z-50 mx-auto w-full md:w-[82%] lg:w-[76%] max-w-[1080px] px-3 sm:px-4 transition-all duration-300 ${
          isFooterVisible
            ? "opacity-0 -translate-y-8 pointer-events-none"
            : "opacity-100 translate-y-0 pointer-events-auto"
        }`}
      >
        <div className="flex h-16 items-center justify-between rounded-full border border-white/70 bg-white/75 p-2 pl-4 pr-2 shadow-[0_10px_35px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.9)_inset] backdrop-blur-2xl ring-1 ring-black/5 transition-all duration-300">
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0"
            title="GAP VoicePilot Home"
          >
            <Image
              src="/logo.png"
              alt="GAP VoicePilot Logo"
              width={40}
              height={40}
              className="h-9.5 w-9.5 object-contain"
              priority
            />
            <span className="text-xl font-extrabold tracking-tight text-black flex items-center gap-1">
              <span>GAP</span>
              <span className="font-array font-bold text-[#ff4b2f]">VoicePilot</span>
            </span>
          </Link>

          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Primary navigation"
          >
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-black/70 transition-all hover:bg-black/5 hover:text-black"
              >
                {item.label}
              </a>
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
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm transition-all duration-200 hover:border-black/25 hover:shadow-md hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                    aria-label="Open account menu"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-black via-neutral-900 to-neutral-800 text-xs font-semibold uppercase tracking-wider text-white shadow-inner">
                        {displayName.slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={12}
                  className="w-64 rounded-[20px] border border-black/10 bg-white/95 p-2 shadow-2xl backdrop-blur-xl"
                >
                  <DropdownMenuLabel className="px-3.5 py-2.5">
                    <span className="block truncate text-sm font-semibold text-black">
                      {displayName}
                    </span>
                    {user.email ? (
                      <span className="mt-0.5 block truncate text-xs font-medium text-black/45">
                        {user.email}
                      </span>
                    ) : null}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-black/5" />
                  <DropdownMenuItem
                    asChild
                    className="rounded-xl px-3.5 py-2.5 font-medium transition-colors cursor-pointer"
                  >
                    <Link href="/dashboard">Open Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-xl px-3.5 py-2.5 font-medium text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer"
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
                <Link
                  href="/login"
                  className="rounded-full px-3.5 py-2 text-xs font-semibold text-black/70 transition-colors hover:bg-black/5 hover:text-black"
                >
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
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-black transition-transform active:scale-95 md:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>

        <div
          className={`mt-2 md:hidden ${mobileMenuOpen ? "block" : "hidden"}`}
        >
          <nav
            className="flex flex-col gap-1 rounded-3xl border border-black/10 bg-white/95 p-4 shadow-2xl backdrop-blur-xl"
            aria-label="Mobile navigation"
          >
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-black hover:bg-surface-soft"
              >
                {item.label}
              </a>
            ))}
            <div className="mt-3 grid gap-2 border-t border-black/5 pt-3">
              {user ? (
                <>
                  <div className="rounded-xl bg-surface-soft px-4 py-2.5">
                    <p className="truncate text-sm font-semibold text-black">
                      {displayName}
                    </p>
                    {user.email ? (
                      <p className="mt-0.5 truncate text-xs font-medium text-black/45">
                        {user.email}
                      </p>
                    ) : null}
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={closeMobileMenu}
                    className="btn-pill-primary rounded-full py-2.5 text-center text-xs"
                  >
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      closeMobileMenu();
                      const { signOut } = await import("@/app/actions/auth");
                      await signOut();
                    }}
                    className="btn-pill-secondary rounded-full py-2.5 text-xs text-red-600"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/demo"
                    onClick={closeMobileMenu}
                    className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#ff4b2f]/40 bg-[#fff5f3] px-4 py-2.5 text-xs font-bold text-[#d93620] shadow-xs transition-all hover:bg-[#ffece8]"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#ff4b2f]" />
                    <span>Get a Demo</span>
                  </Link>
                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="btn-pill-secondary rounded-full py-2.5 text-center text-xs"
                  >
                    Sign In
                  </Link>
                  <PrimaryButton
                    href="/dashboard"
                    onClick={closeMobileMenu}
                    className="h-10 w-full justify-between"
                  >
                    Get Started
                  </PrimaryButton>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main>
        <section className="min-h-[calc(100svh-80px)] w-full bg-[#f7f6f0]">
          <div className="hero-reveal relative flex min-h-[calc(100svh-80px)] w-full flex-col overflow-hidden bg-[#f7f6f0] px-5 pb-0 pt-16 sm:px-8 sm:pt-16 lg:px-14">
            <div className="mx-auto flex max-w-5xl flex-1 flex-col items-center text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-surface-soft px-4 py-2 text-xs font-semibold text-black shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
                <span
                  className="flex items-center gap-0.5 text-[#ff4b2f]"
                  aria-label="Five star rating"
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </span>
                <span className="text-black/55">Based on</span>
                <span className="text-black">10,759+ live calls</span>
              </div>

              <h1 className="mt-7 max-w-5xl text-balance font-display text-[clamp(3.45rem,7.5vw,6.7rem)] font-normal leading-[0.92] tracking-[-0.035em] text-black">
                Launch every AI phone agent with no setup & no hidden fees
              </h1>
              <p className="mt-7 max-w-2xl text-base font-light leading-7 tracking-[-0.01em] text-black md:text-xl md:leading-8">
                Build Hindi, English, and Hinglish voice workflows in one fast
                workspace for sales calls, support follow-ups, and campaign
                routing.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                {user ? (
                  <>
                    <PrimaryButton href="/dashboard">
                      Open Dashboard
                    </PrimaryButton>
                    <Link
                      href="/dashboard/assistants"
                      className="inline-flex h-12 items-center justify-center rounded-full border border-black/10 bg-white px-6 text-sm font-semibold text-black hover:bg-surface-soft transition-colors"
                    >
                      Explore agents
                    </Link>
                  </>
                ) : (
                  <>
                    <PrimaryButton href="/dashboard">
                      Start for free
                    </PrimaryButton>
                    <Link
                      href="/demo"
                      className="inline-flex h-12 items-center justify-center rounded-full border border-[#ff4b2f]/55 bg-white px-7 text-base font-semibold text-[#d93620] transition-colors hover:bg-[#fff3ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2f] focus-visible:ring-offset-2"
                    >
                      Get a Demo
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="hero-pulse relative mx-auto mt-auto h-[36vh] min-h-[280px] w-full max-w-[1380px] sm:min-h-[320px] lg:min-h-[360px]">
              <div className="absolute left-1/2 top-1/2 h-[220px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#ff4b2f]/10 via-[#ff9a3c]/15 to-[#ff4b2f]/10 blur-3xl pointer-events-none" />

              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 1180 360"
                fill="none"
                role="img"
                aria-label="VoicePilot connects calling workflows with sales and support tools"
                preserveAspectRatio="none"
              >
                {[72, 112, 152, 192, 232, 272].map((y, index) => (
                  <path
                    key={`left-${y}`}
                    d={`M 0 ${y} C 215 ${y + 34 + index * 4}, 370 ${178 + index * 3}, 590 205`}
                    stroke="#ff4b2f"
                    strokeWidth="1.6"
                    strokeOpacity={0.12 + index * 0.03}
                    className="animate-pulse-glow"
                  />
                ))}
                {[74, 114, 154, 194, 234, 274].map((y, index) => (
                  <path
                    key={`right-${y}`}
                    d={`M 1180 ${y} C 965 ${y + 34 + index * 4}, 810 ${178 + index * 3}, 590 205`}
                    stroke="#ff4b2f"
                    strokeWidth="1.6"
                    strokeOpacity={0.12 + index * 0.03}
                    className="animate-pulse-glow"
                  />
                ))}
              </svg>

              <div className="absolute left-1/2 top-[57%] z-30 flex flex-col items-center -translate-x-1/2 -translate-y-1/2">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-[16px] border border-black/10 bg-white p-1 shadow-[0_14px_35px_rgba(0,0,0,0.1)] transition-all duration-300 hover:scale-105 sm:h-14 sm:w-14 sm:p-1.5">
                  <Image
                    src="/logo.png"
                    alt="GAP VoicePilot"
                    width={56}
                    height={56}
                    className="h-full w-full object-contain rounded-[10px]"
                  />
                </div>
              </div>

              {[
                {
                  name: "Agent",
                  label: "AI Voice Agent",
                  className: "left-[5%] sm:left-[10%] top-[14%] sm:top-[16%]",
                  icon: Bot,
                  surface: "bg-[#f4fce3] border-[#d8f5a2] text-[#2b5200]",
                  float: "animate-float-slow",
                },
                {
                  name: "Calls",
                  label: "Live Call Routing",
                  className: "left-[18%] sm:left-[24%] top-[54%] sm:top-[56%]",
                  icon: PhoneCall,
                  surface: "bg-white border-black/10 text-black shadow-md",
                  float: "animate-float-reverse",
                },
                {
                  name: "Reports",
                  label: "Realtime Analytics",
                  className:
                    "left-[4%] sm:left-[9%] bottom-[12%] sm:bottom-[8%]",
                  icon: BarChart3,
                  surface: "bg-black border-black text-white shadow-xl",
                  float: "animate-float-slow",
                },
                {
                  name: "CRM",
                  label: "CRM Auto-Sync",
                  className:
                    "right-[20%] sm:right-[26%] top-[53%] sm:top-[55%]",
                  icon: DatabaseZap,
                  surface: "bg-[#fff0f6] border-[#ffdeeb] text-[#a61e4d]",
                  float: "animate-float-reverse",
                },
                {
                  name: "Support",
                  label: "Support Handoff",
                  className: "right-[5%] sm:right-[10%] top-[15%] sm:top-[17%]",
                  icon: Headphones,
                  surface: "bg-white border-black/10 text-black shadow-md",
                  float: "animate-float-slow",
                },
                {
                  name: "Campaigns",
                  label: "Outbound Dialing",
                  className:
                    "right-[4%] sm:right-[9%] bottom-[12%] sm:bottom-[8%]",
                  icon: Activity,
                  surface: "bg-[#0c192c] border-black/20 text-white shadow-xl",
                  float: "animate-float-reverse",
                },
              ].map((tile) => {
                const TileIcon = tile.icon;
                return (
                  <div
                    key={tile.name}
                    className={`group absolute z-20 flex items-center gap-2.5 rounded-full border px-3.5 py-2 shadow-lg transition-all duration-300 hover:z-30 hover:scale-105 hover:shadow-2xl sm:px-4 sm:py-2.5 ${tile.className} ${tile.surface} ${tile.float}`}
                    aria-label={tile.label}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/5 p-1 group-hover:scale-110 transition-transform">
                      <TileIcon className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-semibold tracking-tight whitespace-nowrap">
                      {tile.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Interactive Voice AI Agent Live Phone Call Demo */}
        <LiveAgentDemoSection user={user} />

        <section
          id="capabilities"
          className="mx-auto max-w-[1340px] px-6 py-24 lg:px-8"
        >
          <div className="section-reveal max-w-4xl">
            <p className="mb-5 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-black/50">
              Capabilities
            </p>
            <h2 className="text-4xl font-[340] leading-[1.04] tracking-[-0.03em] md:text-6xl">
              The call stack is visible, editable, and ready for operators.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {capabilityBlocks.map((block) => {
              const Icon = block.icon;
              return (
                <article
                  key={block.title}
                  className={`${block.surface} section-reveal flex min-h-[360px] flex-col justify-between rounded-[24px] p-7 md:p-8`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-black/65">
                      {block.label}
                    </p>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold leading-tight tracking-[-0.015em] text-black">
                      {block.title}
                    </h3>
                    <p className="mt-4 text-base font-light leading-7 text-black">
                      {block.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section
          id="workflow"
          className="mx-auto max-w-[1340px] px-6 pb-24 lg:px-8"
        >
          <div className="section-reveal rounded-[24px] bg-block-lime p-7 md:p-12">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <div>
                <p className="mb-5 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-black/60">
                  Workflow
                </p>
                <h2 className="text-4xl font-[340] leading-[1.04] tracking-[-0.03em] md:text-6xl">
                  From agent brief to answered call.
                </h2>
              </div>
              <p className="max-w-xl text-xl font-light leading-8 tracking-[-0.01em] text-black">
                The homepage now shows the operational journey instead of only
                listing features: design, connect, dispatch, and learn from
                every conversation.
              </p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {workflowSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="rounded-[18px] bg-white p-6">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-8 text-2xl font-semibold tracking-[-0.015em]">
                      {step.title}
                    </h3>
                    <p className="mt-4 text-sm font-light leading-6 text-black">
                      {step.copy}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="engine"
          className="mx-auto grid max-w-[1340px] gap-6 px-6 pb-24 lg:grid-cols-[1fr_1.05fr] lg:px-8"
        >
          <div className="section-reveal rounded-[24px] bg-black p-7 text-white md:p-10">
            <p className="mb-5 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
              Realtime console
            </p>
            <h2 className="text-4xl font-[340] leading-[1.04] tracking-[-0.03em] md:text-5xl">
              Every live call leaves a usable trail.
            </h2>
            <p className="mt-6 text-lg font-light leading-8 text-white">
              Monitor call state, capture transcript highlights, and route
              follow-ups without waiting for a separate reporting export.
            </p>
          </div>

          <div className="section-reveal rounded-[24px] bg-block-navy p-5 text-white md:p-7">
            <div className="grid gap-3">
              {[
                {
                  icon: Mic,
                  title: "Speech stream",
                  value: "Listening and transcribing",
                },
                {
                  icon: Split,
                  title: "Decision point",
                  value: "Demo booking intent found",
                },
                {
                  icon: Clock3,
                  title: "Follow-up",
                  value: "Calendar invite queued",
                },
                {
                  icon: ShieldCheck,
                  title: "Operator state",
                  value: "No human handoff needed",
                },
              ].map((row) => {
                const Icon = row.icon;
                return (
                  <div
                    key={row.title}
                    className="flex items-center justify-between gap-5 rounded-[16px] bg-white/10 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {row.title}
                        </p>
                        <p className="mt-1 text-xs font-light text-white/70">
                          {row.value}
                        </p>
                      </div>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-block-lime" />
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1340px] px-6 pb-24 lg:px-8">
          <div className="section-reveal rounded-[24px] bg-block-coral p-7 md:p-12">
            <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
              <div>
                <p className="mb-5 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-black/60">
                  Developer surface
                </p>
                <h2 className="text-4xl font-[340] leading-[1.04] tracking-[-0.03em] md:text-6xl">
                  Integrations stay readable.
                </h2>
                <p className="mt-6 max-w-lg text-lg font-light leading-8 text-black">
                  Keep APIs, webhooks, phone providers, and CRM updates visible
                  as product objects, not hidden settings.
                </p>
              </div>

              <div className="rounded-[18px] bg-white p-5">
                {[
                  { method: "POST", endpoint: "/assistants", icon: Bot },
                  {
                    method: "POST",
                    endpoint: "/campaigns/dispatch",
                    icon: Activity,
                  },
                  { method: "GET", endpoint: "/calls/live", icon: Headphones },
                  {
                    method: "SYNC",
                    endpoint: "/crm/outcomes",
                    icon: DatabaseZap,
                  },
                ].map((api) => {
                  const Icon = api.icon;
                  return (
                    <div
                      key={api.endpoint}
                      className="flex items-center justify-between gap-4 border-b border-hairline py-4 last:border-b-0"
                    >
                      <div className="flex items-center gap-4">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-soft text-black">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-black/45">
                            {api.method}
                          </p>
                          <p className="mt-1 font-mono text-sm font-semibold text-black">
                            {api.endpoint}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-black/45" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section
          id="pricing"
          className="mx-auto max-w-[1340px] px-6 pb-24 lg:px-8"
        >
          <div className="section-reveal mb-12">
            <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-black/50">
              PRICING
            </p>
            <h2 className="text-4xl font-bold leading-[1.04] tracking-[-0.03em] md:text-6xl text-black">
              Clear pricing across every call.
            </h2>
            <p className="mt-4 max-w-2xl text-base font-light leading-relaxed text-black/75 md:text-lg">
              No token charges. No model-provider pass-throughs. No surprise bills.
            </p>
          </div>

          <div className={`grid gap-5 items-stretch mx-auto ${
            plansList.length === 3 ? "max-w-6xl sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4"
          }`}>
            {plansList.map((plan) => (
              <article
                key={plan.name}
                className="section-reveal flex flex-col rounded-[16px] border border-black/10 bg-white overflow-hidden shadow-xs transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                {/* Header Pastel Block */}
                <div className={`p-6 ${plan.headerBg}`}>
                  <p className="font-mono text-xs font-extrabold uppercase tracking-[0.18em] text-black/60">
                    {plan.audience}
                  </p>
                  <h3 className="mt-2 text-2xl font-bold tracking-tight text-black">
                    {plan.name}
                  </h3>
                  <p className="mt-1.5 min-h-[36px] text-xs font-normal leading-relaxed text-black/70">
                    {plan.description}
                  </p>
                </div>

                {/* Body Content */}
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight text-black">
                      {plan.price}
                    </span>
                    {plan.unit && (
                      <span className="text-xs font-semibold text-black/60">
                        {plan.unit}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 mb-6 min-h-[18px] text-xs font-medium text-black/55">
                    {plan.feeNote}
                  </p>

                  {plan.buttonVariant === "outline" ? (
                    <Link
                      href="/demo"
                      className="inline-flex w-full items-center justify-center rounded-full border border-black/20 bg-white text-black hover:bg-black/5 py-3 text-xs font-bold transition-all active:scale-[0.98] h-11"
                    >
                      {plan.action}
                    </Link>
                  ) : (
                    <Link
                      href="/dashboard"
                      className="inline-flex w-full items-center justify-center rounded-full py-3 text-xs font-bold transition-all active:scale-[0.98] bg-black text-white hover:bg-neutral-800 shadow-sm"
                    >
                      {plan.action}
                    </Link>
                  )}

                  <ul className="mt-7 space-y-3 font-sans">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-xs font-medium leading-normal text-black/80">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-black/75" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>

          {/* Dedicated Telephony & Calling Channel Plan */}
          <div className="mt-8 rounded-[24px] border border-black/10 bg-white p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-left">
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

        <section id="faq" className="mx-auto max-w-[1340px] px-6 pb-24 lg:px-8">
          <div className="section-reveal rounded-[24px] bg-block-lime p-7 md:p-12">
            <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
              <div>
                <p className="mb-5 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-black/60">
                  FAQ
                </p>
                <h2 className="text-4xl font-[340] leading-[1.04] tracking-[-0.03em] md:text-5xl">
                  Questions before the first call?
                </h2>
                <PrimaryButton
                  href="/dashboard"
                  variant="light"
                  className="mt-8"
                >
                  Open Dashboard
                </PrimaryButton>
              </div>

              <div className="grid gap-3">
                {faqs.map((faq, index) => {
                  const isOpen = openFaqIndex === index;
                  return (
                    <div
                      key={faq.question}
                      className="overflow-hidden rounded-[18px] bg-white border border-black/5 shadow-sm transition-all duration-200"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                        className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-black/[0.02]"
                        aria-expanded={isOpen}
                      >
                        <h3 className="text-base font-semibold tracking-[-0.01em] text-black">
                          {faq.question}
                        </h3>
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-300 ${
                            isOpen
                              ? "rotate-180 bg-black text-white"
                              : "bg-surface-soft text-black/60"
                          }`}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </span>
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 pt-0 text-sm font-light leading-6 text-black/80">
                          <p className="border-t border-black/5 pt-3">
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </div>
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

      {/* Floating Scroll to Top Button */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Scroll to top of page"
        title="Scroll to top"
        className={`group fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white/90 text-black shadow-[0_12px_32px_rgba(0,0,0,0.14)] backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:bg-black hover:text-white active:scale-95 sm:bottom-8 sm:right-8 ${
          showScrollTop
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-6 opacity-0 pointer-events-none"
        }`}
      >
        <ArrowUp className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5" />
      </button>
    </div>
  );
}
