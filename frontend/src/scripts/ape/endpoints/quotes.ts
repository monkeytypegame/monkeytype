const BASE_PATH = "/quotes";

export default function getQuotesEndpoints(
  apeClient: Ape.Client
): Ape.Endpoints["quotes"] {
  async function get(): Ape.EndpointData {
    return await apeClient.get(BASE_PATH);
  }

  async function submit(
    text: string,
    source: string,
    language: string,
    captcha: string
  ): Ape.EndpointData {
    const payload = {
      text,
      source,
      language,
      captcha,
    };

    return await apeClient.post(BASE_PATH, { payload });
  }

  async function approveSubmission(
    quoteSubmissionId: string,
    editText?: string,
    editSource?: string
  ): Ape.EndpointData {
    const payload = {
      quoteId: quoteSubmissionId,
      editText,
      editSource,
    };

    return await apeClient.post(`${BASE_PATH}/approve`, { payload });
  }

  async function rejectSubmission(quoteSubmissionId: string): Ape.EndpointData {
    return await apeClient.post(`${BASE_PATH}/reject`, {
      payload: { quoteId: quoteSubmissionId },
    });
  }

  async function getRating(quote: MonkeyTypes.Quote): Ape.EndpointData {
    const searchQuery = {
      quoteId: quote.id,
      language: quote.language,
    };

    return await apeClient.get(`${BASE_PATH}/rating`, { searchQuery });
  }

  async function addRating(
    quote: MonkeyTypes.Quote,
    rating: number
  ): Ape.EndpointData {
    const payload = {
      quoteId: quote.id,
      rating,
      language: quote.language,
    };

    return await apeClient.post(`${BASE_PATH}/rating`, { payload });
  }

  async function report(
    quoteId: string,
    quoteLanguage: string,
    reason: string,
    comment: string,
    captcha: string
  ): Ape.EndpointData {
    const payload = {
      quoteId,
      quoteLanguage,
      reason,
      comment,
      captcha,
    };

    return await apeClient.post(`${BASE_PATH}/report`, { payload });
  }

  return {
    get,
    submit,
    approveSubmission,
    rejectSubmission,
    getRating,
    addRating,
    report,
  };
}
