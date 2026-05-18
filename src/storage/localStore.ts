const PREFIX = "agentic-3d-studio:";

export const loadJson = <T>(key: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const saveJson = <T>(key: string, value: T) => {
  window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
};

// Debounced variant — coalesces rapid writes (e.g. transform scrubbing).
const _debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
export const saveJsonDebounced = <T>(key: string, value: T, delayMs = 200) => {
  const prev = _debounceTimers.get(key);
  if (prev) clearTimeout(prev);
  _debounceTimers.set(
    key,
    setTimeout(() => {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
      _debounceTimers.delete(key);
    }, delayMs),
  );
};

export const downloadJson = (filename: string, value: unknown) => {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
