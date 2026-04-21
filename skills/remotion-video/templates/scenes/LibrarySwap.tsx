import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { HighlightedCode } from "../highlighted-code";
import { brand } from "../brand";
import { Highlight } from "../highlight";
import type { SceneProps } from "../story-types";

export const LibrarySwap: React.FC<SceneProps<"LibrarySwap">> = ({
  sharedCode,
  libraries,
  caption,
  durationFrames,
}) => {
  const frame = useCurrentFrame();
  if (libraries.length === 0) {
    throw new Error(
      "LibrarySwap: libraries array is empty. The scene needs at least one library to showcase.",
    );
  }
  const segment = Math.floor(durationFrames / libraries.length);
  const currentIndex = Math.min(Math.floor(frame / segment), libraries.length - 1);
  const current = libraries[currentIndex];

  const swapProgress = (frame % segment) / segment;
  const importScale = interpolate(swapProgress, [0, 0.15, 1], [1.2, 1, 1], {
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
            fontSize: 48,
            fontWeight: 800,
            color: brand.colors.text,
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          <Highlight text={caption} />
        </div>
      )}

      <div
        style={{
          fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
          fontSize: 40,
          color: brand.colors.primary,
          marginBottom: 16,
          transform: `scale(${importScale})`,
          transformOrigin: "left center",
          transition: "color 0.2s",
        }}
        key={current.name}
      >
        {current.importLine}
      </div>

      <div
        style={{
          fontSize: 36,
          lineHeight: 1.5,
          background: "#0d1117",
          color: "#e6edf3",
          borderRadius: 20,
          padding: 40,
          minWidth: "60%",
          fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
          boxShadow:
            "0 0 0 1px rgba(236, 0, 139, 0.3), 0 20px 60px rgba(236, 0, 139, 0.15)",
        }}
      >
        <HighlightedCode code={sharedCode} lang="ts" theme="github-dark" />
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
        {libraries.map((lib, i) => (
          <div
            key={lib.name}
            style={{
              fontFamily: brand.font.family,
              fontSize: 28,
              fontWeight: 700,
              padding: "8px 20px",
              borderRadius: 999,
              background: i === currentIndex ? brand.colors.primary : "transparent",
              color: i === currentIndex ? brand.colors.background : brand.colors.text,
              border: `2px solid ${brand.colors.primary}`,
            }}
          >
            {lib.name}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export default LibrarySwap;
