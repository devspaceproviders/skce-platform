/**
 * Shared form validation + friendly error wording.
 * Every validator returns "" when the value is fine, otherwise a
 * short, specific message that tells the user exactly what to fix.
 *
 * (Kept as .tsx so Windows does not treat it as a video file.)
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Letters from any language (English, Telugu, Hindi, ...) + space . ' -
// Built at runtime so older TypeScript targets do not complain.
const NAME_RE = new RegExp("^[\\p{L}\\p{M}][\\p{L}\\p{M} .'’-]*$", "u");

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Strips +91 / 0 prefixes so "+91 98854 22483" becomes "9885422483". */
export function normalizeIndianMobile(value: string): string {
  let digits = digitsOnly(value);

  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  return digits;
}

export function validateEmail(value: string, required = true): string {
  const email = value.trim();

  if (!email) {
    return required ? "Please enter your email address." : "";
  }

  if (/\s/.test(email)) {
    return "Email address can't contain spaces.";
  }

  if (!email.includes("@")) {
    return "Your email address needs an @ symbol, like name@example.com.";
  }

  if (
    email.length > 254 ||
    email.includes("..") ||
    !EMAIL_RE.test(email)
  ) {
    return "Enter a valid email address, like name@example.com.";
  }

  return "";
}

export function validateMobile(
  value: string,
  required = true,
  label = "mobile number"
): string {
  const raw = value.trim();

  if (!raw) {
    return required ? `Please enter your ${label}.` : "";
  }

  if (/[A-Za-z]/.test(raw)) {
    return `A ${label} can contain digits only.`;
  }

  const digits = normalizeIndianMobile(raw);

  if (!/^[6-9]\d{9}$/.test(digits)) {
    return `Enter a valid 10-digit ${label} starting with 6, 7, 8 or 9.`;
  }

  return "";
}

export function validatePin(value: string): string {
  const pin = value.trim();

  if (!pin) {
    return "Please enter your PIN code.";
  }

  if (!/^\d+$/.test(pin)) {
    return "PIN code can contain digits only.";
  }

  if (!/^[1-9]\d{5}$/.test(pin)) {
    return "Enter a valid 6-digit PIN code.";
  }

  return "";
}

export function validatePersonName(
  value: string,
  label = "your full name",
  required = true
): string {
  const name = value.trim();

  if (!name) {
    return required ? `Please enter ${label}.` : "";
  }

  if (name.length < 2) {
    return "Name must be at least 2 characters long.";
  }

  if (name.length > 60) {
    return "Name is too long (maximum 60 characters).";
  }

  if (!NAME_RE.test(name)) {
    return "Use letters only. Numbers and special characters aren't allowed here.";
  }

  return "";
}

export function validatePlaceName(value: string, label = "city"): string {
  const place = value.trim();

  if (!place) {
    return `Please enter your ${label}.`;
  }

  if (place.length < 2) {
    return `Enter a valid ${label} name.`;
  }

  if (!NAME_RE.test(place)) {
    return `Enter a valid ${label} name using letters only.`;
  }

  return "";
}

export function validatePassword(value: string): string {
  if (!value) {
    return "Please enter a password.";
  }

  if (value.length < 8) {
    return `Password must be at least 8 characters (you have ${value.length}).`;
  }

  return "";
}

export function validateDob(value: string): string {
  if (!value) {
    return "Please enter your date of birth.";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "Enter a valid date of birth.";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date > today) {
    return "Date of birth can't be in the future.";
  }

  const ageInYears =
    (today.getTime() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

  if (ageInYears > 100) {
    return "Enter a valid date of birth.";
  }

  return "";
}

export function passwordStrength(value: string): {
  score: number;
  label: string;
  tips: string[];
} {
  const hasLower = /[a-z]/.test(value);
  const hasUpper = /[A-Z]/.test(value);
  const hasDigit = /\d/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);

  let score = 0;

  if (value.length >= 8) score += 1;
  if ((hasLower || hasUpper) && hasDigit) score += 1;
  if (hasLower && hasUpper) score += 1;
  if (hasSymbol || value.length >= 12) score += 1;

  const tips: string[] = [];

  if (value.length < 8) tips.push("at least 8 characters");
  if (!hasDigit) tips.push("a number");
  if (!(hasLower && hasUpper)) tips.push("upper and lower case letters");
  if (!hasSymbol) tips.push("a symbol");

  const label =
    score <= 1 ? "Weak" : score === 2 ? "Fair" : score === 3 ? "Good" : "Strong";

  return { score, label, tips };
}

/* =====================================================================
   FRIENDLY ERROR WORDING
   ===================================================================== */

export const NETWORK_ERROR_MESSAGE =
  "We couldn't reach the server. Please check your internet connection and try again.";

/** fetch() throws a TypeError when the network is down or the server is unreachable. */
export function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (isNetworkError(error)) {
    return NETWORK_ERROR_MESSAGE;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

/** Turns raw backend sign-in messages into something a student can act on. */
export function friendlyAuthMessage(message: string): string {
  if (/too many|rate limit|try again later/i.test(message)) {
    return "Too many attempts. Please wait a few minutes before trying again.";
  }

  if (/inactive|disabled|blocked|suspend|deactivat/i.test(message)) {
    return "This account is inactive. Please contact SK Computer Education for help.";
  }

  if (
    /invalid|incorrect|wrong|credential|not found|no user|does not match|unauthori[sz]ed/i.test(
      message
    )
  ) {
    return "Incorrect email or password. Please check your details and try again.";
  }

  return message;
}
