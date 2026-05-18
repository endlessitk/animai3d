import React from "react";

/**
 * Transport bar — sits in the viewport-row footer until Sprint 5 brings the
 * full Time Editor (Timeline / Dopesheet / Curves swap, ruler, range slider).
 */

export type TransportBarProps = {
  playing: boolean;
  loop: boolean;
  frame: number;
  durationInFrames: number;
  fps: number;
  onPlay: () => void;
  onStop: () => void;
  onNext: () => void;
  onPrev: () => void;
  onGoToStart: () => void;
  onGoToEnd: () => void;
  onToggleLoop: () => void;
  onSeek: (frame: number) => void;
};

export const TransportBar: React.FC<TransportBarProps> = ({
  playing,
  loop,
  frame,
  durationInFrames,
  fps,
  onPlay,
  onStop,
  onNext,
  onPrev,
  onGoToStart,
  onGoToEnd,
  onToggleLoop,
  onSeek,
}) => {
  const seconds = (frame / fps).toFixed(2);
  const totalSeconds = (durationInFrames / fps).toFixed(2);
  return (
    <footer className="transport">
      <button type="button" className="transport__button" title="Go to start (Shift+←)" onClick={onGoToStart}>⏮</button>
      <button type="button" className="transport__button" title="Previous frame (←)" onClick={onPrev}>◀</button>
      <button
        type="button"
        className={`transport__button transport__play ${playing ? "is-playing" : ""}`}
        title="Play / Pause (K)"
        onClick={onPlay}
      >{playing ? "⏸" : "⏵"}</button>
      <button type="button" className="transport__button" title="Stop" onClick={onStop}>■</button>
      <button type="button" className="transport__button" title="Next frame (→)" onClick={onNext}>▶</button>
      <button type="button" className="transport__button" title="Go to end (Shift+→)" onClick={onGoToEnd}>⏭</button>
      <button
        type="button"
        className={`transport__button ${loop ? "is-active" : ""}`}
        title="Loop region (L)"
        onClick={onToggleLoop}
      >⤺</button>

      <input
        className="transport__scrubber"
        type="range"
        min={0}
        max={durationInFrames}
        value={frame}
        onChange={(event) => onSeek(Number(event.target.value))}
      />
      <span className="transport__time">
        {frame} / {durationInFrames}F · {seconds}s / {totalSeconds}s
      </span>
    </footer>
  );
};
