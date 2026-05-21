import React, { useCallback, useEffect, useRef, useState } from "react";
import { useStudioState } from "../../state/studioState";
import { useAgentSession } from "../../agent/agentSession";
import { runMockAgent } from "../../agent/mockAgent";
import {
  applyScenePatch,
  describeOperationDelta,
  validateScenePatch,
} from "../../scene/patch";
import type { Scene3D, StudioProject } from "../../scene/schema";
import type { Transaction, TransactionSource } from "../../state/transactions";

// ── Accordion shell ───────────────────────────────────────────────────────────

type AccordionId =
  | "chat"
  | "tool-log"
  | "scene-diff"
  | "transactions"
  | "validation"
  | "alternatives"
  | "action-graph";

const ACCORDION_META: Array<{ id: AccordionId; label: string }> = [
  { id: "chat", label: "Chat" },
  { id: "tool-log", label: "Tool Call Log" },
  { id: "scene-diff", label: "Scene Diff" },
  { id: "transactions", label: "Transaction History" },
  { id: "validation", label: "Validation" },
  { id: "alternatives", label: "Alternatives" },
  { id: "action-graph", label: "Action Graph" },
];

// ── Props ─────────────────────────────────────────────────────────────────────

export type AgentWorkbenchProps = {
  project: StudioProject;
  scene: Scene3D;
  currentFrame: number;
  transactions?: Transaction[];
  onSceneChange: (
    description: string,
    updater: (s: Scene3D) => Scene3D,
    source?: TransactionSource,
    metadata?: Partial<Omit<Transaction, "id" | "description" | "timestamp" | "source">>,
  ) => void;
};

// ── Component ─────────────────────────────────────────────────────────────────

