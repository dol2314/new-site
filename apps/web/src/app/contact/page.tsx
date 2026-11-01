import { JsonLd } from "@/components/JsonLd";
import { Prose } from "@/components/Prose";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { operatorConfigured, site } from "@/site.config";

export const metadata = pageMetadata({
  title: "문의·오류 제보",
  description: `${site.name}의 계산 오류 제보와 문의 방법입니다.`,
  path: "/contact/",
});

export default function ContactPage() {
  return (
    <Prose title="문의·오류 제보" updated="2026-11-01">
      <JsonLd data={breadcrumbJsonLd([{ name: "문의·오류 제보", path: "/contact/" }])} />
      {operatorConfigured ? (
        <p className="lead">
          이메일: <a href={`mailto:${site.operator.email}`}>{site.operator.email}</a>
        </p>
      ) : (
        <p className="notice">연락처는 사이트 공개 전에 등록합니다.</p>
      )}

      <h2>오류를 제보할 때 적어 주세요</h2>
      <ul>
        <li>어느 계산기에서, 어떤 값을 넣었을 때인지</li>
        <li>사이트가 보여 준 결과와, 맞다고 생각하는 결과</li>
        <li>근거가 있다면 고지서·공문·법령 조문 등 출처</li>
      </ul>
      <p className="muted">
        개인정보(이름, 주민등록번호, 차량번호, 주소)는 보내지 마세요. 계산 확인에는 필요하지 않습니다.
      </p>

      <h2>답변과 수정</h2>
      <p>
        제보 내용은 공식 출처와 대조해 확인합니다. 오류가 맞으면 계산기를 고치고, 고친 날짜와 내용을 데이터 출처 페이지의 갱신
        기록에 남깁니다. 개별 세금·보조금 상담은 관할 기관에 문의해 주세요.
      </p>
    </Prose>
  );
}
