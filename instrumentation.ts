export async function register() {
  if (process.env.NODE_ENV !== "development") return;
  if (typeof performance === "undefined" || typeof performance.measure !== "function") return;

  // Suppress React/Turbopack bug: HMR can desync profiler marks so that
  // performance.measure receives a negative duration and throws TypeError.
  const orig = performance.measure.bind(performance);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (performance as any).measure = function (...args: Parameters<typeof orig>) {
    try {
      return orig(...args);
    } catch {
      // negative timestamp — swallow silently
    }
  };
}
