import { calcRegistrationTax, formatWon, type RegistrationTaxInput } from "@site/calc-core";
import { registrationTaxData } from "@site/data";
import { SourcesList } from "@/components/tool/SourcesList";
import { ToolPage, type Example } from "@/components/tool/ToolPage";
import { formatKoreanDate } from "@/lib/kst";
import { LINKS } from "@/lib/links";
import { pageMetadata } from "@/lib/seo";
import { toolById } from "@/lib/tools";
import { RegistrationTaxCalculator } from "./RegistrationTaxCalculator";

const tool = toolById("registration-tax");
const { params: p, sources } = registrationTaxData();

export const metadata = pageMetadata({
  title: "자동차 취등록세 계산기",
  description: "차량 가격으로 자동차 취득세(승용 7%, 경차 4%)와 전기차·경차·다자녀 감면을 지방세법·지방세특례제한법 기준으로 계산합니다.",
  path: tool.path,
  noindex: !tool.published,
});

// 사례는 엔진으로 계산
const B: RegistrationTaxInput = { price: 0, vatIncluded: true, compact: false, powertrain: "ice", seats7to10: false, childrenUnder18: 0, acquiredOn: "2026-12-15" };
const e1 = calcRegistrationTax({ ...B, price: 25_000_000 }, p);
const e2a = calcRegistrationTax({ ...B, price: 45_000_000, powertrain: "electric" }, p);
const e2b = calcRegistrationTax({ ...B, price: 45_000_000, powertrain: "electric", acquiredOn: "2027-01-04" }, p);
const e3 = calcRegistrationTax({ ...B, price: 40_000_000, seats7to10: true, childrenUnder18: 3 }, p);
const pct = (r: number) => `${Math.round(r * 1000) / 10}%`;

const examples: Example[] = [
  {
    title: "부가세 포함 2,500만원 승용차",
    body: (
      <p>
        부가세를 빼면 {formatWon(e1.base)}이고, 여기에 {pct(p.rates.passenger)}를 곱해 취득세는 <strong>{formatWon(e1.payable)}</strong>입니다.
      </p>
    ),
  },
  {
    title: "4,500만원 전기차 — 2026년 12월과 2027년 1월 취득 비교",
    body: (
      <p>
        산출 취득세 {formatWon(e2a.computedTax)}에서 {formatWon(p.evRelief.capWon)}을 빼 {formatWon(e2a.payable)}입니다. 현행법상 전기차 감면은{" "}
        {formatKoreanDate(p.evRelief.until)}까지라, 2027년 1월에 인도받으면 {formatWon(e2b.payable)}으로 {formatWon(e2b.payable - e2a.payable)} 더
        냅니다.
      </p>
    ),
  },
  {
    title: "자녀 3명, 4,000만원 7인승",
    body: (
      <p>
        7~10인승은 면제 대상이지만, 산출 취득세 {formatWon(e3.computedTax)}가 {formatWon(p.minimumTax.exemptOverWon)}을 넘어{" "}
        {Math.round(p.minimumTax.reliefRate * 100)}%만 감면됩니다. 그래서 {formatWon(e3.payable)}을 냅니다.
      </p>
    ),
  },
];

