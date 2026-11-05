import { fmtPct } from "./format";
import { groupBy, moodFor } from "./metrics";
import type { Metrics, Mood, Row } from "./types";

export interface Insight {
  emoji: string;
  text: string;
}

export function gardenNotes(rows: Row[]): Insight[] {
  const camps = groupBy(rows, "campaign");
  const chans = groupBy(rows, "channel");
  const notes: Insight[] = [];
  const withSpend = camps.filter((c) => c.m.spend > 0 && c.m.roi != null);
  if (withSpend.length) {
    const best = [...withSpend].sort((a, b) => b.m.roi! - a.m.roi!)[0];
    notes.push({ emoji: "🌟", text: `${best.name} is your star bloom, returning ${fmtPct(best.m.roi, 0)} on what you spent.` });
    const worst = [...withSpend].sort((a, b) => a.m.roi! - b.m.roi!)[0];
    if (worst !== best && worst.m.roi! < 0)
      notes.push({ emoji: "💧", text: `${worst.name} needs a little water. It’s spending more than it earns (${fmtPct(worst.m.roi, 0)} ROI).` });
  }
  const ctrChans = chans.filter((c) => c.m.ctr != null && c.m.impressions > 0);
  if (ctrChans.length > 1) {
    const top = [...ctrChans].sort((a, b) => b.m.ctr! - a.m.ctr!)[0];
    notes.push({ emoji: "👆", text: `${top.name} gets the most curious taps, with a ${fmtPct(top.m.ctr)} click-through rate.` });
  }
  const eng = camps.filter((c) => c.m.engRate != null && c.m.engagements > 0);
  if (eng.length > 1) {
    const top = [...eng].sort((a, b) => b.m.engRate! - a.m.engRate!)[0];
    notes.push({ emoji: "💌", text: `People love ${top.name} the most: ${fmtPct(top.m.engRate)} of the people it reached engaged.` });
  }
  const conv = camps.filter((c) => c.m.convRate != null && c.m.clicks >= 20);
  if (conv.length > 1) {
    const top = [...conv].sort((a, b) => b.m.convRate! - a.m.convRate!)[0];
    notes.push({ emoji: "🎀", text: `${top.name} turns taps into yeses best, converting ${fmtPct(top.m.convRate)} of clicks.` });
  }
  return notes;
}

export function moodLine(m: Metrics): { mood: Mood; line: string } {
  const mood = moodFor(m.roi);
  const lines: Record<Mood, string> = {
    joy: "Your garden is absolutely blooming! Every dollar planted came back more than double. ✨",
    happy: "Things are growing nicely! You’re earning back more than you spend.",
    meh: "We’re breaking about even. A little pruning could help things grow.",
    sad: "Oh no, a bit of a drought. Spend is outpacing revenue right now, so let’s find the thirsty campaigns.",
  };
  if (m.roi == null) return { mood, line: "Add spend and revenue columns and I can tell you how your garden is growing!" };
  return { mood, line: lines[mood] };
}
