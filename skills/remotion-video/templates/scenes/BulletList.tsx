import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { brand } from "../brand";

export const BulletList: React.FC<{
  items: string[];
  caption?: string;
  durationFrames: number;
}> = ({ items, caption, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const captionOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  const stagger = Math.floor(durationFrames / (items.length + 2));

  return (
    <AbsoluteFill
      style={{
        backgroundColor: brand.colors.background,
        padding: 100,
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
            marginBottom: 60,
            opacity: captionOpacity,
          }}
        >
          {caption}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
        {items.map((item, i) => {
          const appearAt = (i + 1) * stagger;
          const local = Math.max(0, frame - appearAt);
          const enter = spring({ frame: local, fps, config: { damping: 14, stiffness: 120 } });
          const x = interpolate(enter, [0, 1], [-50, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const opacity = interpolate(enter, [0, 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={i}
              style={{
                fontFamily: brand.font.family,
                fontSize: 64,
                fontWeight: 800,
                color: brand.colors.text,
                transform: `translateX(${x}px)`,
                opacity,
                display: "flex",
                alignItems: "center",
                gap: 24,
              }}
            >
              <span
                style={{
                  color: brand.colors.primary,
                  fontSize: 80,
                  fontWeight: 900,
                  lineHeight: 0.8,
                }}
              >
                •
              </span>
              {item}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export default BulletList;
