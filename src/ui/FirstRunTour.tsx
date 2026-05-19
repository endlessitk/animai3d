import React, { useEffect, useState } from "react";
import { loadJson, saveJson } from "../storage/localStore";

// ── Steps ─────────────────────────────────────────────────────────────────────

type Step = {
  /** CSS selector for the element to anchor against. */
  anchor: string;
  /** Placement relative to the anchor. */
  side: "bottom" | "right" | "left" | "top";
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    anchor: ".workspace-switcher",
    side: "bottom",
    title: "Workspaces",
    body: "Top row swaps task contexts: Model / Animate / Material / Agent. Ctrl+1..8 jumps direct.",
  },
  {
    anchor: ".subtoolbar",
    side: "bottom",
    title: "Viewport modes",
    body: "Sub-toolbar drives the viewport: Z cycles shading, X toggles snap, , / . cycle Transform Reference.",
  },
  {
    anchor: ".outliner",
    side: "left",
    title: "Outliner + Inspector",
    body: "Shift+A adds objects. Click a row to inspect. The ◆ button on a Vec3 records a keyframe at current frame.",
  },
  {
    anchor: ".transport-bar",
    side: "top",
    title: "Time editor + Agent",
    body: "K plays. Drag the ruler to scrub. F12 opens the Agent Workbench — try \"bounce the cube\".",
  },
];

// ── Storage key ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "first-run-tour-done";

// ── Component ─────────────────────────────────────────────────────────────────

export const FirstRunTour: React.FC = () => {
  const [done, setDone] = useState<boolean>(() => loadJson(STORAGE_KEY, false));
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const step = STEPS[stepIdx];

  // Recompute anchor rect when step changes or on resize.
  useEffect(() => {
    if (done || !step) return;
    const update = () => {
      const el = document.querySelector(step.anchor);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    update();
    const ro = window.setInterval(update, 250);
    window.addEventListener("resize", update);
    return () => {
      window.clearInterval(ro);
      window.removeEventListener("resize", update);
    };
  }, [done, step]);

  if (done || !step) return null;

  const finish = () => {
    saveJson(STORAGE_KEY, true);
    setDone(true);
  };

  const next = () => {
    if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1);
    else finish();
  };

  // Position the tooltip from anchor rect + side.
  const bubbleStyle: React.CSSProperties = (() => {
    if (!rect) return { left: "50%", top: "50%", transform: "translate(-50%, -50%)" };
    const pad = 12;
    switch (step.side) {
      case "bottom":
        return { left: rect.left + rect.width / 2, top: rect.bottom + pad, transform: "translateX(-50%)" };
      case "top":
        return { left: rect.left + rect.width / 2, bottom: window.innerHeight - rect.top + pad, transform: "translateX(-50%)" };
      case "right":
        return { left: rect.right + pad, top: rect.top + rect.height / 2, transform: "translateY(-50%)" };
      case "left":
        return { right: window.innerWidth - rect.left + pad, top: rect.top + rect.height / 2, transform: "translateY(-50%)" };
    }
  })();

  // Spotlight ring on the anchor
  const spotlightStyle: React.CSSProperties | undefined = rect
    ? {
        left: rect.left - 4,
        top: rect.top - 4,
        width: rect.width + 8,
        height: rect.height + 8,
      }
    : undefined;

  return (
    <div className="tour-overlay" role="dialog" aria-label="First-run tour">
      {spotlightStyle && <div className="tour-spotlight" style={spotlightStyle} />}
      <div className="tour-bubble" style={bubbleStyle}>
        <div className="tour-bubble__step">{stepIdx + 1} / {STEPS.length}</div>
        <div className="tour-bubble__title">{step.title}</div>
        <div className="tour-bubble__body">{step.body}</div>
        <div className="tour-bubble__actions">
          <button type="button" className="tour-bubble__skip" onClick={finish}>Skip</button>
          <button type="button" className="tour-bubble__next" onClick={next}>
            {stepIdx === STEPS.length - 1 ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};
