import { ImageResponse } from "next/og";

export function appIcon({
  size,
  glyphScale = 1,
  rounded = false,
}: {
  size: number;
  glyphScale?: number;
  rounded?: boolean;
}) {
  const unit = (size / 180) * glyphScale;
  const at = (value: number) => (size - 180 * unit) / 2 + value * unit;
  const box = (left: number, top: number, width: number, height: number) => ({
    position: "absolute" as const,
    left: at(left),
    top: at(top),
    width: width * unit,
    height: height * unit,
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#7cc495",
          borderRadius: rounded ? size / 4 : 0,
          position: "relative",
        }}
      >
        <div style={{ ...box(78, 18, 24, 30), borderRadius: `${12 * unit}px ${12 * unit}px ${3 * unit}px ${3 * unit}px`, background: "#fde7a9" }} />
        <div style={{ ...box(62, 44, 56, 16), borderRadius: 5 * unit, background: "#f8cddf" }} />
        <div style={{ ...box(58, 58, 64, 104), borderRadius: `${10 * unit}px ${10 * unit}px ${20 * unit}px ${20 * unit}px`, background: "#ffffff", display: "flex" }} />
        <div style={{ ...box(58, 104, 64, 58), borderRadius: `0 0 ${20 * unit}px ${20 * unit}px`, background: "#fff6dc" }} />
        <div style={{ ...box(70, 76, 16, 5), borderRadius: 3 * unit, background: "#7cc495" }} />
        <div style={{ ...box(70, 92, 22, 5), borderRadius: 3 * unit, background: "#7cc495" }} />
        <div style={{ ...box(70, 120, 16, 5), borderRadius: 3 * unit, background: "#7cc495" }} />
        <div style={{ ...box(70, 136, 22, 5), borderRadius: 3 * unit, background: "#7cc495" }} />
      </div>
    ),
    { width: size, height: size },
  );
}
