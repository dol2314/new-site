/**
 * 사례 분석 2: 자동차세 연납 — 1·3·6·9월 신청 시기별 공제 비교(2027년).
 * 숫자는 모두 calc-core + 확인된 데이터로 빌드 때 계산한다(손으로 쓰지 않는다).
 */
import {
  calcCarTax,
  calcPrepay,
  formatWon,
  type CarTaxInput,
} from "@site/calc-core";
import { carTaxData } from "@site/data";
import Link from "next/link";
import { GuideLayout } from "@/components/GuideLayout";
import type { GuideMeta } from "@/lib/guides";
import { formatKoreanDate } from "@/lib/kst";

const Y = 2027;
const data = carTaxData(Y);
const MONTHS = [1, 3, 6, 9] as const;
const pct = (r: number, digits = 1) => `${(r * 100).toFixed(digits)}%`;

// 기본 조건(가정): 1,999cc 휘발유 승용차, 2025년 3월 최초 등록, 개인 비영업용
const base: CarTaxInput = {
  fuelType: "gasoline",
  displacementCc: 1999,
  ageStartDate: "2025-03-10",
  taxYear: Y,
};
const tax = calcCarTax(base, data.tax);
const byMonth = MONTHS.map((m) => calcPrepay(tax, m, Y, data.prepay));
const [jan, mar, jun, sep] = byMonth as [
  (typeof byMonth)[0],
  (typeof byMonth)[0],
  (typeof byMonth)[0],
  (typeof byMonth)[0],
];
const half = tax.halves[0];
const wonPerCc = data.tax.ccBrackets.find(
  (b) => b.maxCc === null || base.displacementCc! <= b.maxCc,
)!.wonPerCc;

const howTo: Record<number, string> = {
  1: "연세액 × 남은 일수/365 × 5%",
  3: "연세액 × 남은 일수/365 × 5%",
  6: "7~12월분 × 5%",
  9: "7~12월분 × 남은 일수/184 × 5%",
};

// 변형 1: 배기량별 (같은 2025년 3월 등록)
const ccs = [998, 1598, 1999, 2497, 3342];
const byCc = ccs.map((cc) => {
  const t = calcCarTax({ ...base, displacementCc: cc }, data.tax);
  const j = calcPrepay(t, 1, Y, data.prepay);
  const m = calcPrepay(t, 3, Y, data.prepay);
  return { cc, t, j, m, small: t.carTax <= data.smallTaxThresholdWon };
});
const smallRow = byCc.find((r) => r.small);

// 변형 2: 오래된 차 (2014년 등록, 차령 경감 최대)
const old = calcCarTax({ ...base, ageStartDate: "2014-05-10" }, data.tax);
const oldJan = calcPrepay(old, 1, Y, data.prepay);

// 변형 3: 전기차 (정액, 연세액 10만원 이하)
const ev = calcCarTax(
  { fuelType: "electric", ageStartDate: "2025-03-10", taxYear: Y },
  data.tax,
);
const evJan = calcPrepay(ev, 1, Y, data.prepay);
const evJun = calcPrepay(ev, 6, Y, data.prepay);

const sourceKeys = [
  "values.ccBrackets",
  "values.ageReduction",
  "values.educationTaxRate",
  "values.prepayRate",
  "values.prepayPeriods",
  "values.smallTaxRule",
  "rules.prepayDiscount",
  "rules.installment",
  "rules.prepayNotice",
  "rules.prepayMove",
  "rules.prepayTransfer",
];
const sources = data.sources.filter((s) => sourceKeys.includes(s.key));