export const AgentWorkbench: React.FC<AgentWorkbenchProps> = ({
  project,
  scene,
  currentFrame,
  transactions = [],
  onSceneChange,
}) => {
  const { state: studioState, toggleAgentPanel } = useStudioState();
  const session = useAgentSession();
  const [openAccordion, setOpenAccordion] = useState<AccordionId>("chat");
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-open scene-diff when a new pending diff arrives.
  useEffect(() => {
    if (session.state.pendingDiff && openAccordion !== "scene-diff") {
      setOpenAccordion("scene-diff");
    }
    // intentionally ignore openAccordion in deps — we only want to react to new diffs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.state.pendingDiff?.id]);

  const handleSubmit = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || session.state.busy) return;
    setInput("");
    session.appendMessage("user", prompt);
    session.setBusy(true);
    try {
      const diff = await runMockAgent({
        prompt,
        project,
        scene,
        selectedId: studioState.selectedId,
        currentFrame,
        appendToolCall: session.appendToolCall,
        updateToolCall: session.updateToolCall,
        appendAgentMessage: (text) => session.appendMessage("agent", text),
      });
      if (diff) session.setPendingDiff(diff);
    } catch (e) {
      session.appendMessage("system", `Error: ${String(e)}`);
    } finally {
      session.setBusy(false);
    }
  }, [currentFrame, input, project, scene, session, studioState.selectedId]);

  const handleApply = useCallback(() => {
    const diff = session.state.pendingDiff;
    if (!diff) return;
    const validation = validateScenePatch(scene, diff);
    if (validation.blocked) {
      session.appendMessage("system", `Apply blocked: ${validation.messages[0] ?? "scene validation failed"}`);
      session.setPendingDiff({
        ...diff,
        validation: { status: "blocked", messages: validation.messages },
      });
      return;
    }
    onSceneChange(
      `[agent] ${diff.summary}`,
      (s) => applyScenePatch(s, diff),
      "agent",
      {
        patchId: diff.id,
        providerId: diff.provenance?.providerId,
        modelId: diff.provenance?.modelId,
        operationCount: diff.operations.length,
      },
    );
    session.setPendingDiff(null);
    session.appendMessage("system", `Applied: ${diff.summary}`);
  }, [scene, session, onSceneChange]);

  const handleReject = useCallback(() => {
    const diff = session.state.pendingDiff;
    if (!diff) return;
    session.setPendingDiff(null);
    session.appendMessage("system", `Rejected: ${diff.summary}`);
  }, [session]);

  if (!studioState.agentPanelOpen) return null;

  // Badges per accordion
  const badgeFor = (id: AccordionId): number | null => {
    if (id === "transactions") return transactions.length > 0 ? transactions.length : null;
    if (id === "tool-log") return session.state.toolCalls.length > 0 ? session.state.toolCalls.length : null;
    if (id === "scene-diff") return session.state.pendingDiff ? 1 : null;
    return null;
  };

  return (
    <aside className="agent-panel" aria-label="Agent Workbench">
      <header className="agent-panel__header">
        <span>◐ Agent Workbench</span>
        <button
          type="button"
          className="panel-header__btn"
          onClick={toggleAgentPanel}
          title="Close (F12)"
        >×</button>
      </header>
      <div className="agent-panel__body">
        {ACCORDION_META.map((acc) => {
          const isOpen = openAccordion === acc.id;
          const badge = badgeFor(acc.id);
          return (
            <section key={acc.id} className="agent-accordion">
              <button
                type="button"
                className={`agent-accordion__header ${isOpen ? "is-open" : ""}`}
                onClick={() => setOpenAccordion(isOpen ? "chat" : acc.id)}
              >
                <span>{acc.label}</span>
                {badge !== null && (
                  <span className="agent-accordion__badge">{badge}</span>
                )}
                <span className="agent-accordion__chevron" aria-hidden>
                  {isOpen ? "▾" : "▸"}
                </span>
              </button>
              {isOpen && (
                <div className="agent-accordion__body">
                  {renderAccordionBody(acc.id, {
                    session,
                    scene,
                    transactions,
                    input,
                    setInput,
                    inputRef,
                    handleSubmit,
                    handleApply,
                    handleReject,
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </aside>
  );
};

// ── Body renderers ────────────────────────────────────────────────────────────

type BodyDeps = {
  session: ReturnType<typeof useAgentSession>;
  scene: Scene3D;
  transactions: Transaction[];
  input: string;
  setInput: (s: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  handleSubmit: () => void;
  handleApply: () => void;
  handleReject: () => void;
};

const renderAccordionBody = (id: AccordionId, deps: BodyDeps): React.ReactNode => {
  switch (id) {
    case "chat":
      return <ChatBody {...deps} />;
    case "tool-log":
      return <ToolLogBody session={deps.session} />;
    case "scene-diff":
      return <SceneDiffBody {...deps} />;
    case "transactions":
      return <TransactionsBody transactions={deps.transactions} />;
    default:
      return (
        <>
          <span className="agent-pill">stub</span>
          <p style={{ margin: "8px 0 0", lineHeight: 1.4 }}>Planned for later sprints.</p>
        </>
      );
  }
};

// ── Chat ──────────────────────────────────────────────────────────────────────

const ChatBody: React.FC<BodyDeps> = ({ session, input, setInput, inputRef, handleSubmit }) => {
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.scrollTo({ top: 1e9 });
  }, [session.state.messages.length]);

  return (
    <div className="agent-chat">
      <div className="agent-chat__list" ref={listRef}>
        {session.state.messages.length === 0 && (
          <p className="agent-chat__hint">
            Try: <em>"bounce the cube"</em>, <em>"spin cube 360"</em>, <em>"make it red"</em>.
          </p>
        )}
        {session.state.messages.map((m) => (
          <div key={m.id} className={`agent-chat__msg agent-chat__msg--${m.role}`}>
            <span className="agent-chat__role">{m.role}</span>
            <span className="agent-chat__text">{m.text}</span>
          </div>
        ))}
        {session.state.busy && (
          <div className="agent-chat__msg agent-chat__msg--system">
            <span className="agent-chat__role">···</span>
            <span className="agent-chat__text">thinking</span>
          </div>
        )}
      </div>
      <form
        className="agent-chat__input-row"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <input
          ref={inputRef}
          className="agent-chat__input"
          placeholder="Ask the agent…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          disabled={session.state.busy}
        />
        <button
          type="submit"
          className="agent-chat__send"
          disabled={!input.trim() || session.state.busy}
        >Send</button>
      </form>
    </div>
  );
};

// ── Tool log ──────────────────────────────────────────────────────────────────

const ToolLogBody: React.FC<{ session: ReturnType<typeof useAgentSession> }> = ({ session }) => {
  if (session.state.toolCalls.length === 0) {
    return <p className="tx-empty">No tool calls yet. Send a prompt in Chat.</p>;
  }
  return (
    <ul className="tool-log">
      {session.state.toolCalls.map((c) => (
        <li key={c.id} className={`tool-log__row is-${c.status}`}>
          <span className="tool-log__dot" aria-hidden />
          <span className="tool-log__name">{c.name}</span>
          <span className="tool-log__args">{JSON.stringify(c.args)}</span>
          {c.result && <span className="tool-log__result">{c.result}</span>}
        </li>
      ))}
    </ul>
  );
};

// ── Scene diff ────────────────────────────────────────────────────────────────

const SceneDiffBody: React.FC<BodyDeps> = ({ scene, session, handleApply, handleReject }) => {
  const diff = session.state.pendingDiff;

  // Live validation — recomputed against current scene + patch identity.
  const validation = React.useMemo(
    () => (diff ? validateScenePatch(scene, diff) : null),
    [scene, diff],
  );
  const deltas = React.useMemo(
    () => (diff ? diff.operations.map((op) => describeOperationDelta(scene, op)) : []),
    [scene, diff],
  );

  if (!diff) {
    return <p className="tx-empty">No pending diff. Ask the agent to change the scene.</p>;
  }

  const status: "passed" | "warning" | "blocked" = validation?.blocked
    ? "blocked"
    : (validation && validation.messages.length > 0)
      ? "warning"
      : "passed";
  const statusLabel: Record<typeof status, string> = {
    passed: "✓ passes validation",
    warning: `▲ ${validation?.messages.length ?? 0} warning${(validation?.messages.length ?? 0) === 1 ? "" : "s"}`,
    blocked: `■ blocked — ${validation?.messages.length ?? 0} error${(validation?.messages.length ?? 0) === 1 ? "" : "s"}`,
  };

  return (
    <div className="scene-diff">
      <div className="scene-diff__summary">{diff.summary}</div>
      <div className="scene-diff__meta">
        <span className="scene-diff__opcount">
          {diff.operations.length} op{diff.operations.length === 1 ? "" : "s"}
        </span>
        {diff.provenance?.providerId && (
          <span className="scene-diff__provenance">
            {diff.provenance.providerId}{diff.provenance.modelId ? ` · ${diff.provenance.modelId}` : ""}
          </span>
        )}
        <span className={`scene-diff__status is-${status}`}>{statusLabel[status]}</span>
      </div>

      {validation && validation.messages.length > 0 && (
        <ul className="scene-diff__validation">
          {validation.messages.map((m, i) => (
            <li key={i} className={`scene-diff__validation-row is-${status}`}>{m}</li>
          ))}
        </ul>
      )}

      <ul className="scene-diff__deltas">
        {deltas.map((d, i) => (
          <li key={i} className={`scene-diff__delta scene-diff__delta--${d.kind}`}>
            <span className="scene-diff__delta-label">{d.label}</span>
            <span className="scene-diff__delta-pair">
              <span className="scene-diff__delta-before">{d.before}</span>
              <span className="scene-diff__delta-arrow">→</span>
              <span className="scene-diff__delta-after">{d.after}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="scene-diff__actions">
        <button type="button" className="scene-diff__btn scene-diff__btn--reject" onClick={handleReject}>
          Reject
        </button>
        <button
          type="button"
          className="scene-diff__btn scene-diff__btn--apply"
          onClick={handleApply}
          disabled={status === "blocked"}
          title={status === "blocked" ? "Validation errors must be resolved before applying" : "Commit patch to scene"}
        >
          Apply
        </button>
      </div>
    </div>
  );
};

// ── Transactions ──────────────────────────────────────────────────────────────

const TransactionsBody: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  if (transactions.length === 0) {
    return <p className="tx-empty">No transactions yet.</p>;
  }
  return (
    <ul className="tx-list">
      {transactions.map((tx) => (
        <li key={tx.id} className={`tx-row tx-row--${tx.source}`}>
          <span className="tx-row__id">{tx.id}</span>
          <span className="tx-row__desc">{tx.description}</span>
          <span className="tx-row__time">
            {new Date(tx.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </li>
      ))}
    </ul>
  );
};
