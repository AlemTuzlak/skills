import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { HighlightedCode } from "../highlighted-code";
import { brand } from "../brand";
import type { SceneProps } from "../story-types";

export const CodeSnippet: React.FC<SceneProps<"CodeSnippet">> = ({
  language,
  code,
  highlightLines,
  caption,
}) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

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
          }}
        >
          {caption}
        </div>
      )}
      <div
        style={{
          opacity: fadeIn,
          fontSize: 36,
          lineHeight: 1.5,
          background: "#0d1117",
          color: "#e6edf3",
          borderRadius: 16,
          padding: 40,
          minWidth: "60%",
          fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
        }}
      >
        <HighlightedCode
          code={code}
          lang={language}
          theme="github-dark"
          highlightLines={highlightLines}
        />
      </div>
    </AbsoluteFill>
  );
};

export default CodeSnippet;