export default function Article({ meta }: { meta: GuideMeta }) {
  return (
    <GuideLayout
      meta={meta}
      summary={[
        <>
          2025년 3월에 등록한 1,999cc 휘발유차는 {Y}년 자동차세와 지방교육세가
          1년 {formatWon(tax.annualTotal)}입니다. 1월에 연납하면{" "}
          <strong>{formatWon(jan.saving)}</strong>, 3월에 하면{" "}
          {formatWon(mar.saving)}을 아낍니다.
        </>,
        <>
          공제는 &quot;남은 기간 세금 × 5%&quot;라서 일찍 낼수록 큽니다. 6월
          연납은 {formatWon(jun.saving)}, 9월은 {formatWon(sep.saving)}으로
          줄어듭니다({formatKoreanDate(meta.asOf)} 현행법 기준).
        </>,
        <>
          내 차는 <Link href="/car-tax/">자동차세·연납 계산기</Link>에서
          배기량과 최초 등록일만 넣으면 달마다 비교할 수 있습니다.
        </>,
      ]}
      faq={[
        {
          q: "1월 연납 기간을 놓치면 끝인가요?",
          a: `아닙니다. 3월 16~31일, 6월 16~30일, 9월 16~30일에도 연세액을 한꺼번에 신고납부할 수 있습니다. 다만 늦을수록 공제가 줄어, 이 글의 차라면 3월 ${formatWon(mar.saving)}, 6월 ${formatWon(jun.saving)}, 9월 ${formatWon(sep.saving)}입니다.`,
        },
        {
          q: "공제율 5%면 1년 세금의 5%가 줄어드나요?",
          a: `아닙니다. 5%는 낸 날 이후 남은 기간에 해당하는 세금에만 곱합니다. 1월 연납은 2월 1일부터 12월 31일까지 ${jan.coveredDays}일분이라, 평년이면 연 자동차세의 약 ${pct(jan.carTaxDiscount / tax.carTax)}가 줄어듭니다.`,
        },
        {
          q: "지방교육세도 줄어드나요?",
          a: `네. 지방교육세는 공제한 뒤의 자동차세에 ${Math.round(data.tax.educationTaxRate * 100)}%를 곱하므로 함께 줄어듭니다. 이 글의 금액은 지방교육세까지 더한 것입니다.`,
        },
      ]}
      sources={sources}
    >
      <section data-article-section="conditions">
        <h2>계산 조건 (가정)</h2>
        <div className="table-wrap">
          <table>
            <tbody>
              <tr>
                <th scope="row">차</th>
                <td>휘발유 승용차 1,999cc, 개인이 비영업용으로 사용</td>
              </tr>
              <tr>
                <th scope="row">최초 등록</th>
                <td>
                  {formatKoreanDate(base.ageStartDate)} ({Y}년 차령{" "}
                  {half.carAge}년)
                </td>
              </tr>
              <tr>
                <th scope="row">과세연도</th>
                <td>{Y}년 (평년, 365일)</td>
              </tr>
              <tr>
                <th scope="row">세율</th>
                <td>법에서 정한 표준세율 (지자체 조례로 다를 수 있음)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="muted small">
          특정 차종의 실제 고지액이 아니라 계산을 보여 주기 위한 예시입니다.
        </p>
      </section>

      <section data-article-section="steps">
        <h2>단계별 계산</h2>
        <ol>
          <li>
            <strong>1년 자동차세:</strong> 1,600cc를 넘는 승용차는 cc당{" "}
            {wonPerCc}원이라 1,999cc × {wonPerCc}원 ={" "}
            {formatWon(base.displacementCc! * wonPerCc)}입니다.
          </li>
          <li>
            <strong>차령 경감:</strong> 차령 {half.carAge}년이라 반기마다{" "}
            {Math.round(half.reductionRate * 100)}%가 깎여 반기{" "}
            {formatWon(half.carTax)}, 1년 {formatWon(tax.carTax)}입니다.
          </li>
          <li>
            <strong>고지대로 낼 때:</strong> 지방교육세{" "}
            {Math.round(data.tax.educationTaxRate * 100)}%를 더해 6월과 12월에{" "}
            {formatWon(half.total)}씩, 1년 {formatWon(tax.annualTotal)}을
            냅니다.
          </li>
          <li>
            <strong>1월 연납 공제:</strong> 납부기한 다음 날(2월 1일)부터 12월
            31일까지 {jan.coveredDays}일분에 5%를 곱합니다.{" "}
            {formatWon(tax.carTax)} × {jan.coveredDays}/365 × 5%를 빼고 10원
            미만을 버리면 자동차세가{" "}
            {formatWon(tax.carTax - jan.carTaxDiscount)}입니다.
          </li>
          <li>
            <strong>1월에 낼 돈:</strong> 여기에 지방교육세를 다시 계산해 더하면{" "}
            <strong>{formatWon(jan.payTotal)}</strong>, 고지대로 낼 때보다{" "}
            {formatWon(jan.saving)} 적습니다.
          </li>
        </ol>

        <h3>신청 달별 비교</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">신고납부 기간</th>
                <th scope="col">공제 계산</th>
                <th scope="col">낼 돈</th>
                <th scope="col">아끼는 돈</th>
              </tr>
            </thead>
            <tbody>
              {byMonth.map((r) => (
                <tr key={r.month}>
                  <td>
                    {r.month}월 {Number(r.periodStart.slice(8))}~
                    {Number(r.periodEnd.slice(8))}일
                  </td>
                  <td>{howTo[r.month]}</td>
                  <td>{formatWon(r.payTotal)}</td>
                  <td>{formatWon(r.saving)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          1월과 3월의 차이는 {formatWon(jan.saving - mar.saving)}입니다. 3월
          연납은 남은 일수가 {mar.coveredDays}일로 줄어 그만큼 공제가
          작아집니다. 6월 연납은 1~6월분을 고지대로 내고 7~12월분만 5% 공제받는
          셈입니다.
        </p>
      </section>

      <section data-article-section="variations">
        <h2>조건이 바뀌면</h2>

        <h3 data-variation>배기량이 다르면: 큰 차일수록 1월이 유리하다</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">배기량</th>
                <th scope="col">1년 세금</th>
                <th scope="col">1월 연납</th>
                <th scope="col">3월 연납</th>
              </tr>
            </thead>
            <tbody>
              {byCc.map((r) => (
                <tr key={r.cc}>
                  <td>{r.cc.toLocaleString("ko-KR")}cc</td>
                  <td>{formatWon(r.t.annualTotal)}</td>
                  <td>{formatWon(r.j.saving)} 절약</td>
                  <td>{formatWon(r.m.saving)} 절약</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          모두 2025년 3월 등록, 차령 {half.carAge}년 기준입니다. 공제가 세금에
          비례하므로 배기량이 커질수록 1월과 3월의 차이도 벌어집니다.
          {smallRow && (
            <>
              {" "}
              {smallRow.cc.toLocaleString("ko-KR")}cc 경차는 1년 자동차세가{" "}
              {formatWon(smallRow.t.carTax)}으로{" "}
              {formatWon(data.smallTaxThresholdWon)} 이하라, 지자체가 6월에
              1년치를 한꺼번에 고지할 수 있습니다.
            </>
          )}
        </p>

        <h3 data-variation>오래된 차라면: 공제도 절반 가까이 준다</h3>
        <p>
          같은 1,999cc 차라도 2014년에 등록했다면 {Y}년 차령이{" "}
          {old.halves[0].carAge}년입니다. 차령 경감은 12년에서 멈추므로 세금이{" "}
          {Math.round(old.halves[0].reductionRate * 100)}% 줄어 1년{" "}
          {formatWon(old.annualTotal)}입니다. 1월에 연납해도{" "}
          {formatWon(oldJan.saving)}을 아끼는 데 그칩니다. 그래도 공제율은
          같으니 낼 돈이 있다면 1월이 가장 유리합니다.
        </p>

        <h3 data-variation>전기차라면: 6월 일괄 고지보다 1월이 낫다</h3>
        <p>
          전기차 자동차세는 배기량과 관계없이 1년 {formatWon(ev.carTax)}입니다.{" "}
          {formatWon(data.smallTaxThresholdWon)} 이하라 지자체가 6월에 1년치를
          한꺼번에 고지할 수 있고, 이때는 7~12월분의 5%만 빠져{" "}
          {formatWon(evJun.saving)}이 줄어듭니다. 1월에 직접 연납하면{" "}
          {formatWon(evJan.saving)}을 아껴{" "}
          {formatWon(evJan.saving - evJun.saving)} 더 이득입니다.
        </p>
      </section>

      <section data-article-section="pitfalls">
        <h2>놓치기 쉬운 것</h2>
        <ol>
          <li>
            <strong>3월 분할납부는 연납이 아닙니다.</strong> 3월 16~31일에는
            1~6월분의 절반만 미리 내는 분할납부도 있습니다. 분할납부에는 공제가
            없으니, 공제를 받으려면 1년치를 한꺼번에 신고납부해야 합니다.
          </li>
          <li>
            <strong>다음 해 1월 납부서는 지자체 재량입니다.</strong> 연납한
            사람에게 지자체가 다음 해 1월에 연납 납부서를 보낼 수 있다고 정해져
            있을 뿐, 꼭 보내야 하는 것은 아닙니다. 1월 말까지 납부서가 오지
            않으면 직접 신청하세요.
          </li>
          <li>
            <strong>연납 뒤 이사해도 다시 내지 않습니다.</strong> 연납한 뒤 차의
            사용본거지가 다른 시·군·구로 바뀌어도, 새 지역에서 그 해 자동차세를
            다시 고지하지 않습니다.
          </li>
          <li>
            <strong>연납한 차를 팔면 정산을 정하세요.</strong> 차를 팔면
            자동차세는 소유기간에 따라 날짜로 나눠 계산합니다. 판 사람이
            동의하면 이미 낸 연납 세금을 산 사람이 낸 것으로 볼 수도 있으니,
            매매할 때 누가 얼마를 부담할지 정해 두는 편이 좋습니다.
          </li>
        </ol>
      </section>
    </GuideLayout>
  );
}
