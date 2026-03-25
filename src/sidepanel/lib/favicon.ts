const FALLBACK_SVG = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'><circle cx='8' cy='8' r='7' stroke='%23AAAAAA' stroke-width='1.5' fill='none'/><path d='M8 1c0 0-3 3-3 7s3 7 3 7M8 1c0 0 3 3 3 7s-3 7-3 7M1 8h14' stroke='%23AAAAAA' stroke-width='1.5' fill='none'/></svg>`;

export function getFaviconUrl(url: string): string {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return FALLBACK_SVG;
  }
}

export function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export { FALLBACK_SVG };
