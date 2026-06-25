type Props = {
  ownerName: string;
  roleLabel?: string;
};

export function SignatureBlock({ ownerName, roleLabel = "Managing Director" }: Props) {
  const maxChars = 20;
  const isLong = ownerName.length > maxChars;
  const fontSize = isLong ? Math.max(20, 30 - (ownerName.length - maxChars) * 1.2) : 30;

  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-allura), Allura, cursive",
          fontSize,
          fontWeight: 400,
          lineHeight: 0.9,
          letterSpacing: -0.5,
          transform: "rotate(-4deg)",
          transformOrigin: "left center",
          display: "inline-block",
          whiteSpace: "nowrap",
          color: "#2C2C2C",
          maxWidth: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {ownerName}
      </div>
      <div style={{ marginTop: 4, fontWeight: 600, fontSize: 14, lineHeight: 1.3, color: "#1C1C1C" }}>
        {ownerName}
      </div>
      <div style={{ fontSize: 13, color: "#667085", lineHeight: 1.3 }}>
        {roleLabel}
      </div>
    </div>
  );
}
