import { calcCarTax, calcPrepay, formatWon } from "@site/calc-core";
import { CAR_TAX_YEARS, carTaxData } from "@site/data";
import { ToolPage, type Example } from "@/components/tool/ToolPage";
import { SourcesList } from "@/components/tool/SourcesList";
import { LINKS } from "@/lib/links";
import { pageMetadata } from "@/lib/seo";
import { toolById } from "@/lib/tools";
import { CarTaxCalculator, type YearData } from "./CarTaxCalculator";

const tool = toolById("car-tax");
const all = CAR_TAX_YEARS.map(carTaxData);
const ready = all.filter((d) => d.missing.length === 0);
const latest = ready[ready.length - 1] ?? all[all.length - 1]!;

export const metadata = pageMetadata({
  title: "자동차세·연납 계산기",
  description: "배기량과 최초 등록일로 6월·12월 자동차세와 1·3·6·9월 연납 때 아끼는 금액을 지방세법 기준으로 계산합니다.",
  path: tool.path,
  noindex: !tool.published,
});

// 사례: 숫자는 모두 엔진으로 계산한다(손으로 쓰지 않는다)
const Y = latest.year;
const ex1 = calcCarTax({ fuelType: "gasoline", displacementCc: 1999, ageStartDate: `${Y - 1}-03-02`, taxYear: Y }, latest.tax);
const ex1Jan = calcPrepay(ex1, 1, Y, latest.prepay);
const ex2 = calcCarTax({ fuelType: "gasoline", displacementCc: 1598, ageStartDate: `${Y - 7}-05-20`, taxYear: Y }, latest.tax);
const ex2Mar = calcPrepay(ex2, 3, Y, latest.prepay);
const ex3 = calcCarTax({ fuelType: "electric", ageStartDate: `${Y - 2}-09-01`, taxYear: Y }, latest.tax);
const ex3Jun = calcPrepay(ex3, 6, Y, latest.prepay);

const examples: Example[] = [
  {
    title: `1999cc 휘발유차, ${Y - 1}년 3월 등록 — 1월에 연납하면`,
    body: (
      <p>
        {Y}년 차령은 {ex1.halves[0].carAge}년이라 경감이 없습니다. 고지대로 내면 6월·12월 각 {formatWon(ex1.halves[0].total)}, 1년{" "}
        {formatWon(ex1.annualTotal)}입니다. 1월 16~31일에 연납하면 {formatWon(ex1Jan.payTotal)}만 내서 <strong>{formatWon(ex1Jan.saving)}</strong>
        을 아낍니다.
      </p>
    ),
  },
  {
    title: `1598cc 휘발유차, ${Y - 7}년 5월 등록 — 차령 경감`,
    body: (
      <p>
        차령 {ex2.halves[0].carAge}년이라 기분마다 {Math.round(ex2.halves[0].reductionRate * 100)}%가 깎입니다. 1년 {formatWon(ex2.annualTotal)}이고,
        3월에 연납하면 {formatWon(ex2Mar.saving)}을 아낍니다.
      </p>
    ),
  },
  {
    title: "전기차 — 배기량과 관계없이 정액",
    body: (
      <p>
        전기차는 자동차세 {formatWon(ex3.carTax)}에 지방교육세 {formatWon(ex3.educationTax)}, 1년 {formatWon(ex3.annualTotal)}입니다. 오래돼도 차령
        경감은 없습니다. 연세액이 10만원 이하라 지자체가 6월에 1년치를 한꺼번에 고지할 수 있고, 이때 {formatWon(ex3Jun.saving)}이 줄어
        {formatWon(ex3Jun.payTotal)}을 냅니다.
      </p>
    ),
  },
];

const ages = Array.from({ length: 11 }, (_, i) => i + 2);

