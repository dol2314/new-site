import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { Prose } from "@/components/Prose";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/site.config";

export const metadata = pageMetadata({
  title: "이용약관",
  description: `${site.name} 이용 조건과 계산 결과의 성격을 설명합니다.`,
  path: "/terms/",
});

export default function TermsPage() {
  return (
    <Prose title="이용약관" updated="2026-11-01">
      <JsonLd data={breadcrumbJsonLd([{ name: "이용약관", path: "/terms/" }])} />

      <h2>1. 서비스의 성격</h2>
      <p>
        {site.name}는 자동차 관련 세금·보조금·과태료·할부·충전요금을 공개된 공식 기준으로 계산해 보여 주는 무료 정보
        서비스입니다. 모든 결과는 <strong>모의 계산</strong>입니다.
      </p>

      <h2>2. 결과의 이용</h2>
      <ul>
        <li>실제 세액, 보조금, 과태료, 금리는 관할 기관과 금융회사의 고지·심사로 정해집니다.</li>
        <li>결과를 근거로 한 결정(구매, 납부, 신청 등) 전에는 결과 아래에 연결한 공식 사이트에서 다시 확인하세요.</li>
        <li>기준이 바뀌었는데 아직 반영되지 않았을 수 있습니다. 각 결과의 기준일을 확인하세요.</li>
      </ul>

      <h2>3. 책임의 한계</h2>
      <p>
        사이트는 정확한 정보를 제공하려고 노력하지만, 계산 결과와 실제 금액의 차이로 생긴 손해에 대해서는 법령이 정한 경우를
        제외하고 책임을 지지 않습니다. 오류를 발견하면 <Link href="/contact/">문의·오류 제보</Link>로 알려 주세요.
      </p>

      <h2>4. 외부 링크와 광고</h2>
      <p>
        사이트에는 공식 기관 사이트로 가는 링크와 Google 애드센스 광고가 있습니다. 외부 사이트와 광고 내용은 각 운영자의
        책임입니다.
      </p>

      <h2>5. 저작권</h2>
      <p>
        사이트의 글, 표, 계산 방법 설명의 저작권은 운영자에게 있습니다. 출처를 밝히면 비상업적으로 인용할 수 있습니다. 법령과
        공공데이터는 각 출처의 이용 조건을 따릅니다.
      </p>

      <h2>6. 약관의 변경</h2>
      <p>약관을 바꾸면 이 페이지에 바뀐 내용과 날짜를 적습니다.</p>
    </Prose>
  );
}
