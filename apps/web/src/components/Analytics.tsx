import Script from "next/script";
import { site } from "@/site.config";

/** GA4. 측정 ID가 없으면 아무것도 넣지 않는다. */
export function Analytics() {
  if (!/^G-[A-Z0-9]+$/.test(site.gaId)) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${site.gaId}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${site.gaId}');`}
      </Script>
    </>
  );
}
