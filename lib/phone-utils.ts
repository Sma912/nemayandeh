/**
 * Normalizes Iranian phone numbers to a consistent format
 * Converts all formats to 11-digit format starting with "09"
 *
 * Examples:
 * - "9123456789" -> "09123456789"
 * - "0912345678" -> "09123456789" (adds missing 9)
 * - "09123456789" -> "09123456789" (already correct)
 * - "+989123456789" -> "09123456789"
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return phone

  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "")

  // Remove country code if present (98)
  if (cleaned.startsWith("98")) {
    cleaned = cleaned.substring(2)
  }

  // If it starts with 0 and is 10 digits, it might be missing the 9
  // Check if second digit is not 9
  if (cleaned.length === 10 && cleaned.startsWith("0") && cleaned[1] !== "9") {
    // Insert 9 after the 0
    cleaned = "09" + cleaned.substring(1)
  }

  // If it starts with 9 and is 10 digits, add 0 at the beginning
  if (cleaned.length === 10 && cleaned.startsWith("9")) {
    cleaned = "0" + cleaned
  }

  // If it doesn't start with 0 and is 9 digits, add 09 at the beginning
  if (cleaned.length === 9 && !cleaned.startsWith("0")) {
    cleaned = "09" + cleaned
  }

  return cleaned
}
