import React, { useMemo, useRef } from "react";
import type { AnimationComponent, GameObject, Scene3D } from "../../scene/schema";
import { findComponent } from "../../scene/schema";

// ── Props ─────────────────────────────────────────────────────────────────────

export type TimelinePanelProps = {
  scene: Scene3D;
  selectedId: string | null;
  currentFrame: number;
  durationInFrames: number;
  onSeek: (frame: number) => void;
};

// ── Component ─────────────────────────────────────────────────────────────────

const TICK_STRIDE = 30; // pixels between major ticks

export const TimelinePanel: React.FC<TimelinePanelProps> = ({
  scene,
  selectedId,
  currentFrame,
  durationInFrames,
  onSeek,
}) => {
  const laneRef = useRef<HTMLDivElement>(null);

  const selected = selectedId ? scene.objects.find((o) => o.id === selectedId) : null;
  const anim = selected
    ? (findComponent(selected, "animation") as AnimationComponent | undefined)
    : undefined;

  const total = Math.max(1, durationInFrames);

  // Major ticks at every multiple of `step` frames, picked so they land ~TICK_STRIDE px apart.
  const tickStep = useMemo(() => {
    const candidates = [1, 5, 10, 30, 60, 120, 300];
    return candidates.find((s) => s / total > 0.05) ?? 60;
  }, [total]);

  const frameToPct = (f: number) => (f / total) * 100;

  const handleRulerPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent | React.PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, (ev.clientX - rect.left)));
      const frame = Math.round((x / rect.width) * total);
      onSeek(frame);
    };
    move(e);
    const onMove = (ev: PointerEvent) => move(ev);
    const onUp = () => {
      el.releasePointerCapture(e.pointerId);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const tracks: Array<{ property: string; frames: number[] }> = anim
    ? anim.tracks.map((t) => ({
        property: t.path ?? `transform.${t.property}`,
        frames: t.keyframes.map((k) => k.frame),
      }))
    : [];

  return (
    <div className="timeline-panel">
      <div className="timeline-panel__header">
        <button className="timeline-panel__tab is-active">Dopesheet</button>
        <button className="timeline-panel__tab" disabled>Timeline</button>
        <button className="timeline-panel__tab" disabled>Curves</button>
        <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)" }}>
          f{currentFrame} / {durationInFrames}
        </span>
      </div>
      <div className="timeline-panel__body">
        <div className="timeline-ruler" onPointerDown={handleRulerPointer}>
          {Array.from({ length: Math.floor(total / tickStep) + 1 }, (_, i) => {
            const f = i * tickStep;
            return (
              <React.Fragment key={f}>
                <div className="timeline-ruler__tick" style={{ left: `${frameToPct(f)}%` }} />
                <div className="timeline-ruler__label" style={{ left: `${frameToPct(f)}%` }}>{f}</div>
              </React.Fragment>
            );
          })}
          <div className="timeline-playhead" style={{ left: `${frameToPct(currentFrame)}%` }}>
            <div className="timeline-playhead__head" />
          </div>
        </div>
        <div className="timeline-tracks" ref={laneRef}>
          {selected ? (
            tracks.length === 0 ? (
              <p className="timeline-empty">
                "{selected.name}" has no animation tracks. Use ◆ in Inspector to record keyframes.
              </p>
            ) : (
              tracks.map((t) => (
                <div key={t.property} className="timeline-track">
                  <span className="timeline-track__label">{t.property}</span>
                  <div className="timeline-track__lane">
                    {t.frames.map((f) => (
                      <div
                        key={f}
                        className="timeline-key"
                        title={`frame ${f}`}
                        style={{ left: `${frameToPct(f)}%` }}
                      />
                    ))}
                    <div
                      className="timeline-playhead"
                      style={{ left: `${frameToPct(currentFrame)}%` }}
                    />
                  </div>
                </div>
              ))
            )
          ) : (
            <p className="timeline-empty">Select an object to see its tracks.</p>
          )}
        </div>
      </div>
    </div>
  );
};
