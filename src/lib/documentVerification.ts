export interface DocumentVerifyResult {
  valid: boolean;
  reason?: string;
  skipped?: boolean;
}

// Fails open — any network/server issue is treated as "not checked", not as a mismatch.
export async function verifyDocument(url: string, documentType: string): Promise<DocumentVerifyResult> {
  try {
    const res = await fetch("/api/verify-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, documentType }),
    });
    if (!res.ok) return { valid: true, skipped: true, reason: "Verification unavailable." };
    return await res.json();
  } catch {
    return { valid: true, skipped: true, reason: "Verification unavailable." };
  }
}
