import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type SortDir = "asc" | "desc";
export type SortValue = string | number | null | undefined;
export type SortAccessors<T, K extends string> = Record<K, (item: T) => SortValue>;

interface SortState<K extends string> {
  key: K | null;
  dir: SortDir;
}

interface Options<K extends string> {
  /** NoInfer: the column type comes from the accessors, not from this default. */
  initialKey?: NoInfer<K> | null;
  initialDir?: SortDir;
  /** Remember the user's last sort for this table in localStorage. */
  storageKey?: string;
}

function readStored<K extends string>(storageKey: string | undefined, keys: readonly string[]) {
  if (!storageKey) return null;
  try {
    const raw = localStorage.getItem(`sort:${storageKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SortState<K>;
    if (
      (parsed.key === null || keys.includes(parsed.key)) &&
      (parsed.dir === "asc" || parsed.dir === "desc")
    ) {
      return parsed;
    }
  } catch {
    // Private mode / blocked storage / bad JSON: fall back to defaults.
  }
  return null;
}

/** Numbers compare numerically, strings with locale-aware natural ordering; empty values always sort last. */
function compare(a: SortValue, b: SortValue, dir: SortDir): number {
  const aEmpty = a === null || a === undefined || (typeof a === "number" && Number.isNaN(a));
  const bEmpty = b === null || b === undefined || (typeof b === "number" && Number.isNaN(b));
  if (aEmpty || bEmpty) return aEmpty && bEmpty ? 0 : aEmpty ? 1 : -1;

  const result =
    typeof a === "number" && typeof b === "number"
      ? a - b
      : String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
  return dir === "asc" ? result : -result;
}

/**
 * Client-side column sorting for tables.
 * Clicking a new column sorts numbers high→low first and text A→Z first; clicking again flips it.
 */
export function useSort<T, K extends string>(
  items: readonly T[] | null | undefined,
  accessors: SortAccessors<T, K>,
  options: Options<K> = {},
) {
  const accessorsRef = useRef(accessors);
  accessorsRef.current = accessors;
  const keys = Object.keys(accessors);

  const [state, setState] = useState<SortState<K>>(
    () =>
      readStored<K>(options.storageKey, keys) ?? {
        key: options.initialKey ?? null,
        dir: options.initialDir ?? "desc",
      },
  );

  useEffect(() => {
    if (!options.storageKey) return;
    try {
      localStorage.setItem(`sort:${options.storageKey}`, JSON.stringify(state));
    } catch {
      // Ignore storage failures; sorting still works for this session.
    }
  }, [state, options.storageKey]);

  const toggle = useCallback(
    (key: K) => {
      setState((prev) => {
        if (prev.key === key) return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
        const sample = (items ?? [])
          .map((i) => accessorsRef.current[key](i))
          .find((v) => v !== null && v !== undefined);
        return { key, dir: typeof sample === "number" ? "desc" : "asc" };
      });
    },
    [items],
  );

  const sorted = useMemo(() => {
    const list = [...(items ?? [])];
    if (!state.key) return list;
    const get = accessorsRef.current[state.key];
    if (!get) return list;
    return list.sort((a, b) => compare(get(a), get(b), state.dir));
  }, [items, state]);

  const dirOf = useCallback(
    (key: K): SortDir | null => (state.key === key ? state.dir : null),
    [state],
  );

  return { sorted, sortKey: state.key, sortDir: state.dir, toggle, dirOf };
}
