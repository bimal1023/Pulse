"use client";
import { useState } from "react";
import Link from "next/link";

const FEATURES = [
  {
    badge: "Core",
    badgeClass: "bg-blue-50 text-blue-700",
    icon: "📋",
    title: "Application Tracker",
    desc: "Track all your applications, deadlines, and statuses in one organized place.",
  },
  {
    badge: "AI",
    badgeClass: "bg-violet-50 text-violet-700",
    icon: "✉️",
    title: "Email Drafter",
    desc: "Generate personalized professor outreach emails in seconds with AI.",
  },
  {
    badge: "AI",
    badgeClass: "bg-violet-50 text-violet-700",
    icon: "📝",
    title: "Statement Refiner",
    desc: "Get expert AI feedback and a polished rewrite of your personal statement.",
  },
  {
    badge: "AI",
    badgeClass: "bg-violet-50 text-violet-700",
    icon: "🏆",
    title: "Fellowship Finder",
    desc: "Discover fellowships and funding opportunities matched to your research profile.",
  },
  {
    badge: "AI",
    badgeClass: "bg-violet-50 text-violet-700",
    icon: "☀️",
    title: "Daily Briefing",
    desc: "Start every day with a personalized briefing on your applications and to-dos.",
  },
  {
    badge: "Core",
    badgeClass: "bg-blue-50 text-blue-700",
    icon: "⏰",
    title: "Deadline Awareness",
    desc: "Never miss an important deadline with deadline tracking across all programs.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "PilotPhD helped me stay organized through 15 applications. The email drafter saved me so much time!",
    name: "Rishav B.",
    role: "CS PhD student, Stanford",
    initials: "PM",
    avatarClass: "bg-blue-100 text-blue-700",
  },
  {
    quote:
      "I found 3 fellowships I didn't know about using the fellowship finder. Highly recommend!",
    name: "Rishav B.",
    role: "Neuroscience PhD, Harvard",
    initials: "JK",
    avatarClass: "bg-emerald-100 text-emerald-700",
  },
  {
    quote:
      "The statement refiner gave me incredibly helpful feedback. My essay improved dramatically.",
    name: "Rishav B.",
    role: "Physics PhD, MIT",
    initials: "LT",
    avatarClass: "bg-violet-100 text-violet-700",
  },
];

