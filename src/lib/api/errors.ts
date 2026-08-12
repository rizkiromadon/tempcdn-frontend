export class TempCdnError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "TempCdnError";
  }
}

export async function parseError(res: Response, fallbackMessage?: string): Promise<never> {
  let message = fallbackMessage ?? `Request failed with status ${res.status}`;
  try {
    const body = await res.json();
    if (body?.error) message = body.error;
  } catch {
  }
  throw new TempCdnError(message, res.status);
}
