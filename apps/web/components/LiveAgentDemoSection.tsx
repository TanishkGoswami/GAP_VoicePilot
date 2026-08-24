"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import {
  PhoneCall,
  Play,
  Square,
  Lock,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Phone,
  CheckCircle2,
  AlertCircle,
  X,
  Volume2,
  VolumeX,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { triggerDemoCallAction } from "@/app/actions/calls";

export interface LiveAgentDemoSectionProps {
  user?: User | null;
  assistantId?: string;
  className?: string;
}

export interface AgentCardConfig {
  id: string;
  industry: string;
  tag: string;
  title: string;
  description: string;
  sampleText: string;
  voiceGender: "female" | "male";
  accent: string;
  orbGradient: string;
  audioUrl: string;
}

export const AGENT_CARDS: AgentCardConfig[] = [
  {
    id: "hospitality-hindi",
    industry: "front desk & hospitality.",
    tag: "FRONT DESK",
    title: "Aarti",
    description: "Handles front-desk inquiries, forwards calls, and books visitor appointments in clear, natural Hindi.",
    sampleText: "Namaste! Welcome to GAP Studio. How can I assist with your room reservation or direct your call today?",
    voiceGender: "female",
    accent: "Hindi (Female)",
    orbGradient: "from-emerald-400 via-teal-500 to-emerald-600",
    audioUrl: "https://ai.azure.com/speechassetscache/ttsvoice/Masterpieces/hi-IN-Aarti-General-Audio.wav",
  },
  {
    id: "support-hindi",
    industry: "customer support.",
    tag: "24/7 SUPPORT",
    title: "Arjun",
    description: "Polite customer support specialist that resolves product queries and tracks delivery orders in natural Hindi.",
    sampleText: "Namaste Amit Ji! I can help check your active delivery status or update your order address immediately.",
    voiceGender: "male",
    accent: "Hindi (Male)",
    orbGradient: "from-blue-500 via-indigo-500 to-sky-600",
    audioUrl: "https://ai.azure.com/speechassetscache/ttsvoice/Masterpieces/hi-IN-Arjun-General-Audio.wav",
  },
  {
    id: "collections-hindi",
    industry: "EMI & debt recovery.",
    tag: "COLLECTIONS",
    title: "Aarav",
    description: "Polite, compliant EMI recovery assistant that negotiates payment dates in natural Hindi.",
    sampleText: "Namaste Mr. Sharma, this is an automated courtesy reminder regarding your EMI payment of four thousand five hundred rupees due tomorrow.",
    voiceGender: "male",
    accent: "Hindi (Male)",
    orbGradient: "from-slate-700 via-neutral-800 to-black",
    audioUrl: "https://ai.azure.com/speechassetscache/ttsvoice/Masterpieces/hi-IN-Aarav-General-Audio.wav",
  },
  {
    id: "insurance-english",
    industry: "insurance.",
    tag: "INSURANCE & CLAIMS",
    title: "Aarti",
    description: "Automates FNOL claims intake, policy inquiries, and instant coverage verification in Indian English.",
    sampleText: "Hello! Calling from GAP VoicePilot. I can assist you with your vehicle claim status or policy renewal right now.",
    voiceGender: "female",
    accent: "Indian English (Female)",
    orbGradient: "from-amber-400 via-orange-500 to-amber-600",
    audioUrl: "https://ai.azure.com/speechassetscache/ttsvoice/Masterpieces/en-IN-Aarti-General-Audio.wav",
  },
  {
    id: "financial-english",
    industry: "financial services.",
    tag: "FINANCIAL SERVICES",
    title: "Arjun",
    description: "Qualifies loan applicants, verifies income eligibility, and books advisor appointments in Indian English.",
    sampleText: "Hello Rohan! Thank you for requesting information on our personal loan rates. Are you looking to borrow for home renovation or business expansion?",
    voiceGender: "male",
    accent: "Indian English (Male)",
    orbGradient: "from-[#ff4b2f] via-rose-500 to-red-600",
    audioUrl: "https://ai.azure.com/speechassetscache/ttsvoice/Masterpieces/en-IN-Arjun-General-Audio.wav",
  },
  {
    id: "sales-english",
    industry: "lead generation & sales.",
    tag: "LEAD GENERATION",
    title: "Aarav",
    description: "Identifies customer needs, schedules sales demos, and routes high-intent prospects in Indian English.",
    sampleText: "Hello! I can help you schedule a demo with our technical expert or answer any questions about our subscription pricing.",
    voiceGender: "male",
    accent: "Indian English (Male)",
    orbGradient: "from-purple-500 via-violet-600 to-indigo-700",
    audioUrl: "https://ai.azure.com/speechassetscache/ttsvoice/Masterpieces/en-IN-Aarav-General-Audio.wav",
  },
];

