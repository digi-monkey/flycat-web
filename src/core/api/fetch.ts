export async function fetchWithTimeout(
  url: string,
  timeout: number,
  options: any,
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(url, { ...options, signal: controller.signal });
  clearTimeout(timeoutId);
  return response;
}
