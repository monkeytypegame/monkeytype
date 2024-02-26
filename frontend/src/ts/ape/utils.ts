type ShouldRetryCallback<ResponseDataType> = (
  statusCode: number,
  response?: Ape.HttpClientResponse<ResponseDataType>
) => boolean;

type RetryOptions<ResponseDataType = unknown> = {
  shouldRetry?: ShouldRetryCallback<ResponseDataType>;
  retryAttempts?: number;
  retryDelayMs?: number;
};

const wait = async (delay: number): Promise<number> =>
  new Promise((resolve) => window.setTimeout(resolve, delay));

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  shouldRetry: (statusCode: number): boolean =>
    statusCode >= 500 && statusCode !== 503,
  retryAttempts: 3,
  retryDelayMs: 3000,
};

export async function withRetry<ResponseDataType>(
  fn: () => Ape.EndpointResponse<ResponseDataType>,
  opts?: RetryOptions<ResponseDataType>
): Ape.EndpointResponse<ResponseDataType> {
  const retry = async (
    previousData: Ape.HttpClientResponse<ResponseDataType>,
    completeOpts: Required<RetryOptions<ResponseDataType>>
  ): Promise<Ape.HttpClientResponse<ResponseDataType>> => {
    const { retryAttempts, shouldRetry, retryDelayMs } = completeOpts;

    if (retryAttempts <= 0 || !shouldRetry(previousData.status, previousData)) {
      return previousData;
    }

    const data = await fn();
    const { status } = data;

    if (shouldRetry(status, data)) {
      await wait(retryDelayMs);

      --completeOpts.retryAttempts;
      return await retry(data, completeOpts);
    }

    return data;
  };

  return await retry(await fn(), {
    ...DEFAULT_RETRY_OPTIONS,
    ...opts,
  });
}
