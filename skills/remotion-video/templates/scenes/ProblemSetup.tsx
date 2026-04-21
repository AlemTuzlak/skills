import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { brand } from "../brand";

export const ProblemSetup: React.FC<{
  text: string;
  visualBeats: string[];
  durationFrames: number;
}> = ({ text, visualBeats, durationFrames }) => {
  const frame = useCurrentFrame();
  const headerOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  const beatInterval = Math.floor(durationFrames / (visualBeats.length + 1));

  return (
    <AbsoluteFill
      style={{
        backgroundColor: brand.colors.background,
        padding: 80,
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: brand.font.family,
          fontSize: 72,
          fontWeight: 800,
          color: brand.colors.text,
          opacity: headerOpacity,
          marginBottom: 60,
        }}
      >
        {text}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {visualBeats.map((beat, i) => {
          const appearAt = (i + 1) * beatInterval;
          const beatOpacity = interpolate(
            frame,
            [appearAt, appearAt + 8],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          const beatX = interpolate(
            frame,
            [appearAt, appearAt + 12],
            [-40, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          return (
            <div
              key={i}
              style={{
                fontFamily: brand.font.family,
                fontSize: 44,
                color: brand.colors.text,
                opacity: beatOpacity,
                transform: `translateX(${beatX}px)`,
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <span style={{ color: brand.colors.accent, fontWeight: 900 }}>×</span>
              <span>{beat}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export default ProblemSetup;
