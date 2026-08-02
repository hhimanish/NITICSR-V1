import QRCode from "qrcode";

/**
 * Field Intelligence (ERT 7) — browser-native capabilities over existing
 * project data. Geofence distance is computed with the same Haversine SQL
 * expression already used in ngo-profiles/csr-projects search (inlined at
 * the call site, per that existing convention, not duplicated here as a
 * separate JS implementation). This module holds survey validation and
 * local QR generation — no camera, biometric, or SMS vendor involved.
 */

export const GEOFENCE_RADIUS_KM = 2;

export type SurveyQuestion = {
  key: string;
  label: string;
  type: "text" | "number" | "choice";
  required?: boolean;
  options?: string[];
};

export type SurveyValidationResult = { valid: boolean; errors: string[] };

/** Checks submitted answers against a survey's question definitions —
 * required fields present, choice answers are one of the defined options.
 * Doesn't coerce or guess at missing data. */
export function validateSurveyAnswers(
  questions: SurveyQuestion[],
  answers: Record<string, unknown>
): SurveyValidationResult {
  const errors: string[] = [];

  for (const q of questions) {
    const value = answers[q.key];
    const missing = value === undefined || value === null || value === "";

    if (q.required && missing) {
      errors.push(`${q.label} is required`);
      continue;
    }
    if (missing) continue;

    if (q.type === "number" && typeof value !== "number") {
      errors.push(`${q.label} must be a number`);
    }
    if (q.type === "choice" && q.options && !q.options.includes(String(value))) {
      errors.push(`${q.label} must be one of: ${q.options.join(", ")}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Generates a QR code as an inline SVG string — entirely local, no
 * third-party API call, no vendor account. */
export async function generateQrCodeSvg(text: string): Promise<string> {
  return QRCode.toString(text, { type: "svg", margin: 1, width: 220 });
}
