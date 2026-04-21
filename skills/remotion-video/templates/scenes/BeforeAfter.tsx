import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { HighlightedCode } from "../highlighted-code";
import { brand } from "../brand";
import type { SceneContent, SceneProps } from "../story-types";

const Panel: React.FC<{ side: SceneContent; accent: string; slideFrom: number; frame: number }> = ({
  side,
  accent,
  slideFrom,
  frame,
}) => {
  const x = interpolate(frame, [0, 18], [slideFrom, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        flex: 1,
        transform: `translateX(${x}px)`,
        opacity,
        padding: 32,
        background: "#0d1117",
        borderRadius: 16,
        borderTop: `6px solid ${accent}`,
      }}
    >
      <div
        style={{
          fontFamily: brand.font.family,
          fontSize: 36,
          fontWeight: 800,
          color: accent,
          marginBottom: 20,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {side.label}
      </div>
      {side.code ? (
        <div style={{ fontSize: 28, fontFamily: "'Fira Code', monospace", color: "#e6edf3" }}>
          <HighlightedCode code={side.code} lang={side.language ?? "ts"} theme="github-dark" />
        </div>
      ) : (
        <div
          style={{
            fontFamily: brand.font.family,
            fontSize: 36,
            color: "#e6edf3",
          }}
        >
          {side.label}
        </div>
      )}
    </div>
  );
};

export const BeforeAfter: React.FC<SceneProps<"BeforeAfter">> = ({
  before,
  after,
  caption,
}) => {
  const frame = useCurrentFrame();
  const captionOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: brand.colors.background,
        padding: 80,
        justifyContent: "center",
      }}
    >
      {caption && (
        <div
          style={{
            fontFamily: brand.font.family,
            fontSize: 56,
            fontWeight: 800,
            color: brand.colors.text,
            marginBottom: 40,
            textAlign: "center",
            opacity: captionOpacity,
          }}
        >
          {caption}
        </div>
      )}
      <div style={{ display: "flex", gap: 40 }}>
        <Panel side={before} accent={brand.colors.accent} slideFrom={-60} frame={frame} />
        <Panel side={after} accent={brand.colors.primary} slideFrom={60} frame={frame} />
      </div>
    </AbsoluteFill>
  );
};

export default BeforeAfter;
