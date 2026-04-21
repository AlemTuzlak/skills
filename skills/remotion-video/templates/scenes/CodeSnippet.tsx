import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { HighlightedCode } from "../highlighted-code";
import { brand } from "../brand";
import { Highlight } from "../highlight";
import type { SceneProps } from "../story-types";

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
            background: "#0d1117",
            color: "#e6edf3",
            borderRadius: 20,
            padding: 40,
            fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
            boxShadow:
              "0 0 0 1px rgba(236, 0, 139, 0.3), 0 20px 60px rgba(236, 0, 139, 0.15)",
          }}
        >
          <HighlightedCode
            code={code}
            lang={language}
            theme="github-dark"
            highlightLines={highlightLines}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default CodeSnippet;
