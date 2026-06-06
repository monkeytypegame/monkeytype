import { NextFunction, Request, RequestHandler, Response } from "express";
import zlib from "zlib";

export function decompressRequest(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const encoding = req.headers["content-encoding"];

    if (encoding === "gzip") {
      //TODO: try catch
      console.log(req.body);
      const unzip = zlib.createGunzip();
      req.pipe(unzip);

      let buffer = [];
      unzip.on("data", (chunk) => buffer.push(chunk as never));
      unzip.on("end", () => {
        // oxlint-disable-next-line typescript/no-unsafe-assignment
        req.body = JSON.parse(Buffer.concat(buffer).toString());
        next();
      });
    } else {
      next();
    }
  };
}
