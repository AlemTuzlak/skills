import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { brand } from "../brand";
import type { SceneProps } from "../story-types";

export const CTAEndScreen: React.FC<SceneProps<"CTAEndScreen">> = ({
  headline,
  actionVerb,
  url,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headlineEnter = spring({ frame, fps, config: { damping: 14 } });
  const headlineScale = interpolate(headlineEnter, [0, 1], [0.85, 1]);
  const headlineOpacity = interpolate(headlineEnter, [0, 1], [0, 1]);

  const ctaEnter = spring({ frame: Math.max(0, frame - 12), fps, config: { damping: 14 } });
  const ctaScale = interpolate(ctaEnter, [0, 1], [0.8, 1]);
  const ctaOpacity = interpolate(ctaEnter, [0, 1], [0, 1]);

  const urlOpacity = interpolate(frame, [fps * 0.66, fps], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: brand.colors.primary,
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
        {headline}
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
        }}
      >
        {actionVerb}
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
            background: "rgba(0, 0, 0, 0.25)",
          }}
        >
          {url}
        </div>
      )}
    </AbsoluteFill>
  );
};

export default CTAEndScreen;
