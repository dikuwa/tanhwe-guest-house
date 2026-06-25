import { NextRequest, NextResponse } from "next/server";
import { getDocument, getDocumentSettings, getOwnerProfile } from "@/lib/admin-data";
import { verifyDocumentShareUrl } from "@/lib/document-share";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const documentId = verifyDocumentShareUrl(token);
  if (!documentId) {
    return NextResponse.json(
      { error: "This link has expired or is invalid" },
      { status: 410 }
    );
  }
  const [document, settings, owner] = await Promise.all([
    getDocument(documentId),
    getDocumentSettings(),
    getOwnerProfile(),
  ]);
  if (!document) {
    return NextResponse.json(
      { error: "Document not found" },
      { status: 404 }
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
      "Content-Disposition": `attachment; filename="${document.number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
