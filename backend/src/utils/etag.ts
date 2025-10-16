import { COMPATIBILITY_CHECK } from "@monkeytype/contracts";
import { default as etag } from "etag";

/**
 * create etag generator, based on the express implementation https://github.com/expressjs/express/blob/9f4dbe3a1332cd883069ba9b73a9eed99234cfc7/lib/utils.js#L247
 * Adds the api COMPATIBILITY_CHECK version in front of the etag.
 * @param options
 * @returns
 */
export function createETagGenerator(options: {
  weak: boolean;
}): (body: Buffer | string, encoding: BufferEncoding | undefined) => string {
  return function generateETag(body, encoding) {
    const buf = !Buffer.isBuffer(body) ? Buffer.from(body, encoding) : body;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const generatedTag: string = etag(buf, options);

    //custom code to add the version number
    if (generatedTag.startsWith("W/")) {
      return `W/"V${COMPATIBILITY_CHECK}-${generatedTag.slice(3)}`;
    }
    return `"V${COMPATIBILITY_CHECK}-${generatedTag.slice(1)}`;
  };
}
