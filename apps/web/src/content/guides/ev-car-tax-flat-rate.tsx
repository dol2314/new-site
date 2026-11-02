/**
 * 사례 분석 6: 전기차 자동차세가 1년 13만원인 이유와, 배기량 차와 차령별 비교.
 * 세율·경감률은 확인된 데이터(car-tax), 배기량은 예시. 숫자는 calc-core로 빌드 때 계산한다.
 */
import {
  calcCarTax,
  calcOwnershipCost,
  formatWon,
  type CarTaxInput,
} from "@site/calc-core";
import { carTaxData, ownershipData } from "@site/data";
import Link from "next/link";
import { GuideLayout } from "@/components/GuideLayout";
import type { GuideMeta } from "@/lib/guides";
import { formatKoreanDate } from "@/lib/kst";

const Y = 2027;
const data = carTaxData(Y);
const own = ownershipData();
const t = data.tax;
const pct = (r: number) => `${Math.round(r * 100)}%`;

/** 차령 n년인 차의 Y년 연 자동차세(교육세 포함) — 기산일을 n년 전 3월로 둔다 */
const yearTax = (
  input: Omit<CarTaxInput, "ageStartDate" | "taxYear">,
  age: number,
) =>
  calcCarTax({ ...input, ageStartDate: `${Y - age + 1}-03-01`, taxYear: Y }, t);

const ev = yearTax({ fuelType: "electric" }, 1);
const ccs = [998, 1353, 1598, 1999, 2497, 3342];
const byCc = ccs.map((cc) => ({
  cc,
  r: yearTax({ fuelType: "gasoline", displacementCc: cc }, 1),
}));
const kei = byCc[0]!;

// 차령별: 1,353cc(소형, 예시)와 1,598cc
const AGES = [1, 3, 6, 9, 12, 15];
const byAge = AGES.map((age) => ({
  age,
  small: yearTax({ fuelType: "gasoline", displacementCc: 1353 }, age),
  mid: yearTax({ fuelType: "gasoline", displacementCc: 1598 }, age),
}));
const crossAge = (() => {
  for (let age = 1; age <= 20; age++) {
    if (
      yearTax({ fuelType: "gasoline", displacementCc: 1353 }, age).annualTotal <
      ev.annualTotal
    )
      return age;
  }
  return null;
})();
// 50% 경감 뒤에도 전기차보다 많이 내는 경계 배기량: cc × cc당 세액 × 50% > 정액
const midBracket = t.ccBrackets[1]!;
const maxRate =
  (t.ageReduction.maxAge - t.ageReduction.minAge) * t.ageReduction.perYearRate;
const neverBelowCc = Math.ceil(
  t.flatAnnualWon / (midBracket.wonPerCc * (1 - maxRate)),
);

// 10개 연도 합계 (2027-01-04 새 차 등록, 세금만)
const START = `${Y}-01-04`;
const ten = (fuelType: "electric" | "gasoline", cc?: number) =>
  calcOwnershipCost({
    start: START,
    years: 10,
    purchase: 0,
    fuelType,
    displacementCc: cc,
    carTaxParamsFor: (y) => own.carTaxByYear[Math.min(y, own.latestYear)]!,
    newRegistration: own.newRegistration,
    annualEnergy: 0,
    annualInsurance: 0,
  }).totals.carTax;
const tenEv = ten("electric");
const ten1598 = ten("gasoline", 1598);
const ten1999 = ten("gasoline", 1999);

const sources = data.sources.filter((s) =>
  [
    "values.flatAnnualWon",
    "values.ccBrackets",
    "values.educationTaxRate",
    "values.ageReduction",
  ].includes(s.key),
);

