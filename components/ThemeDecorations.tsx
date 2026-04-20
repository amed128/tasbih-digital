// Ambient background decoration layer for premium themes.
// Uses CSS variables (--deco-opacity, --deco-primary-rgb, --deco-accent-rgb) so free
// themes (opacity: 0) are completely unaffected. mix-blend-mode: screen keeps the
// blobs additive on dark surfaces — they never occlude content.
export function ThemeDecorations() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 10 }}
    >
      {/* Top-right primary glow */}
      <div
        className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full blur-[140px]"
        style={{
          background: "rgba(var(--deco-primary-rgb), var(--deco-opacity, 0))",
          mixBlendMode: "screen",
        }}
      />
      {/* Bottom-left accent glow */}
      <div
        className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full blur-[120px]"
        style={{
          background: "rgba(var(--deco-accent-rgb), var(--deco-accent-opacity, var(--deco-opacity, 0)))",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}
