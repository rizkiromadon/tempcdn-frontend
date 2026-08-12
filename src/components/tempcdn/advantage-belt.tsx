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
    title: "Actually free",
    body: "There's no paid tier waiting behind a feature flag. Upload as much as you want, whenever you want.",
    accent: "sage"
  },
  {
    icon: Timer,
    title: "Cleans up after itself",
    body: "Set the expiry when you upload and forget about it — the file is gone on its own once the timer's up.",
    accent: "bloom"
  },
  {
    icon: ShieldOff,
    title: "Skip the sign-up",
    body: "You don't need an account to use this. Open the page, drop a file, get a link back.",
    accent: "coral"
  },
  {
    icon: Terminal,
    title: "Scriptable from the start",
    body: "curl -F file=@yourfile.zip and you're done. No API key to generate, no auth header to figure out.",
    accent: "amber"
  },
  {
    icon: Fingerprint,
    title: "Won't store duplicates",
    body: "Files are hashed with SHA-256 on the way in, so uploading the same thing twice doesn't cost extra storage.",
    accent: "bloom"
  },
  {
    icon: ServerCog,
    title: "More than one server",
    body: "Traffic spreads across a small pool of nodes, so a single server having a rough day doesn't take the whole thing down.",
    accent: "sage"
  },
  {
    icon: Zap,
    title: "Link's ready right away",
    body: "As soon as the upload finishes you get a URL back — drop it in Slack, a ticket, wherever it needs to go.",
    accent: "amber"
  },
  {
    icon: Link2,
    title: "No link settings to fuss with",
    body: "There's no visibility toggle or access list — if someone has the link, it works, until it expires.",
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
