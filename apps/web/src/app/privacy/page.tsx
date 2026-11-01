import { JsonLd } from "@/components/JsonLd";
import { Prose } from "@/components/Prose";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { operatorConfigured, site } from "@/site.config";

export const metadata = pageMetadata({
  title: "개인정보처리방침",
  description: `${site.name}가 어떤 정보를 처리하는지, 광고·통계 쿠키를 어떻게 쓰는지 설명합니다.`,
  path: "/privacy/",
});

export default function PrivacyPage() {
  return (
    <Prose title="개인정보처리방침" updated="2026-11-01">
      <JsonLd data={breadcrumbJsonLd([{ name: "개인정보처리방침", path: "/privacy/" }])} />
      <p>
        {site.name}(이하 &quot;사이트&quot;)는 이용자의 개인정보를 소중히 다루며, 필요한 최소한의 정보만 처리합니다.
      </p>

      <h2>1. 계산기에 입력한 값</h2>
      <p>
        계산기에 입력한 값(배기량, 차량 가격, 주행거리, 지역 등)은 이용자의 브라우저 안에서만 계산에 쓰이며, 사이트 서버나
        제3자에게 보내지 않습니다. 차량번호는 입력받지 않습니다.
      </p>

      <h2>2. 직접 받는 정보</h2>
      <p>
        회원가입이 없으며, 이용자가 이메일로 문의하는 경우에만 이메일 주소와 문의 내용을 받습니다. 이 정보는 답변과 오류 수정에만
        쓰고, 답변을 마친 날부터 1년 뒤 삭제합니다. 법령에 따라 보관해야 하는 경우는 그 기간 동안 보관합니다.
      </p>

      <h2>3. 자동으로 수집되는 정보 (쿠키 등)</h2>
      <p>사이트는 아래 서비스를 쓰며, 이 서비스들은 쿠키 등을 이용해 방문 정보를 수집할 수 있습니다.</p>
      <ul>
        <li>
          <strong>Google Analytics 4</strong>: 방문 페이지, 이용 기기·브라우저 종류, 대략적인 지역 같은 이용 통계. 사이트
          개선에만 씁니다. 계산기 입력값은 보내지 않고, 어떤 계산기를 썼는지와 결과의 대략적인 구간만 기록합니다.
        </li>
        <li>
          <strong>Google 애드센스</strong>: 광고 게재와 측정. Google을 포함한 제3자 광고 사업자는 쿠키를 사용하여 이용자의 이
          사이트 및 다른 사이트 방문 기록을 바탕으로 광고를 게재할 수 있습니다.
        </li>
      </ul>
      <p>
        Google이 이 정보를 어떻게 쓰는지는{" "}
        <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">
          Google 파트너 사이트 이용 시 데이터 사용 방식
        </a>
        에서 볼 수 있습니다. 이 정보는 Google의 국외 서버에서 처리될 수 있습니다.
      </p>

      <h2>4. 쿠키를 거부하거나 맞춤 광고를 끄는 방법</h2>
      <ul>
        <li>브라우저 설정에서 쿠키 저장을 거부하거나 삭제할 수 있습니다. 거부해도 계산기는 쓸 수 있습니다.</li>
        <li>
          <a href="https://myadcenter.google.com/" rel="noopener">
            Google 내 광고 센터
          </a>
          에서 맞춤 광고를 끌 수 있습니다.
        </li>
        <li>
          <a href="https://tools.google.com/dlpage/gaoptout" rel="noopener">
            Google 애널리틱스 차단 브라우저 부가기능
          </a>
          으로 통계 수집을 막을 수 있습니다.
        </li>
      </ul>

      <h2>5. 개인정보 보호책임자</h2>
      {operatorConfigured ? (
        <p>
          {site.operator.name} · <a href={`mailto:${site.operator.email}`}>{site.operator.email}</a>
        </p>
      ) : (
        <p className="notice">보호책임자 정보는 사이트 공개 전에 등록합니다.</p>
      )}
      <p>
        개인정보 침해 신고·상담은 개인정보침해신고센터(국번 없이 118,{" "}
        <a href="https://privacy.kisa.or.kr/" rel="noopener">
          privacy.kisa.or.kr
        </a>
        )에도 할 수 있습니다.
      </p>

      <h2>6. 방침의 변경</h2>
      <p>이 방침을 바꾸면 이 페이지에 바뀐 내용과 날짜를 적습니다.</p>
    </Prose>
  );
}
