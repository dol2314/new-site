import Link from "next/link";
import { site } from "@/site.config";

const LINKS = [
  { href: "/about/", label: "소개" },
  { href: "/data/", label: "데이터 출처" },
  { href: "/contact/", label: "문의·오류 제보" },
  { href: "/privacy/", label: "개인정보처리방침" },
  { href: "/terms/", label: "이용약관" },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <nav aria-label="사이트 정보">
          <ul className="footer-links">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="muted small">
          {site.name}의 계산 결과는 모의 계산입니다. 실제 세금·보조금·과태료는 관할 기관의 고지와 심사로 정해집니다.
          정부 기관과 관계없는 개인 운영 사이트입니다.
        </p>
      </div>
    </footer>
  );
}
