/* eslint-disable @typescript-eslint/no-unsafe-member-access */
export function init(): void {
  $("head").append(`<script>
  !function(e){var s=new XMLHttpRequest;s.open("GET","https://api.enthusiastgaming.net/scripts/cdn.enthusiast.gg/script/eg-aps/release/eg-aps-bootstrap-v2.0.0.bundle.js?site=monkeytype.com",!0),s.onreadystatechange=function(){var t;4==s.readyState&&(200<=s.status&&s.status<300||304==s.status)&&((t=e.createElement("script")).type="text/javascript",t.text=s.responseText,e.head.appendChild(t))},s.send(null)}(document);
  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-W7WN5QV');
  </script>`);
  $("body")
    .prepend(`<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-W7WN5QV"
  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`);
}

export function renderResult(widerThanBreakpoint: boolean): void {
  if (widerThanBreakpoint) {
    //@ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    window.egAps.render([
      "ad-result",
      "ad-vertical-left",
      "ad-vertical-right",
      "ad-footer",
    ]);
  } else {
    //@ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    window.egAps.render([
      "ad-result-small",
      "ad-vertical-left",
      "ad-vertical-right",
      "ad-footer-small",
    ]);
  }
}

export function reinstate(): boolean {
  try {
    //@ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    window.egAps.reinstate();
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function refreshVisible(): Promise<void> {
  ////@ts-expect-error
  // const adDivs = Object.keys(window.egAdPack.gptAdSlots);
  // const visibleAdDivs = [];
  // for (let i = 0; i < adDivs.length; i++) {
  //   const el = document.querySelectorAll(
  //     "[data-adunit-name='" + adDivs[i] + "']"
  //   )[0];
  //   if (!el) continue;
  //   const elParent = el.parentElement as HTMLElement;
  //   if (
  //     window.getComputedStyle(elParent).getPropertyValue("display") !== "none"
  //   ) {
  //     visibleAdDivs.push(adDivs[i]);
  //   }
  // }
  // //@ts-ignore
  // window.egAps.refreshAds(visibleAdDivs);
}