export default function CarTaxPage() {
  const years: YearData[] = ready.map((d) => ({ year: d.year, tax: d.tax, prepay: d.prepay, smallTaxThresholdWon: d.smallTaxThresholdWon }));
  const brackets = latest.tax.ccBrackets;
  return (
    <ToolPage
      tool={tool}
      summary={[
        `${Y}년 비영업용 승용차 자동차세는 배기량 1cc당 1,000cc 이하 ${brackets[0]?.wonPerCc}원, 1,600cc 이하 ${brackets[1]?.wonPerCc}원, 그 초과 ${brackets[2]?.wonPerCc}원이고, 지방교육세 ${Math.round(latest.tax.educationTaxRate * 100)}%가 붙습니다.`,
        `차령 3년부터 해마다 ${Math.round(latest.tax.ageReduction.perYearRate * 100)}%씩, 최대 ${Math.round(latest.tax.ageReduction.perYearRate * (latest.tax.ageReduction.maxAge - latest.tax.ageReduction.minAge) * 100)}%까지 줄어듭니다. 전기차는 1년 ${formatWon(latest.tax.flatAnnualWon)}(교육세 별도) 정액입니다.`,
        `1월 16~31일에 1년치를 미리 내면 남은 기간 이자율 ${Math.round(latest.prepay.rate * 100)}%만큼 공제받아, 평년 기준 연 자동차세의 약 ${((334 / 365) * latest.prepay.rate * 100).toFixed(1)}%를 아낍니다.`,
      ]}
      calculator={<CarTaxCalculator years={years} pendingFuels={latest.pendingFuels} />}
      examples={examples}
      method={
        <>
          <ol>
            <li>연세액 A = 배기량 × cc당 세액. 전기 등 그 밖의 승용차는 정액.</li>
            <li>1~6월분(6월 납기)과 7~12월분(12월 납기)을 A/2씩 나눕니다.</li>
            <li>차령 n이 3년 이상이면 기분마다 A/2 − (A/2 × 5%)(n − 2), n은 12년까지만. 차령은 기분마다 따로 셉니다.</li>
            <li>지방교육세 = 자동차세 × 30%. 10원 미만은 버립니다.</li>
            <li>연납 공제: 1·3월은 연세액 × 남은 일수/365(윤년 366) × 5%, 6월은 7~12월분 × 5%, 9월은 7~12월분 × 남은 일수/184 × 5%.</li>
          </ol>
          <SourcesList sources={latest.sources} />
        </>
      }
      table={
        <>
          <h3>배기량별 세액 (비영업용 승용)</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">배기량</th>
                  <th scope="col">cc당 세액</th>
                </tr>
              </thead>
              <tbody>
                {brackets.map((b, i) => (
                  <tr key={i}>
                    <td>{b.maxCc === null ? `${brackets[i - 1]?.maxCc?.toLocaleString("ko-KR")}cc 초과` : `${b.maxCc.toLocaleString("ko-KR")}cc 이하`}</td>
                    <td>{b.wonPerCc}원</td>
                  </tr>
                ))}
                <tr>
                  <td>전기 등 그 밖의 승용</td>
                  <td>연 {formatWon(latest.tax.flatAnnualWon)} 정액</td>
                </tr>
              </tbody>
            </table>
          </div>
          <h3>차령별 경감률 (기분마다 적용)</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">차령</th>
                  {ages.map((a) => (
                    <th key={a} scope="col">
                      {a === 12 ? "12년+" : `${a}년`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>경감</td>
                  {ages.map((a) => (
                    <td key={a}>{Math.round(Math.max(0, Math.min(a, 12) - 2) * 5)}%</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <h3>연납 신고납부 기간</h3>
          <ul>
            <li>1월 16~31일 · 3월 16~31일: 연세액 × 남은 일수 비율 × 5% 공제</li>
            <li>6월 16~30일: 7~12월분 × 5% 공제</li>
            <li>9월 16~30일: 7~12월분 × 남은 일수/184 × 5% 공제</li>
          </ul>
        </>
      }
      faq={[
        { q: "자동차세는 언제 나오나요?", a: "1~6월분은 6월 16~30일, 7~12월분은 12월 16~31일이 납기입니다. 신청하면 각 기분의 절반을 3월·9월에 나눠 낼 수도 있습니다." },
        { q: "1월에 연납하면 얼마나 아끼나요?", a: `2월 1일부터 12월 31일까지 334일(윤년 335일)에 해당하는 세액에 이자율 ${Math.round(latest.prepay.rate * 100)}%를 곱한 만큼 공제됩니다. 평년이면 연 자동차세의 약 4.6%입니다. 지방교육세도 공제 후 금액 기준이라 함께 줄어듭니다.` },
        { q: "오래된 차는 자동차세가 줄어드나요?", a: "배기량으로 세금을 매기는 승용차는 차령 3년부터 해마다 5%씩 줄고, 12년 이상이면 50%에서 멈춥니다. 전기차처럼 정액인 차는 줄지 않습니다." },
        { q: "차령은 어떻게 세나요?", a: "최초 등록일(만들어진 해에 등록하지 않았다면 제작연도 12월 31일)이 1~6월이면 '과세연도 − 등록연도 + 1'입니다. 7~12월이면 1~6월분은 1년 적게, 7~12월분은 같은 식으로 셉니다." },
        { q: "전기차 자동차세는 얼마인가요?", a: `자동차세 연 ${formatWon(latest.tax.flatAnnualWon)}에 지방교육세 30%를 더해 ${formatWon(ex3.annualTotal)}입니다. 연세액이 10만원 이하라 6월에 1년치를 한꺼번에 고지받을 수 있습니다.` },
        { q: "사는 지역마다 다른가요?", a: "법에서 정한 표준세율로 계산했습니다. 지자체는 조례로 자동차세 세율을 표준세율의 50%까지 높이거나 지방교육세율을 50% 범위에서 조정할 수 있으니, 고지서 금액이 다르면 관할 지자체에 확인하세요." },
      ]}
      next={{ tools: [toolById("inspection")], links: [LINKS.wetax, LINKS.lawCarTax, LINKS.lawPrepay] }}
      checkedAt={latest.sources[0]?.checked_at ?? "2026-11-01"}
    />
  );
}
