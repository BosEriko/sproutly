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

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#16a34a",
          borderRadius: rounded ? size / 4 : 0,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: at(84),
            top: at(62),
            width: 12 * unit,
            height: 88 * unit,
            borderRadius: 6 * unit,
            background: "#ffffff",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: at(36),
            top: at(48),
            width: 56 * unit,
            height: 34 * unit,
            borderRadius: `${34 * unit}px 0`,
            background: "#ffffff",
            transform: "rotate(25deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: at(88),
            top: at(34),
            width: 60 * unit,
            height: 36 * unit,
            borderRadius: `0 ${36 * unit}px`,
            background: "#ffffff",
            transform: "rotate(-25deg)",
          }}
        />
      </div>
    ),
    { width: size, height: size },
  );
}
