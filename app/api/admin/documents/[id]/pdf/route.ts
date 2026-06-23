import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDocument } from "@/lib/admin-data";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const document = await getDocument((await params).id);
  if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  const { createDocumentPdf } = await import("@/lib/document-pdf");
  const buffer = await createDocumentPdf(document);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${document.number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
