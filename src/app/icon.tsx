import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          background: "#fffdf8",
          border: "2px solid #142033",
          position: "relative",
          overflow: "hidden",
          display: "flex",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 15,
            background: "#e23d2b",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 13,
            left: 0,
            right: 0,
            height: 4,
            background: "#142033",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 9,
            left: 9,
            width: 12,
            height: 12,
            borderRadius: 6,
            background: "#fffdf8",
            border: "2px solid #142033",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