const FAQS = [
  {
    q: "Is PilotPhD free to use?",
    a: "Yes! We have a free forever tier that gives you access to the application tracker, email drafter, and statement refiner. No credit card required.",
  },
  {
    q: "Is my data private and secure?",
    a: "Absolutely. Your statements, emails, and application data are only used to generate your results — they are never stored beyond your session or used for training.",
  },
  {
    q: "Does it work for master's programs?",
    a: "Yes! While we're optimized for PhD applications, everything works equally well for master's and research-focused programs.",
  },
  {
    q: "How accurate is the fellowship finder?",
    a: "Our AI is trained on a broad knowledge base of national and field-specific fellowships. We always recommend verifying deadlines and eligibility on the official fellowship websites.",
  },
  {
    q: "Does it support non-US programs?",
    a: "Yes, PilotPhD supports applications to programs worldwide. Our email drafter, statement refiner, and fellowship finder all work for international PhD programs.",
  },
  {
    q: "Can I collaborate with my advisor or mentor?",
    a: "Collaborative features are on our roadmap. For now, you can copy any AI-generated content and share it directly with your advisor.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-4 text-left gap-4"
      >
        <span className="text-sm font-medium text-gray-900">{q}</span>
        <span
          className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
            open ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
          }`}
        >
          {open ? "−" : "+"}
        </span>
      </button>
      {open && <p className="pb-4 text-sm text-gray-500 leading-relaxed">{a}</p>}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      >
        {/* Blue radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 0%, rgba(37,99,235,0.10) 0%, transparent 100%)",
          }}
        />

        <div className="relative max-w-4xl mx-auto px-4 md:px-6 pt-24 pb-20 flex flex-col items-center text-center">
          {/* Top nav */}
          <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-4 md:px-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-bold">P</span>
              </div>
              <span className="font-semibold text-gray-900 text-sm">PilotPhD</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/auth"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign in →
              </Link>
            </div>
          </div>

          {/* Badge */}
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-blue-700">
              Your personal PhD application co-pilot
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 mb-4 leading-tight">
            Get into your PhD program.
            <br />
            <span className="text-blue-600">Stay organized doing it.</span>
          </h1>

          <p className="text-lg text-gray-500 max-w-xl mb-10 leading-relaxed">
            PilotPhD keeps your applications, emails, and statements organized —
            and uses AI to help you write better, faster.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Link
              href="/auth?tab=signup"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm text-sm"
            >
              Get started — it&apos;s free
            </Link>
            <Link
              href="/auth"
              className="border border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-3 rounded-xl font-medium transition-colors text-sm bg-white"
            >
              Sign in →
            </Link>
          </div>

          <p className="text-xs text-gray-400">
            No credit card required · Free forever tier
          </p>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "2,400+", label: "applications tracked" },
              { value: "18 min", label: "avg. time to draft an email" },
              { value: "94%", label: "found at least one new fellowship" },
              { value: "Free", label: "to get started" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 max-w-5xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-3">
            How it works
          </h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Three simple steps to a stronger, more organized PhD application.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 relative">
          {[
            {
              n: "01",
              title: "Add your applications",
              desc: "Track every school, program, deadline, and status in one clean dashboard.",
            },
            {
              n: "02",
              title: "Use AI to write and refine",
              desc: "Draft professor emails, refine your statement, and find fellowships in seconds.",
            },
            {
              n: "03",
              title: "Stay on top every day",
              desc: "Get a personalized daily briefing with action items and deadline reminders.",
            },
          ].map(({ n, title, desc }, i) => (
            <div key={n} className="relative flex gap-4">
              {/* Arrow connector (desktop) */}
              {i < 2 && (
                <div className="hidden md:flex absolute -right-3 top-6 z-10">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gray-300">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
              <div className="bg-white border border-gray-100 hover:border-gray-200 rounded-xl p-6 flex-1 transition-colors">
                <span className="text-3xl font-bold text-gray-100 select-none">{n}</span>
                <h3 className="text-base font-semibold text-gray-900 mt-2 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-[#f8f9fb] py-20">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-3">
              Everything you need
            </h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              AI-powered tools and smart organization features built specifically for PhD applicants.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ badge, badgeClass, icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 p-6 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{icon}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeClass}`}>
                    {badge}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 max-w-5xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-3">
            Loved by PhD applicants
          </h2>
          <p className="text-gray-500 text-sm">
            Join thousands of students who&apos;ve simplified their PhD journey.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ quote, name, role, initials, avatarClass }) => (
            <div
              key={initials}
              className="bg-white border border-gray-100 hover:border-gray-200 rounded-xl p-6 transition-colors"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-5">&quot;{quote}&quot;</p>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${avatarClass}`}>
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{name}</p>
                  <p className="text-xs text-gray-400">{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-[#f8f9fb] py-20">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-3">
              Frequently asked questions
            </h2>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 px-6">
            {FAQS.map((item) => (
              <FAQItem key={item.q} {...item} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div
            className="relative bg-blue-600 rounded-3xl px-8 md:px-16 py-16 text-center overflow-hidden"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          >
            {/* Decorative blobs */}
            <div className="absolute -top-16 -left-16 w-48 h-48 bg-blue-500 rounded-full opacity-30 blur-3xl" />
            <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-blue-700 rounded-full opacity-30 blur-3xl" />

            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                Ready to take the stress out of applying?
              </h2>
              <p className="text-blue-200 mb-8 max-w-md mx-auto text-sm leading-relaxed">
                Join thousands of PhD applicants who use PilotPhD to stay
                organized and put their best foot forward.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/auth?tab=signup"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-xl font-medium transition-colors text-sm shadow-sm"
                >
                  Get started — it&apos;s free
                </Link>
                <Link
                  href="/auth"
                  className="border border-white/30 text-white hover:bg-white/10 px-6 py-3 rounded-xl font-medium transition-colors text-sm"
                >
                  Sign in →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <span className="text-sm text-gray-600 font-medium">PilotPhD</span>
            <span className="text-xs text-gray-400">© 2026</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <a href="#" className="hover:text-gray-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Contact</a>
          </div>
          <p className="text-xs text-gray-400 text-center sm:text-right">
            Made for PhD applicants, by people who&apos;ve been there.
          </p>
        </div>
      </footer>
    </div>
  );
}
