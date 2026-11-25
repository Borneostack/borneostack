// Hub diagram adapted from the Neural template "features" section: one centre, the tools it connects, then three services.
import {
  BarChart3Icon,
  DatabaseIcon,
  MailIcon,
  MessageCircleIcon,
  MessageSquareTextIcon,
  SheetIcon,
  ZapIcon,
} from "lucide-react";

import SectionHead from "@/components/neural/section-head";
import Reveal from "@/components/neural/reveal";
import { LogoMark } from "@/components/shadcn-studio/logo";
import { SERVICES } from "@/lib/site";

const TOOLS = [
  { name: "Google Sheets", icon: SheetIcon },
  { name: "WhatsApp", icon: MessageCircleIcon },
  { name: "Gmail · Outlook", icon: MailIcon },
  { name: "SQL databases", icon: DatabaseIcon },
];
const ICONS = {
  automation: ZapIcon,
  assistant: MessageSquareTextIcon,
  dashboards: BarChart3Icon,
};

const Wires = ({
  from,
  to,
  id,
  flip,
}: {
  from: number[];
  to: number[];
  id: string;
  flip?: boolean;
}) => (
  <svg
    aria-hidden
    viewBox="0 0 800 120"
    preserveAspectRatio="none"
    className="h-20 w-full max-sm:hidden"
  >
    {from.flatMap((a) =>
      to.map((b, n) => (
        <g key={`${a}-${b}`}>
          <path
            d={`M${a} 0 C ${a} 60, ${b} 60, ${b} 120`}
            fill="none"
            stroke={`url(#${id})`}
            strokeWidth="1.5"
          />
          <path
            d={`M${a} 0 C ${a} 60, ${b} 60, ${b} 120`}
            pathLength={400}
            fill="none"
            stroke="#bcd6ff"
            strokeWidth="2"
            strokeLinecap="round"
            className="wire-pulse"
            style={{ animationDelay: `${(a + b * 3 + n * 400) % 3400}ms` }}
          />
        </g>
      )),
    )}
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop
          offset="0"
          stopColor={flip ? "#2b7bff" : "rgb(255 255 255 / 0.12)"}
        />
        <stop
          offset="1"
          stopColor={flip ? "rgb(255 255 255 / 0.12)" : "#2b7bff"}
        />
      </linearGradient>
    </defs>
  </svg>
);

const Hub = () => (
  <section id="services" className="relative py-20 sm:py-28">
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <SectionHead
        title="Built on the tools you already use"
        description="We connect the apps your team opens every day. Nothing to migrate, nothing new to learn."
      />

      <div className="relative mx-auto mt-14 max-w-4xl">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TOOLS.map(({ name, icon: Icon }) => (
            <li
              key={name}
              className="glass flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-medium"
            >
              <Icon className="text-muted-foreground size-4" />
              {name}
            </li>
          ))}
        </ul>

        <Wires id="hub-a" from={[100, 300, 500, 700]} to={[400]} />

        <div className="border-primary/50 bg-primary/10 relative mx-auto my-6 flex w-fit items-center gap-3 rounded-2xl border px-5 py-3 shadow-[0_0_60px_-10px_#2b7bff] sm:my-0">
          <LogoMark className="size-8" />
          <span className="text-lg font-bold">BorneoStack</span>
        </div>

        <Wires id="hub-b" from={[400]} to={[133, 400, 667]} flip />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {SERVICES.map((s, n) => {
          const Icon = ICONS[s.id];

          return (
            <Reveal key={s.id} delay={n * 0.1}>
              <a
                href={`/services#${s.id}`}
                className="glass hover:border-primary/60 flex h-full flex-col rounded-2xl p-6 transition-colors"
              >
                <span className="bg-primary/15 text-primary grid size-10 place-items-center rounded-xl">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-xl">{s.name}</h3>
                <p className="text-muted-foreground mt-2 flex-1 text-sm">
                  {s.pitch}
                </p>
                <p className="mt-6 flex items-baseline justify-between border-t pt-4 text-sm">
                  <span className="text-muted-foreground">From</span>
                  <span className="text-lg font-bold">{s.from}</span>
                </p>
              </a>
            </Reveal>
          );
        })}
      </div>
    </div>
  </section>
);

export default Hub;
