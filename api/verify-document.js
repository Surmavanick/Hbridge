// Vercel serverless function: reviews an uploaded PDF against the document
// type the patient claims it is (e.g. "Cardiac ECG"), using OpenAI to check
// whether the extracted text is plausibly consistent with that document type.
//
// Fails open: any technical failure (download, parsing, OpenAI error) results
// in `valid: true, skipped: true` rather than blocking the patient's upload.

import { extractText } from "unpdf";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const { url, documentType } = req.body || {};
  if (!url || typeof url !== "string" || !documentType || typeof documentType !== "string") {
    res.status(400).json({ error: "url and documentType are required" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(200).json({ valid: true, skipped: true, reason: "Verification not configured." });
    return;
  }

  let text = "";
  try {
    const fileRes = await fetch(url);
    if (!fileRes.ok) throw new Error(`download_${fileRes.status}`);
    const buffer = new Uint8Array(await fileRes.arrayBuffer());
    const result = await extractText(buffer, { mergePages: true });
    text = (result.text || "").trim();
  } catch {
    res.status(200).json({ valid: true, skipped: true, reason: "Could not read the PDF; accepted without automated review." });
    return;
  }

  if (text.length < 30) {
    // No extractable text layer (scanned image PDF) — nothing to check.
    res.status(200).json({ valid: true, skipped: true, reason: "Document has no extractable text (likely a scan); accepted without automated review." });
    return;
  }

  const truncated = text.slice(0, 6000);
  const prompt = `You are a medical document intake reviewer for a medical tourism company. A patient uploaded a PDF and labeled it as: "${documentType}".

Extracted text from the PDF:
"""
${truncated}
"""

Decide whether this document's actual content is genuinely consistent with being a "${documentType}". Look for relevant medical terminology, structure, or content matching that document type. Reject documents that are clearly unrelated (e.g. an invoice, a random letter, a blank/empty page, or an obviously different document type).

Respond with ONLY a JSON object: {"valid": true or false, "reason": "<one short sentence explaining why>"}`;

  try {
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0,
        max_tokens: 200,
      }),
    });

    if (!aiRes.ok) {
      res.status(200).json({ valid: true, skipped: true, reason: "AI review unavailable; accepted by default." });
      return;
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content ?? "{}";
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { valid: true, reason: "Could not parse AI response; accepted by default." };
    }

    res.status(200).json({
      valid: Boolean(parsed.valid),
      reason: typeof parsed.reason === "string" ? parsed.reason : "",
    });
  } catch {
    res.status(200).json({ valid: true, skipped: true, reason: "AI review failed; accepted by default." });
  }
}
