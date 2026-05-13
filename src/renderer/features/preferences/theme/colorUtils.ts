export function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export function normalizeHex(input: string): string | null {
  const s = input.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) {
    return s.toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(s)) {
    return `#${s.toLowerCase()}`;
  }
  return null;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const n = normalizeHex(hex);
  if (!n) {
    return null;
  }
  const raw = n.slice(1);
  const v = parseInt(raw, 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (x: number) =>
    Math.max(0, Math.min(255, Math.round(x)))
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function mixHex(from: string, to: string, t: number): string {
  const A = hexToRgb(from);
  const B = hexToRgb(to);
  if (!A || !B) {
    return normalizeHex(from) ?? from;
  }
  const u = clamp01(t);
  return rgbToHex(A.r + (B.r - A.r) * u, A.g + (B.g - A.g) * u, A.b + (B.b - A.b) * u);
}

export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return 0;
  }
  const lin = [rgb.r, rgb.g, rgb.b].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

export function pickContrastingFg(accentHex: string): string {
  const hex = normalizeHex(accentHex) ?? accentHex;
  return relativeLuminance(hex) > 0.45 ? "#0a0f1a" : "#f8fafc";
}
