/* eslint-disable @typescript-eslint/no-unused-vars */
// for some reason when using the dot notaion, the types are not being recognized as used
declare namespace Ape.Quotes {
  type Quote = {
    _id: string;
    text: string;
    source: string;
    language: string;
    submittedBy: string;
    timestamp: number;
    approved: boolean;
  };

  type QuoteRating = {
    _id: string;
    average: number;
    language: string;
    quoteId: number;
    ratings: number;
    totalRating: number;
  };

  type ApproveReturn = {
    quote: {
      id?: number;
      text: string;
      source: string;
      length: number;
      approvedBy: string;
    };
    message: string;
  };

  type GetQuotes = Quote[];
  type GetIsSubmissionEnabled = { isEnabled: boolean };
  type GetRating = QuoteRating | null;

  type PostQuotes = null;
  type PostApprove = ApproveReturn;
  type PostReject = null;
  type PostRating = QuoteRating | null;
  type PostReport = null;
}
