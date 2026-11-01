import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { Prose } from "@/components/Prose";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { operatorConfigured, site } from "@/site.config";

export const metadata = pageMetadata({
  title: "소개",
  description: `${site.name}가 무엇을 계산하고, 어떤 기준으로 숫자를 확인하는지 설명합니다.`,
  path: "/about/",
});

export default function AboutPage() {
  return (
    <Prose title={`${site.name} 소개`} updated="2026-11-01">
      <JsonLd data={breadcrumbJsonLd([{ name: "소개", path: "/about/" }])} />
      <p className="lead">
        차를 사기 전과 산 뒤에 드는 돈을 계산하는 사이트입니다. 자동차세와 연납, 자동차 검사 기간과 과태료, 전기차 보조금,
        취등록세, 할부, 충전요금을 다룹니다.
      </p>

      <h2>숫자를 다루는 원칙</h2>
      <ol>
        <li>
          <strong>공식 출처만 씁니다.</strong> 세율·보조금·과태료는 법령(국가법령정보센터)과 정부·공공기관 공지에서 확인한
          값만 씁니다. 블로그나 뉴스의 숫자는 근거로 쓰지 않습니다.
        </li>
        <li>
          <strong>값마다 기준일을 붙입니다.</strong> 같은 항목도 해마다 바뀌므로, 언제 기준인지와 언제 확인했는지를 함께
          적습니다.
        </li>
        <li>
          <strong>계산 방법을 공개합니다.</strong> 산식, 가정값, 반올림 규칙을 결과 아래에 적어 누구나 다시 계산해 볼 수 있게
          합니다.
        </li>
        <li>
          <strong>확인하지 못한 값은 쓰지 않습니다.</strong> 공식 발표 전이거나 확인이 안 된 값이 필요한 계산기는 공개하지
          않거나, 이전 기준임을 분명히 표시합니다.
        </li>
        <li>
          <strong>입력값을 보내지 않습니다.</strong> 계산은 모두 내 브라우저 안에서 합니다. 차량번호는 입력받지 않습니다.
        </li>
      </ol>

      <h2>이 사이트가 아닌 것</h2>
      <p>
        정부 기관이나 금융회사가 운영하는 사이트가 아닙니다. 결과는 모의 계산이며, 실제 세금·보조금·과태료는 관할 기관의
        고지와 심사로 정해집니다. 신청과 납부는 결과 아래에 연결한 공식 사이트에서 하세요.
      </p>

      <h2>운영자</h2>
      {operatorConfigured ? (
        <p>
          {site.operator.name}가 운영합니다. 문의와 오류 제보는{" "}
          <a href={`mailto:${site.operator.email}`}>{site.operator.email}</a>로 보내 주세요.
        </p>
      ) : (
        <p className="notice">운영자 정보는 사이트 공개 전에 등록합니다.</p>
      )}

      <h2>틀린 숫자를 발견하면</h2>
      <p>
        <Link href="/contact/">문의·오류 제보</Link>로 알려 주세요. 공식 근거와 함께 확인한 뒤 고치고, 고친 내용은{" "}
        <Link href="/data/">데이터 출처</Link>의 갱신 기록에 남깁니다.
      </p>
    </Prose>
  );
}
