import type { LucideIcon } from "lucide-react";
import {
  Timer,
  ShieldOff,
  Fingerprint,
  Terminal,
  Infinity as InfinityIcon,
  Zap,
  Link2,
  ServerCog
} from "lucide-react";

interface Advantage {
  icon: LucideIcon;
  title: string;
  body: string;
  accent: "bloom" | "sage" | "amber" | "coral";
}

const advantages: Advantage[] = [
  {
    icon: InfinityIcon,
    title: "Free, no catch",
    body: "No tiers, no trial, no card on file. TempCDN stays free forever — the same service for a one-off share or a CI pipeline.",
    accent: "sage"
  },
  {
    icon: Timer,
    title: "Self-cleaning by design",
    body: "Every upload carries its own expiry. Nothing to schedule, nothing to remember to delete later.",
    accent: "bloom"
  },
  {
    icon: ShieldOff,
    title: "Zero accounts",
    body: "No sign-up, no login, no session to lose. Open the page, drop a file, get a link.",
    accent: "coral"
  },
  {
    icon: Terminal,
    title: "Built for the terminal",
    body: "A plain REST API with no auth headers or API keys — pipe a build artifact out with a single curl -F.",
    accent: "amber"
  },
  {
    icon: Fingerprint,
    title: "Checksum deduplication",
    body: "Content is fingerprinted with SHA-256 before storage, so the same file is never written twice.",
    accent: "bloom"
  },
  {
    icon: ServerCog,
    title: "Multi-node failover",
    body: "Requests round-robin across every healthy node and retry elsewhere automatically if one has a bad moment.",
    accent: "sage"
  },
  {
    icon: Zap,
    title: "Instant links",
    body: "A direct CDN URL comes back the moment the upload finishes — ready to paste into a chat, ticket, or script.",
    accent: "amber"
  },
  {
    icon: Link2,
    title: "Shareable by nature",
    body: "One link, no permissions to configure. Anyone holding it can view or download until the timer runs out.",
    accent: "coral"
  }
];

const accentClasses: Record<Advantage["accent"], string> = {
  bloom: "bg-bloom-soft text-bloom-strong",
  sage: "bg-sage-soft text-sage",
  amber: "bg-amber-soft text-amber",
  coral: "bg-coral-soft text-coral"
};

function AdvantageCard({ advantage }: { advantage: Advantage }) {
  const Icon = advantage.icon;
  return (
    <div className="flex w-[280px] shrink-0 flex-col gap-3 rounded-xl border border-line bg-paper p-5 shadow-soft sm:w-[300px]">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full ${accentClasses[advantage.accent]}`}
      >
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <h3 className="text-sm font-semibold text-ink">{advantage.title}</h3>
      <p className="text-sm leading-relaxed text-ink-soft">{advantage.body}</p>
    </div>
  );
}

/**
 * Continuously scrolling "conveyor belt" of advantage cards, literalizing
 * the "files pass through" idea from the hero. The track is the list
 * rendered twice back to back and animated -50%, which loops seamlessly
 * since the second copy picks up exactly where the first ends. Pausable on
 * hover/focus for readability, and disabled entirely under
 * prefers-reduced-motion (see globals.css).
 */
export function AdvantageBelt() {
  return (
    <div className="group/belt relative -mx-5 overflow-hidden sm:mx-0 sm:rounded-2xl">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-mist to-transparent sm:w-16"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-mist to-transparent sm:w-16"
      />
      <div className="flex w-max animate-conveyor-x gap-4 py-1 group-hover/belt:[animation-play-state:paused] group-focus-within/belt:[animation-play-state:paused]">
        {[...advantages, ...advantages].map((advantage, i) => (
          <AdvantageCard key={`${advantage.title}-${i}`} advantage={advantage} />
        ))}
      </div>
    </div>
  );
}
