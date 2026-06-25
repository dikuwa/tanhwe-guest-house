import { NextRequest, NextResponse } from "next/server";
import { getDocument, getDocumentSettings, getOwnerProfile, resolveShareCode } from "@/lib/admin-data";

// Rate limiter for invalid share code attempts
const rateLimit = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_ATTEMPTS) return false;
  entry.count++;
  return true;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const ip = _request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const { code } = await params;
  const link = await resolveShareCode(code);
  if (!link) {
    return new NextResponse(
      `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Document not found — Tanhwe Guest House</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f5f5f5;color:#172033}.card{text-align:center;padding:3rem;max-width:400px}.card h1{font-size:1.5rem;margin-bottom:.5rem}.card p{color:#667085;margin-bottom:1.5rem}.card a{color:#0D5CA8;text-decoration:none}</style></head>
<body><div class="card"><h1>Document not found</h1><p>This link may have expired or been revoked. Please contact Tanhwe Guest House for assistance.</p><a href="https://tanhweguesthouse.com">Visit Tanhwe Guest House</a></div></body>
</html>`,
      {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }

  if (link.expiresAt && new Date() > link.expiresAt) {
    return new NextResponse(
      `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Link expired — Tanhwe Guest House</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f5f5f5;color:#172033}.card{text-align:center;padding:3rem;max-width:400px}.card h1{font-size:1.5rem;margin-bottom:.5rem}.card p{color:#667085;margin-bottom:1.5rem}.card a{color:#0D5CA8;text-decoration:none}</style></head>
<body><div class="card"><h1>Link expired</h1><p>This document link has expired. Please contact Tanhwe Guest House for a new link.</p><a href="https://tanhweguesthouse.com">Visit Tanhwe Guest House</a></div></body>
</html>`,
      {
        status: 410,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }

  const [document, settings, owner] = await Promise.all([
    getDocument(link.documentId),
    getDocumentSettings(),
    getOwnerProfile(),
  ]);

  if (!document) {
    return new NextResponse(
      `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Document not found — Tanhwe Guest House</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f5f5f5;color:#172033}.card{text-align:center;padding:3rem;max-width:400px}.card h1{font-size:1.5rem;margin-bottom:.5rem}.card p{color:#667085;margin-bottom:1.5rem}.card a{color:#0D5CA8;text-decoration:none}</style></head>
<body><div class="card"><h1>Document not found</h1><p>This document could not be found. Please contact Tanhwe Guest House for assistance.</p><a href="https://tanhweguesthouse.com">Visit Tanhwe Guest House</a></div></body>
</html>`,
      {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }

  const { createDocumentPdf } = await import("@/lib/document-pdf");
  const buffer = await createDocumentPdf(document, {
    ...settings,
    ownerName: owner?.name ?? "",
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Tanhwe-${document.type.charAt(0).toUpperCase() + document.type.slice(1)}-${document.number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
