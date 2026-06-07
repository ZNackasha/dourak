import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Dourak — Smart Team Scheduling with Google Calendar";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #4f46e5 0%, #6d28d9 50%, #c026d3 100%)",
        color: "white",
        fontFamily: "sans-serif",
        padding: "80px",
      }}
    >
      {/* Calendar glyph */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "120px",
          height: "120px",
          borderRadius: "28px",
          background: "rgba(255,255,255,0.15)",
          border: "2px solid rgba(255,255,255,0.35)",
          marginBottom: "40px",
        }}
      >
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 2v4" />
          <path d="M16 2v4" />
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M3 10h18" />
        </svg>
      </div>

      <div
        style={{
          fontSize: "76px",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          textAlign: "center",
          lineHeight: 1.05,
          display: "flex",
        }}
      >
        Schedule your team in seconds
      </div>

      <div
        style={{
          marginTop: "28px",
          fontSize: "34px",
          fontWeight: 500,
          color: "rgba(255,255,255,0.85)",
          textAlign: "center",
          display: "flex",
        }}
      >
        Smart scheduling, powered by Google Calendar
      </div>

      <div
        style={{
          marginTop: "56px",
          fontSize: "40px",
          fontWeight: 700,
          letterSpacing: "0.02em",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        Dourak
      </div>
    </div>,
    {
      ...size,
    },
  );
}
