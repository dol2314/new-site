import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@/components/Analytics";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { checkGuidePhases } from "@/lib/guide-phase";
import { checkLawTextAssumptions } from "@/lib/law-text-assumptions";
import { launchPreview, site } from "@/site.config";
import "./globals.css";

// 연말 법 개정 등으로 데이터가 바뀌어 글·도구 문장의 전제가 깨지면 빌드를 멈춘다
checkLawTextAssumptions();
checkGuidePhases();

const verificationOther: Record<string, string> = {};
if (site.verification.naver)
  verificationOther["naver-site-verification"] = site.verification.naver;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  icons: { icon: "/icon.png", apple: "/icon.png" },
  // robots는 페이지별로 넣는다(lib/seo.ts). 여기 넣으면 404 페이지에서 Next가 넣는 noindex와 중복된다.
  verification: {
    ...(site.verification.google ? { google: site.verification.google } : {}),
    ...(Object.keys(verificationOther).length
      ? { other: verificationOther }
      : {}),
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#14171c" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ko"
      data-build={
        site.indexable ? "public" : launchPreview ? "preview" : "draft"
      }
    >
      <body>
        <a href="#main" className="skip-link">
          본문 바로가기
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
