/**
 * Urls of third party runtime files which are served from our own origin.
 * See `vite-plugins/vendor-assets.ts`.
 */
declare module "virtual:vendor-assets" {
  export type VendorAssets = {
    /** pdf.js web worker */
    pdfWorkerSrc: string;
    /** pdf.js character maps, ends with a slash */
    pdfCMapUrl: string;
    /** pdf.js standard fonts, ends with a slash */
    pdfStandardFontDataUrl: string;
    /** tesseract.js web worker */
    ocrWorkerPath: string;
    /** directory containing the tesseract.js-core builds */
    ocrCorePath: string;
    /** directory containing the tesseract language data */
    ocrLangPath: string;
  };

  export const vendorAssets: VendorAssets;
}
