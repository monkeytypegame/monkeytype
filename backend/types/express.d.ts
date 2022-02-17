// eslint-disable-next-line
declare namespace Express {
  export interface Request {
    ctx?: {
      configuration: any;
      decodedToken: {
        uid: null;
      };
    };
  }
}
