type RetryOptions = {
  retries?: number;
  backoff?: (attempt: number) => number;
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions | number = 3
): Promise<T> {
  const retries = typeof options === "number" ? options : options.retries ?? 3;
  const backoff =
    typeof options === "object" && options.backoff
      ? options.backoff
      : (a: number) => 300 * Math.pow(2, a);

  let lastErr: any;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      await new Promise((r) =>
        setTimeout(r, backoff(i) + Math.random() * 200)
      );
    }
  }

  throw lastErr;
}