export function LiveAgentDemoSection({
  user,
  assistantId,
  className = "",
}: LiveAgentDemoSectionProps) {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [showCallModal, setShowCallModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Form State inside modal
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [callStatus, setCallStatus] = useState<"idle" | "connecting" | "ringing" | "success" | "error">("idle");
  const [callError, setCallError] = useState<string>("");
  const [configuredId, setConfiguredId] = useState<string>(assistantId || "");

  const activeCard = AGENT_CARDS[activeIndex];
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    if (!configuredId && typeof window !== "undefined") {
      const envId = process.env.NEXT_PUBLIC_DEMO_ASSISTANT_ID || "";
      if (envId) setConfiguredId(envId);
    }
  }, [configuredId]);

  const handlePrevCard = () => {
    if (isPlayingAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlayingAudio(false);
    }
    setActiveIndex((prev) => (prev === 0 ? AGENT_CARDS.length - 1 : prev - 1));
  };

  const handleNextCard = () => {
    if (isPlayingAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlayingAudio(false);
    }
    setActiveIndex((prev) => (prev === AGENT_CARDS.length - 1 ? 0 : prev + 1));
  };

  // Audio voice sample preview player using HTML5 Audio
  const togglePlayAudioSample = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    if (typeof window === "undefined") return;

    if (isPlayingAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlayingAudio(false);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(activeCard.audioUrl);
    audioRef.current = audio;

    audio.onended = () => {
      setIsPlayingAudio(false);
    };
    audio.onerror = () => {
      setIsPlayingAudio(false);
    };

    setIsPlayingAudio(true);
    audio.play().catch((err) => {
      console.warn("Audio playback failed or was interrupted:", err);
      setIsPlayingAudio(false);
    });
  };

  // Trigger Phone Call or Auth Gate
  const handleInitiateCallTrigger = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setShowCallModal(true);
  };

  const handleDispatchCall = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setShowCallModal(false);
      setShowAuthModal(true);
      return;
    }

    if (!customerPhone.trim()) {
      setCallError("Please enter your mobile phone number.");
      setCallStatus("error");
      return;
    }

    setIsCalling(true);
    setCallStatus("connecting");
    setCallError("");

    try {
      setTimeout(async () => {
        setCallStatus("ringing");
        const res = await triggerDemoCallAction({
          customerNumber: customerPhone,
          customerName: customerName || "Website Visitor",
          useCase: activeCard.title,
          assistantId: configuredId || assistantId,
        });

        if (res.success) {
          setCallStatus("success");
        } else {
          setCallStatus("error");
          setCallError(res.error || "Unable to dispatch call. Verify phone format (+91...).");
        }
        setIsCalling(false);
      }, 1000);
    } catch (err: any) {
      setCallStatus("error");
      setCallError(err.message || "Failed to connect to telephony backend.");
      setIsCalling(false);
    }
  };

  return (
    <section
      id="live-demo"
      className={`relative w-full bg-[#f7f6f0] py-16 sm:py-24 text-black ${className}`}
    >
      <div className="mx-auto w-full max-w-[1240px] px-6 lg:px-8">
        {/* Two Column Layout matching User Reference Screenshot 2 */}
        <div className="grid gap-12 lg:grid-cols-12 items-center">
          {/* Left Column: Heading, Pitch & Primary CTA */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-black leading-[1.08]">
              Voice AI for <br />
              <span className="text-[#ff4b2f] transition-all font-array">
                {activeCard.industry}
              </span>
            </h2>

            <p className="mt-6 text-base sm:text-lg font-light leading-relaxed text-black/75 max-w-md">
              Built for high-stakes phone calls where security and trust actually matter.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button
                type="button"
                onClick={handleInitiateCallTrigger}
                className="inline-flex h-12 items-center justify-center rounded-xl bg-black px-7 text-sm font-bold text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.98] cursor-pointer"
              >
                <span>Book a call</span>
              </button>

              <button
                type="button"
                onClick={togglePlayAudioSample}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-black/15 bg-white px-6 text-sm font-semibold text-black transition-all hover:bg-black/5 cursor-pointer"
              >
                {isPlayingAudio ? (
                  <>
                    <VolumeX className="h-4 w-4 text-[#ff4b2f]" />
                    <span>Stop Sample</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4 text-black" />
                    <span>Listen to Voice Sample</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-8 flex items-center gap-2 text-xs font-mono font-medium text-black/60">
              <span className="font-bold text-black tracking-tight">598,740,444</span>
              <span>calls resolved to date</span>
            </div>
          </div>

          {/* Right Column: Stacked Card Carousel matching User Reference Screenshot 2 */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center relative">
            <div className="relative flex items-center justify-center w-full min-h-[380px] sm:min-h-[420px]">
              {/* Left Arrow Navigation */}
              <button
                type="button"
                onClick={handlePrevCard}
                aria-label="Previous voice agent"
                className="absolute -left-2 sm:left-0 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-md border border-black/10 transition-transform hover:scale-110 active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Stacked Cards Container */}
              <div className="relative w-full max-w-[290px] sm:max-w-[320px] h-[340px] sm:h-[370px] flex items-center justify-center">
                {AGENT_CARDS.map((card, idx) => {
                  const isCurrent = idx === activeIndex;
                  const isPrev = idx === (activeIndex === 0 ? AGENT_CARDS.length - 1 : activeIndex - 1);
                  const isNext = idx === (activeIndex === AGENT_CARDS.length - 1 ? 0 : activeIndex + 1);

                  if (!isCurrent && !isPrev && !isNext) return null;

                  let transformClasses = "scale-90 opacity-40 z-0 pointer-events-none";
                  if (isCurrent) {
                    transformClasses = "scale-100 opacity-100 z-20 shadow-xl border border-black/15";
                  } else if (isPrev) {
                    transformClasses = "-translate-x-12 scale-90 opacity-60 z-10 border border-black/10 pointer-events-none";
                  } else if (isNext) {
                    transformClasses = "translate-x-12 scale-90 opacity-60 z-10 border border-black/10 pointer-events-none";
                  }

                  return (
                    <div
                      key={card.id}
                      className={`absolute inset-0 flex flex-col items-center justify-between rounded-[24px] bg-white p-7 text-center transition-all duration-500 ease-out ${transformClasses}`}
                    >
                      <div className="w-full flex flex-col items-center">
                        {/* Circular Orb Visualizer with Play Icon */}
                        <div
                          onClick={isCurrent ? togglePlayAudioSample : undefined}
                          className={`relative flex h-32 w-32 sm:h-36 sm:w-36 items-center justify-center rounded-full bg-gradient-to-tr ${card.orbGradient} shadow-md my-3 transition-transform duration-300 ${
                            isCurrent ? "cursor-pointer hover:scale-105" : ""
                          }`}
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 backdrop-blur-md shadow-sm">
                            {isCurrent && isPlayingAudio ? (
                              <Square className="h-5 w-5 text-black fill-black" />
                            ) : (
                              <Play className="h-6 w-6 text-black fill-black ml-0.5" />
                            )}
                          </div>
                        </div>

                        <span className="mt-2 text-xs font-mono font-bold uppercase tracking-widest text-black/50">
                          GAP VOICEPILOT
                        </span>

                        <h3 className="mt-1 text-xl font-bold tracking-tight text-black">
                          {card.title}
                        </h3>
                        <p className="mt-1 text-xs font-light text-black/70 leading-relaxed max-w-[220px]">
                          {card.description}
                        </p>
                      </div>

                      <div className="w-full pt-3 border-t border-black/5 flex items-center justify-center gap-1.5 text-xs font-mono font-semibold text-black/60">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#ff4b2f]" />
                        <span>{card.accent}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Arrow Navigation */}
              <button
                type="button"
                onClick={handleNextCard}
                aria-label="Next voice agent"
                className="absolute -right-2 sm:right-0 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-md border border-black/10 transition-transform hover:scale-110 active:scale-95 cursor-pointer"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Click to speak caption matching User Reference Screenshot 2 */}
            <button
              type="button"
              onClick={handleInitiateCallTrigger}
              className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-black/70 hover:text-black transition-colors cursor-pointer"
            >
              <span className="text-[#ff4b2f]">➤</span>
              <span>Click to speak with an agent</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Call Dispatch Modal Dialog */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-[28px] border border-black/10 bg-white p-7 sm:p-8 shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setShowCallModal(false);
                setCallStatus("idle");
                setCallError("");
              }}
              className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-black hover:bg-black/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
                <PhoneCall className="h-5 w-5 text-[#d8f5a2]" />
              </span>
              <div>
                <h3 className="text-lg font-bold tracking-tight text-black">
                  Schedule Live AI Phone Call
                </h3>
                <p className="text-xs text-black/60 font-normal">
                  Agent: <span className="font-semibold text-black">{activeCard.title}</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleDispatchCall} className="mt-6 flex flex-col gap-4">
              <div>
                <label className="block font-mono text-xs font-bold uppercase tracking-wider text-black/60 mb-1.5">
                  Your Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-full border border-black/15 bg-[#f8f9fa] px-5 py-3 text-xs font-medium text-black placeholder:text-black/40 transition-all focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                  <UserIcon className="pointer-events-none absolute right-4 top-3.5 h-4 w-4 text-black/30" />
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs font-bold uppercase tracking-wider text-black/60 mb-1.5">
                  Mobile Phone Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full rounded-full border border-black/15 bg-[#f8f9fa] px-5 py-3 text-xs font-mono font-medium text-black placeholder:text-black/40 transition-all focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                  <Phone className="pointer-events-none absolute right-4 top-3.5 h-4 w-4 text-black/30" />
                </div>
                <p className="mt-1 text-xs font-normal text-black/50">
                  Include country code (e.g. +91 for India, +1 for US/Canada).
                </p>
              </div>

              {callStatus === "error" && callError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                  <span>{callError}</span>
                </div>
              )}

              {callStatus === "success" && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-bold text-emerald-950">Call Dispatched Successfully!</p>
                    <p className="mt-0.5 font-medium text-emerald-800">
                      Your phone will ring in 3 to 5 seconds. Pick up to speak with your AI agent!
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isCalling}
                className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black px-6 text-xs font-bold text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {isCalling ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Dispatching Call...</span>
                  </>
                ) : (
                  <>
                    <PhoneCall className="h-4 w-4 text-[#d8f5a2]" />
                    <span>Call My Phone Now</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 border-t border-black/10 pt-3 flex items-center justify-between text-xs font-mono text-black/50">
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Telephony Active</span>
              </span>
              <span>
                Assistant: {configuredId ? `${configuredId.slice(0, 8)}...` : "GAP Default"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Auth Gate Protection Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-[28px] border border-black/10 bg-white p-7 sm:p-8 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-black hover:bg-black/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f8f9fa] text-black border border-black/10">
              <Lock className="h-5 w-5 text-[#ff4b2f]" />
            </div>

            <h3 className="mt-4 text-xl font-bold tracking-tight text-black">
              Sign In to Receive Live Phone Call
            </h3>

            <p className="mt-2 text-xs sm:text-sm font-normal leading-relaxed text-black/70">
              To prevent abuse and test live AI phone calls directly on your phone, please sign in or create a free GAP VoicePilot account.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/login?next=/page#live-demo"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-black px-5 text-xs font-bold text-white shadow-xs transition-all hover:bg-neutral-800"
              >
                <span>Sign In to Continue</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/signup?next=/page#live-demo"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-black/15 bg-white px-5 text-xs font-bold text-black transition-all hover:bg-black/5"
              >
                <span>Create Free Account</span>
              </Link>
            </div>

            <p className="mt-4 text-center text-xs font-normal text-black/40">
              Instant access • Zero setup fee
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default LiveAgentDemoSection;