export default function Article({ meta }: { meta: GuideMeta }) {
  return (
    <GuideLayout
      meta={meta}
      summary={[
        <>
          전기차 자동차세는 배기량이 없어서 법에 정해진 정액{" "}
          {formatWon(t.flatAnnualWon)}에 지방교육세 {pct(t.educationTaxRate)}를
          더한 <strong>1년 {formatWon(ev.annualTotal)}</strong>입니다.
        </>,
        <>
          1,000cc 미만 경차({formatWon(kei.r.annualTotal)})보다는 많고,
          1,600cc급({formatWon(byCc[2]!.r.annualTotal)})의 절반이 안 됩니다.
          대신 오래 타도 줄지 않아, 1,353cc 휘발유차는 차령 {crossAge}년부터
          전기차보다 덜 냅니다(
          {formatKoreanDate(meta.asOf)} 현행 세율 기준).
        </>,
        <>
          전기차와 엔진 차를 놓고 고민 중이라면{" "}
          <Link href="/car-tax/">자동차세 계산기</Link>로 두 차의 세금을 하나씩
          뽑아 보세요.
        </>,
      ]}
      faq={[
        {
          q: "오래된 전기차도 13만원을 내나요?",
          a: `네. 배기량으로 세금을 매기는 차만 3년째부터 해마다 ${pct(t.ageReduction.perYearRate)}씩 줄어들고, 전기차 같은 정액 차는 차령 경감이 없습니다.`,
        },
        {
          q: "올해 새로 산 전기차도 1년치를 다 내나요?",
          a: "아닙니다. 새로 등록한 해에는 등록한 날부터 그 반기 말까지 날짜만큼만 내고, 다음 반기부터 정해진 금액을 냅니다.",
        },
        {
          q: "고지서 금액이 13만원과 다르면 왜 그런가요?",
          a: "지자체는 조례로 표준세율보다 높게 정할 수 있고, 지방교육세율도 조정할 수 있습니다. 연납을 했거나 해가 바뀌는 중간에 차를 사고팔았다면 그만큼 금액이 달라집니다.",
        },
      ]}
      sources={sources}
    >
      <section data-article-section="conditions">
        <h2>계산 조건</h2>
        <div className="table-wrap">
          <table>
            <tbody>
              <tr>
                <th scope="row">차</th>
                <td>개인이 쓰는 비영업용 승용차</td>
              </tr>
              <tr>
                <th scope="row">세율</th>
                <td>{Y}년 지방세법 표준세율(현행법 기준)</td>
              </tr>
              <tr>
                <th scope="row">금액</th>
                <td>자동차세 + 지방교육세, 1년치(6월분 + 12월분)</td>
              </tr>
              <tr>
                <th scope="row">배기량</th>
                <td>
                  {ccs.map((c) => c.toLocaleString("ko-KR")).join(", ")}cc —
                  흔한 배기량을 고른 예시
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="muted small">
          특정 차종의 고지액이 아니라 세율 구조를 보여 주기 위한 예시입니다.
        </p>
      </section>

      <section data-article-section="steps">
        <h2>단계별 계산</h2>
        <ol>
          <li>
            <strong>엔진 차:</strong> 배기량 × cc당 세액입니다. 1,000cc 이하{" "}
            {t.ccBrackets[0]!.wonPerCc}원, 1,600cc 이하 {midBracket.wonPerCc}원,
            그보다 크면 {t.ccBrackets[2]!.wonPerCc}원을 곱합니다.
          </li>
          <li>
            <strong>전기차:</strong> 지방세법은 전기·태양열·알코올로 움직이는
            승용차를 &quot;그 밖의 승용자동차&quot;로 묶어 배기량과 관계없이 1년{" "}
            {formatWon(t.flatAnnualWon)}을 매깁니다.
          </li>
          <li>
            <strong>지방교육세:</strong> 자동차세의 {pct(t.educationTaxRate)}가
            붙어 {formatWon(t.flatAnnualWon)} + {formatWon(ev.educationTax)} ={" "}
            <strong>{formatWon(ev.annualTotal)}</strong>입니다. 6월과 12월에
            절반씩 나옵니다.
          </li>
          <li>
            <strong>차령 경감:</strong> 배기량 차는 3년째부터 해마다{" "}
            {pct(t.ageReduction.perYearRate)}씩, 최대 {pct(maxRate)}까지
            줄어듭니다. 정액인 전기차에는 이 경감이 없습니다.
          </li>
        </ol>

        <h3>새 차 기준 1년 자동차세</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">차</th>
                <th scope="col">자동차세</th>
                <th scope="col">교육세 포함</th>
                <th scope="col">전기차와 차이</th>
              </tr>
            </thead>
            <tbody>
              <tr className="selected">
                <td>전기차</td>
                <td>{formatWon(ev.carTax)}</td>
                <td>{formatWon(ev.annualTotal)}</td>
                <td>—</td>
              </tr>
              {byCc.map(({ cc, r }) => (
                <tr key={cc}>
                  <td>{cc.toLocaleString("ko-KR")}cc</td>
                  <td>{formatWon(r.carTax)}</td>
                  <td>{formatWon(r.annualTotal)}</td>
                  <td>
                    {r.annualTotal >= ev.annualTotal ? "+" : "−"}
                    {formatWon(Math.abs(r.annualTotal - ev.annualTotal))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section data-article-section="variations">
        <h2>조건이 바뀌면</h2>

        <h3 data-variation>경차라면: 처음부터 전기차보다 덜 낸다</h3>
        <p>
          998cc 경차는 cc당 {t.ccBrackets[0]!.wonPerCc}원이라 1년{" "}
          {formatWon(kei.r.annualTotal)}입니다. 전기차보다{" "}
          {formatWon(ev.annualTotal - kei.r.annualTotal)} 적고, 3년째부터는
          경감으로 차이가 더 벌어집니다. 자동차세만 보면 전기차가 가장 싼 차는
          아닙니다.
        </p>

        <h3 data-variation>
          오래 탈수록: 소형차는 전기차보다 싸지고, 1,600cc급은 그대로 비싸다
        </h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">차령</th>
                <th scope="col">1,353cc</th>
                <th scope="col">1,598cc</th>
                <th scope="col">전기차</th>
              </tr>
            </thead>
            <tbody>
              {byAge.map((x) => (
                <tr key={x.age}>
                  <td>{x.age}년</td>
                  <td>{formatWon(x.small.annualTotal)}</td>
                  <td>{formatWon(x.mid.annualTotal)}</td>
                  <td>{formatWon(ev.annualTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          1,353cc 차는 차령 {crossAge}년부터 전기차보다 적게 냅니다. 반면 경감이
          최대 {pct(maxRate)}에서 멈추기 때문에 약{" "}
          {neverBelowCc.toLocaleString("ko-KR")}cc 이상 차는 아무리 오래 타도
          전기차보다 많이 냅니다.
        </p>

        <h3 data-variation>
          10년을 더하면: 1,600cc급과 약 {formatWon(ten1598 - tenEv)} 차이
        </h3>
        <p>
          {Y}년 1월 4일에 새 차를 등록해 {Y + 9}년까지 10개 연도 자동차세를
          더하면 전기차 {formatWon(tenEv)}, 1,598cc {formatWon(ten1598)},
          1,999cc {formatWon(ten1999)}입니다. 등록한 해는 날짜만큼만 셌고,{" "}
          {own.latestYear + 1}년 이후는 지금 세율이 그대로라고 가정했습니다.
        </p>
      </section>

      <section data-article-section="pitfalls">
        <h2>놓치기 쉬운 것</h2>
        <ol>
          <li>
            <strong>지역마다 다를 수 있습니다.</strong> 이 글은 법이 정한
            표준세율 기준입니다. 지자체가 조례로 세율을 높였다면 고지서 금액이
            더 많습니다.
          </li>
          <li>
            <strong>
              1년치가 10만원 이하라 6월에 한꺼번에 나올 수 있습니다.
            </strong>{" "}
            이때는 7~12월분의 일부를 빼 주지만, 1월에 직접 연납하는 쪽이 공제가
            더 큽니다. 자세한 계산은{" "}
            <Link href="/guides/car-tax-prepay-timing/">연납 사례</Link>에
            있습니다.
          </li>
          <li>
            <strong>법이 바뀌면 숫자도 바뀝니다.</strong> 전기차 정액은 지방세법
            조문에 적힌 금액이라, 법이 개정되면 이 글과 계산기를 고칩니다.
            해마다 연말에 다음 해 시행 개정이 있는지 확인합니다.
          </li>
        </ol>
      </section>
    </GuideLayout>
  );
}
