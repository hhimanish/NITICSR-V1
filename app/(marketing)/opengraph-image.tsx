import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          backgroundColor: "#0F172A",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: "#F8FAFC",
              color: "#0F172A",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 700,
            }}
          >
            N
          </div>
          <div style={{ display: "flex", color: "#F8FAFC", fontSize: 40, fontWeight: 700 }}>NITICSR</div>
        </div>
        <div style={{ display: "flex", color: "#F8FAFC", fontSize: 56, fontWeight: 700, lineHeight: 1.15, maxWidth: 900 }}>
          Verified Impact. Absolute Compliance.
        </div>
        <div style={{ display: "flex", color: "#94A3B8", fontSize: 28, marginTop: 24, maxWidth: 800 }}>
          India&apos;s Enterprise CSR Operating System
        </div>
      </div>
    ),
    { ...size }
  );
}
