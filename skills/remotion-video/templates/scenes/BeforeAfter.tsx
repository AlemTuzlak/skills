import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { HighlightedCode } from "../highlighted-code";
import { brand } from "../brand";
import { Highlight } from "../highlight";
import type { SceneContent, SceneProps } from "../story-types";

const hexToRgba = (hex: string, alpha: number) => {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const Panel: React.FC<{
  side: SceneContent;
  accent: string;
  icon: string;
  slideFrom: number;
  frame: number;
}> = ({ side, accent, icon, slideFrom, frame }) => {
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
        borderRadius: 20,
        borderTop: `6px solid ${accent}`,
        boxShadow: `0 0 0 1px ${hexToRgba(accent, 0.3)}, 0 20px 60px ${hexToRgba(accent, 0.15)}`,
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
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span>{icon}</span>
        <span>{side.label}</span>
      </div>
      {side.code ? (
        <div style={{ fontSize: 28, fontFamily: "'Fira Code', monospace", color: "#e6edf3" }}>
          <HighlightedCode code={side.code} lang={side.language} theme="github-dark" />
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
          <Highlight text={caption} />
        </div>
      )}
      <div style={{ display: "flex", gap: 40 }}>
        <Panel
          side={before}
          accent={brand.colors.danger}
          icon="❌"
          slideFrom={-60}
          frame={frame}
        />
        <Panel
          side={after}
          accent={brand.colors.success}
          icon="✅"
          slideFrom={60}
          frame={frame}
        />
      </div>
    </AbsoluteFill>
  );
};

export default BeforeAfter;
