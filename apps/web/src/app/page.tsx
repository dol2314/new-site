import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { pageMetadata, siteJsonLd } from "@/lib/seo";
import { TOOLS, type Tool } from "@/lib/tools";
import { site } from "@/site.config";

export const metadata = pageMetadata({
  title: `${site.name} — 자동차 세금·검사·보조금·할부 계산`,
  description: site.description,
  path: "/",
});

const GROUPS: { stage: Tool["stage"]; title: string; lead: string }[] = [
  { stage: "before-buy", title: "차 사기 전", lead: "보조금을 빼고, 세금을 더하면 실제로 얼마인지 계산합니다." },
  { stage: "after-buy", title: "차 산 뒤", lead: "놓치면 돈이 나가는 세금·검사 날짜와 금액을 확인합니다." },
];

export default function HomePage() {
  // 공개 전(검색 노출 꺼짐)에는 준비 중인 도구 이름도 보여 주고, 공개 후에는 공개된 도구만 보여 준다.
  const visible = TOOLS.filter((t) => t.published || !site.indexable);
  return (
    <div className="container">
      <JsonLd data={siteJsonLd()} />
      <h1>{site.name}</h1>
      <p className="lead">
        자동차세, 검사 기간과 과태료, 전기차 보조금, 취등록세, 할부, 충전요금을 <strong>공식 기준과 기준일</strong>을 붙여
        계산합니다. 입력한 값은 내 기기 밖으로 보내지 않습니다.
      </p>

      {GROUPS.map((g) => {
        const tools = visible.filter((t) => t.stage === g.stage);
        if (tools.length === 0) return null;
        return (
          <section key={g.stage} aria-labelledby={`group-${g.stage}`}>
            <h2 id={`group-${g.stage}`}>{g.title}</h2>
            <p className="muted">{g.lead}</p>
            <ul className="card-grid">
              {tools.map((t) => (
                <li key={t.id}>
                  {t.published ? (
                    <Link href={t.path} className="card">
                      <strong>{t.title}</strong>
                      <span className="muted small">{t.summary}</span>
                    </Link>
                  ) : (
                    <div className="card" aria-disabled="true">
                      <strong>{t.title}</strong>
                      <span className="muted small">{t.summary} (공개 전)</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <h2>이 사이트의 계산 원칙</h2>
      <ul>
        <li>세율·보조금·과태료는 법령과 정부 공지에서 확인한 값만 쓰고, 값마다 출처와 기준일을 적습니다.</li>
        <li>계산 방법(산식과 가정값)을 결과 아래에 모두 공개합니다.</li>
        <li>확인하지 못한 값이 필요한 계산기는 공개하지 않습니다.</li>
      </ul>
      <p>
        자세한 내용은 <Link href="/about/">소개</Link>와 <Link href="/data/">데이터 출처</Link>에 있습니다.
      </p>
    </div>
  );
}
