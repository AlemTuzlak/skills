import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { HighlightedCode } from "../highlighted-code";
import { brand } from "../brand";
import { Highlight } from "../highlight";
import type { SceneProps } from "../story-types";

const hexToRgba = (hex: string, alpha: number) => {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const CodeSnippet: React.FC<SceneProps<"CodeSnippet">> = ({
  language,
  code,
  highlightLines,
  caption,
}) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: brand.colors.background,
        padding: 80,
        justifyContent: "center",
        alignItems: "center",
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
            opacity: fadeIn,
            textAlign: "center",
          }}
        >
          <Highlight text={caption} />
        </div>
      )}
      <div
        style={{
          position: "relative",
          opacity: fadeIn,
          minWidth: "60%",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -20,
            left: 24,
            fontFamily: brand.font.family,
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "0.12em",
            padding: "6px 14px",
            borderRadius: 8,
            background: brand.colors.primary,
            color: "#000000",
            zIndex: 1,
          }}
        >
          {language.toUpperCase()}
        </div>
        <div
          style={{
            fontSize: 36,
            lineHeight: 1.5,
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 20,
            padding: 40,
            fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
            backdropFilter: "blur(2px)",
            boxShadow: `0 0 0 1px ${hexToRgba(brand.colors.primary, 0.25)}, 0 20px 60px ${hexToRgba(brand.colors.primary, 0.12)}`,
          }}
        >
          <HighlightedCode
            code={code}
            lang={language}
            highlightLines={highlightLines}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default CodeSnippet;
