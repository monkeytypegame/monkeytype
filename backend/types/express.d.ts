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