export default function RegistrationTaxPage() {
  return (
    <ToolPage
      tool={tool}
      summary={[
        `개인이 사는 비영업용 승용차 취득세는 부가세를 뺀 차값의 ${pct(p.rates.passenger)}, 경형 자동차는 ${pct(p.rates.compact)}입니다.`,
        `전기차는 ${formatWon(p.evRelief.capWon)}까지, 경형 자동차는 ${formatWon(p.compactRelief.capWon)}까지 취득세를 감면받습니다. 전기차 감면은 현행법상 ${formatKoreanDate(p.evRelief.until)}에 끝납니다.`,
        "자동차 취득세에는 지방교육세와 농어촌특별세가 붙지 않습니다. 공채 매입 비용은 지역마다 따로 듭니다.",
      ]}
      calculator={<RegistrationTaxCalculator params={p} />}
      examples={examples}
      method={
        <>
          <ol>
            <li>과세표준 = 실제로 낸 차값(부가세 제외, 할인 반영, 할부 이자 제외). 중고차는 거래 가격이 시가표준액보다 낮으면 시가표준액.</li>
            <li>취득세 = 과세표준 × 세율(승용 7%, 경형 4%), 10원 미만 버림. 50만원 이하는 0원.</li>
            <li>감면은 취득일에 유효한 것만, 여러 개면 감면액이 가장 큰 것 하나만 적용합니다.</li>
            <li>면제 대상이라도 산출 취득세가 200만원을 넘으면 85%만 감면됩니다(전기·수소차 감면은 예외).</li>
          </ol>
          <SourcesList sources={sources} />
        </>
      }
      table={
        <>
          <h3>세율</h3>
          <div className="table-wrap">
            <table>
              <tbody>
                <tr>
                  <th scope="row">비영업용 승용</th>
                  <td>{pct(p.rates.passenger)}</td>
                </tr>
                <tr>
                  <th scope="row">경형 승용</th>
                  <td>{pct(p.rates.compact)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <h3>감면 (현행법)</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">대상</th>
                  <th scope="col">감면</th>
                  <th scope="col">취득 기한</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>전기자동차</td>
                  <td>{formatWon(p.evRelief.capWon)}까지</td>
                  <td>{formatKoreanDate(p.evRelief.until)}</td>
                </tr>
                <tr>
                  <td>수소전기자동차</td>
                  <td>{formatWon(p.hydrogenRelief.capWon)}까지</td>
                  <td>{formatKoreanDate(p.hydrogenRelief.until)}</td>
                </tr>
                <tr>
                  <td>경형 자동차</td>
                  <td>{formatWon(p.compactRelief.capWon)}까지</td>
                  <td>{formatKoreanDate(p.compactRelief.until)}</td>
                </tr>
                <tr>
                  <td>자녀 3명 이상</td>
                  <td>7~10인승 면제, 그 밖의 승용 {formatWon(p.multiChild.threePlus.otherPassengerCapWon)}까지</td>
                  <td>{formatKoreanDate(p.multiChild.until)}</td>
                </tr>
                <tr>
                  <td>자녀 2명</td>
                  <td>
                    7~10인승 50%, 그 밖의 승용 50%(취득세 {formatWon(p.multiChild.two.otherPassengerThresholdWon)} 초과면 {formatWon(p.multiChild.two.otherPassengerFixedWon)})
                  </td>
                  <td>{formatKoreanDate(p.multiChild.until)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      }
      faq={[
        { q: "취득세는 부가세 포함 가격으로 계산하나요?", a: "아닙니다. 부가가치세를 뺀 금액이 기준입니다. 할인을 받았다면 할인된 금액, 개인은 할부 이자도 빼고 계산합니다." },
        { q: "자동차 취득세에 지방교육세도 붙나요?", a: "붙지 않습니다. 지방교육세는 부동산·선박·항공기 등 취득에만 붙고 자동차 취득은 빠져 있습니다. 감면을 받아도 농어촌특별세가 붙지 않습니다." },
        { q: "전기차 취득세 감면은 언제까지인가요?", a: `현행 지방세특례제한법상 ${formatKoreanDate(p.evRelief.until)}까지 취득한 전기차입니다. 연말에 법이 개정되면 반영하겠습니다.` },
        { q: "중고차는 어떻게 계산하나요?", a: "실제 거래 가격이 기준이지만, 그 가격이 시가표준액보다 낮으면 시가표준액으로 계산합니다. 세율과 감면은 새 차와 같습니다." },
        { q: "경차는 얼마나 감면되나요?", a: `세율이 ${pct(p.rates.compact)}로 낮고, 그 취득세가 ${formatWon(p.compactRelief.capWon)} 이하면 면제, 넘으면 ${formatWon(p.compactRelief.capWon)}을 뺍니다. 1년 안에 영업용으로 쓰면 감면액을 다시 냅니다.` },
        { q: "감면이 여러 개 해당하면 다 받나요?", a: "같은 취득세에는 감면액이 가장 큰 것 하나만 적용됩니다." },
      ]}
      next={{ tools: [toolById("ev-subsidy"), toolById("car-tax")], links: [LINKS.wetax, LINKS.lawAcquisition, LINKS.lawSpecial] }}
      checkedAt={sources[0]?.checked_at ?? "2026-11-01"}
    />
  );
}
