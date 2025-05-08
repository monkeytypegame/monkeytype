// based on https://gist.github.com/t3dotgg/a486c4ae66d32bf17c09c73609dacc5b

type Success<T> = {
  data: T;
  error: null;
};

type Failure<E> = {
  data: null;
  error: E;
};

type Result<T, E = Error> = Success<T> | Failure<E>;

export async function tryCatch<T, E = Error>(
  promiseOrFunction: Promise<T>
): Promise<Result<T, E>> {
  try {
    let data = await promiseOrFunction;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as E };
  }
}

export function tryCatchSync<T, E = Error>(fn: () => T): Result<T, E> {
  try {
    let data = fn();
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as E };
  }
}
