import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { brand } from "../brand";
import { Highlight } from "../highlight";
import type { SceneProps } from "../story-types";

export const CTAEndScreen: React.FC<SceneProps<"CTAEndScreen">> = ({
  headline,
  actionVerb,
  url,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const headlineEnter = spring({ frame, fps, config: { damping: 14 } });
  const headlineScale = interpolate(headlineEnter, [0, 1], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headlineOpacity = interpolate(headlineEnter, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ctaEnter = spring({ frame: Math.max(0, frame - 12), fps, config: { damping: 14 } });
  const ctaScale = interpolate(ctaEnter, [0, 1], [0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaOpacity = interpolate(ctaEnter, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const urlOpacity = interpolate(frame, [fps * 0.66, fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulse the arrow: 1.0 -> 1.08 -> 1.0 across the scene
  const arrowPulse = interpolate(
    frame,
    [0, durationInFrames / 2, durationInFrames],
    [1, 1.08, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${brand.colors.primary} 0%, #A8006A 100%)`,
        justifyContent: "center",
        alignItems: "center",
        gap: 32,
      }}
    >
      <div
        style={{
          fontFamily: brand.font.family,
          fontSize: 80,
          fontWeight: 800,
          color: brand.colors.background,
          textAlign: "center",
          transform: `scale(${headlineScale})`,
          opacity: headlineOpacity,
          maxWidth: "80%",
        }}
      >
        <Highlight text={headline} />
      </div>
      <div
        style={{
          fontFamily: brand.font.family,
          fontSize: 140,
          fontWeight: 900,
          color: brand.colors.accent,
          textTransform: "uppercase",
          letterSpacing: "-0.02em",
          transform: `scale(${ctaScale})`,
          opacity: ctaOpacity,
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
          gap: 24,
        }}
      >
        <span>{actionVerb}</span>
        <span
          style={{
            display: "inline-block",
            transform: `scale(${arrowPulse})`,
          }}
        >
          →
        </span>
      </div>
      {url && (
        <div
          style={{
            fontFamily: "'Fira Code', monospace",
            fontSize: 44,
            color: brand.colors.background,
            opacity: urlOpacity,
            padding: "12px 32px",
            borderRadius: 999,
            background: "rgba(0, 0, 0, 0.35)",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span>🔗</span>
          <span>{url}</span>
        </div>
      )}
    </AbsoluteFill>
  );
};

export default CTAEndScreen;
