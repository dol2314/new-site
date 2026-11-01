/**
 * 사례 분석 3: 차를 팔고 사는 해의 자동차세 일할계산(2027년).
 * 숫자는 모두 calc-core + 데이터로 빌드 때 계산한다(손으로 쓰지 않는다).
 * 이전일 당일 귀속 규칙(rules.prorateDayBoundary)이 확인 전이면 후보값으로 미리보기만 하고, 공개하면 빌드를 멈춘다.
 */
import {
  calcCarTax,
  calcTransferProrate,
  formatWon,
  type CarTaxInput,
} from "@site/calc-core";
import { carTaxData, carTaxProrateData } from "@site/data";
import Link from "next/link";
import { GuideLayout } from "@/components/GuideLayout";
import type { GuideMeta } from "@/lib/guides";
import { formatKoreanDate } from "@/lib/kst";

const Y = 2027;
const data = carTaxData(Y);
const pr = carTaxProrateData(Y);
const ready = pr.missing.length === 0;
const P = ready ? pr.params : pr.previewParams;
const short = (d: string) =>
  `${Number(d.slice(5, 7))}월 ${Number(d.slice(8, 10))}일`;

// 기본 조건(가정): 1,999cc 휘발유 승용차, 2025년 3월 최초 등록, 2027년 4월 15일 이전등록
const base: CarTaxInput = {
  fuelType: "gasoline",
  displacementCc: 1999,
  ageStartDate: "2025-03-10",
  taxYear: Y,
};
const TRANSFER = `${Y}-04-15`;
const tax = calcCarTax(base, data.tax);
const r = calcTransferProrate(tax, TRANSFER, Y, P);
const h1 = tax.halves[0];

// 변형 1: 이전등록이 늦어지면 (계약 4/15, 등록 5/2)
const LATE = `${Y}-05-02`;
const late = calcTransferProrate(tax, LATE, Y, P);

// 변형 2: 하반기에 넘기면
const FALL = `${Y}-10-20`;
const fall = calcTransferProrate(tax, FALL, Y, P);

// 변형 3: 새 차(차령 2년)라면 — 연세액 기준
const young = calcCarTax({ ...base, ageStartDate: "2026-03-10" }, data.tax);
const yr = calcTransferProrate(young, TRANSFER, Y, P);

// 변형 4: 경차를 1월 초에 넘기면 — 2천원 미만
const kei = calcCarTax({ ...base, displacementCc: 998 }, data.tax);
const k9 = calcTransferProrate(kei, `${Y}-01-10`, Y, P);
const k10 = calcTransferProrate(kei, `${Y}-01-11`, Y, P);

const sources = [
  ...pr.sources.filter((s) => s.key !== "rules.prorateDayBoundary" || ready),
  ...data.sources.filter((s) =>
    [
      "values.ccBrackets",
      "values.ageReduction",
      "values.educationTaxRate",
    ].includes(s.key),
  ),
];

export default function Article({ meta }: { meta: GuideMeta }) {
  if (meta.published && !ready) {
    throw new Error(
      `확인 전 데이터로 사례 글을 공개할 수 없음: ${pr.missing.join(", ")}`,
    );
  }
  return (
    <GuideLayout
      meta={meta}
      summary={[
        <>
          차를 팔면 그 해 자동차세는 이전등록일을 기준으로 날짜만큼 나눠 판
          사람과 산 사람이 각자 냅니다.
        </>,
        <>
          2025년 3월 등록 1,999cc 휘발유차를 {Y}년 4월 15일에 이전등록하면,
          1~6월분 {formatWon(h1.total)} 가운데 판 사람이{" "}
          <strong>{formatWon(r.seller.total)}</strong>, 산 사람이{" "}
          <strong>{formatWon(r.buyer.total)}</strong>을 냅니다(지방교육세 포함,{" "}
          {formatKoreanDate(meta.asOf)} 현행법 기준).
        </>,
        <>
          나눌 세금이 얼마인지는 <Link href="/car-tax/">자동차세 계산기</Link>로
          먼저 구해 두면 편합니다.
        </>,
      ]}
      faq={[
        {
          q: "한 해 중간에 차를 팔면 자동차세는 누가 내나요?",
          a: "과세기간 중에 소유권을 넘기면 소유기간에 따라 일할계산해 판 사람과 산 사람에게 각각 부과합니다. 판 사람은 이전등록일에 자기 몫을 바로 신고납부할 수도 있습니다.",
        },
        {
          q: "계약한 날 기준으로 나눌 수는 없나요?",
          a: "신청하면 됩니다. 판 사람이나 산 사람이 일할계산 신청서에 계약서 같은 소유권 변동 증명서류를 붙여 내면, 증명된 양도일을 기준으로 계산합니다. 내지 않으면 이전등록일 기준입니다.",
        },
        {
          q: "몇 천 원도 안 되는 몫도 내야 하나요?",
          a: `일할계산한 자동차세가 ${formatWon(P.minCollectWon)} 미만이면 징수하지 않습니다.`,
        },
      ]}
      sources={sources}
    >
      {!ready && (
        <p className="notice small">
          확인 중: 이전등록일 당일을 산 사람 몫으로 세는지 법령·서식에 적혀 있지
          않아 확인하고 있습니다. 이 글의 날수는 당일을 산 사람 몫으로 셌고,
          확인 전에는 공개하지 않습니다.
        </p>
      )}

      <section data-article-section="conditions">
        <h2>계산 조건 (가정)</h2>
        <div className="table-wrap">
          <table>
            <tbody>
              <tr>
                <th scope="row">차</th>
                <td>휘발유 승용차 1,999cc, 개인 간 매매, 비영업용</td>
              </tr>
              <tr>
                <th scope="row">최초 등록</th>
                <td>
                  {formatKoreanDate(base.ageStartDate)} ({Y}년 차령 {h1.carAge}
                  년)
                </td>
              </tr>
              <tr>
                <th scope="row">이전등록일</th>
                <td>{formatKoreanDate(TRANSFER)}</td>
              </tr>
              <tr>
                <th scope="row">연납</th>
                <td>하지 않음 (6월·12월 고지대로 냄)</td>
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
            <strong>나눌 기분 찾기:</strong> 4월은 1~6월분(제1기분)에
            들어갑니다. 이 기분은 {r.halfDays}일이고, 7~12월분은 처음부터 산
            사람 몫입니다.
          </li>
          <li>
            <strong>소유 일수:</strong> 판 사람은 {short(r.seller.from)}부터{" "}
            {short(r.seller.to)}까지 {r.seller.days}일, 산 사람은{" "}
            {short(r.buyer.from)}부터 {short(r.buyer.to)}까지 {r.buyer.days}
            일입니다.
          </li>
          <li>
            <strong>계산식 고르기:</strong> 차령이 {P.halfBasisMinAge}년 이상인
            승용차는 1년 세금이 아니라 그 기분 세금({formatWon(h1.carTax)})을
            기분 일수로 나눕니다.
          </li>
          <li>
            <strong>판 사람:</strong> {formatWon(h1.carTax)} × {r.seller.days}/
            {r.halfDays} → 자동차세 {formatWon(r.seller.carTax)}, 지방교육세{" "}
            {formatWon(r.seller.educationTax)}, 합계{" "}
            <strong>{formatWon(r.seller.total)}</strong>.
          </li>
          <li>
            <strong>산 사람:</strong> {formatWon(h1.carTax)} × {r.buyer.days}/
            {r.halfDays} → 자동차세 {formatWon(r.buyer.carTax)}, 지방교육세{" "}
            {formatWon(r.buyer.educationTax)}, 합계{" "}
            <strong>{formatWon(r.buyer.total)}</strong>. 여기에 7~12월분{" "}
            {formatWon(tax.halves[1].total)}을 더해 그 해에{" "}
            {formatWon(r.buyerYearTotal)}을 냅니다.
          </li>
        </ol>
        <p>
          두 사람 몫을 더하면 {formatWon(r.seller.total + r.buyer.total)}으로
          1~6월분 고지액과 거의 같습니다. 차이는 금액마다 10원 미만을 버려서
          생깁니다.
        </p>
      </section>

      <section data-article-section="variations">
        <h2>조건이 바뀌면</h2>

        <h3 data-variation>이전등록이 늦어지면: 판 사람 몫이 늘어난다</h3>
        <p>
          4월 15일에 계약하고 차를 넘겼는데 이전등록은 {short(LATE)}에 했다면,
          신청서를 내지 않는 한 등록일이 기준입니다. 판 사람 몫은{" "}
          {late.seller.days}일, {formatWon(late.seller.total)}으로{" "}
          {formatWon(late.seller.total - r.seller.total)} 늘어납니다. 계약서를
          붙여 일할계산을 신청하면 4월 15일 기준으로 돌아갑니다.
        </p>

        <h3 data-variation>하반기에 넘기면: 1~6월분은 판 사람이 다 낸다</h3>
        <p>
          {short(FALL)}에 이전등록하면 나누는 것은 7~12월분입니다. 이 기분은{" "}
          {fall.halfDays}일이라 판 사람 몫은 {fall.seller.days}일,{" "}
          {formatWon(fall.seller.total)}입니다. 6월에 낸 1~6월분{" "}
          {formatWon(tax.halves[0].total)}을 더해 판 사람은 그 해{" "}
          {formatWon(fall.sellerYearTotal)}을 내고, 산 사람은 {fall.buyer.days}
          일분 {formatWon(fall.buyer.total)}만 냅니다.
        </p>

        <h3 data-variation>
          차령 {P.halfBasisMinAge}년 미만 새 차라면: 1년 세금을 365일로 나눈다
        </h3>
        <p>
          2026년 3월에 등록한 같은 차는 {Y}년 차령이 {young.halves[0].carAge}
          년이라 경감이 없고, 계산식도 1년 세금({formatWon(young.baseAnnual)}) ×
          소유 일수 ÷ 365입니다. 4월 15일 이전등록이면 판 사람{" "}
          {formatWon(yr.seller.total)}, 산 사람 {formatWon(yr.buyer.total)}
          입니다.
        </p>

        <h3 data-variation>
          경차를 1월 초에 넘기면: 판 사람 몫이 0원일 수 있다
        </h3>
        <p>
          998cc 경차의 1~6월분 자동차세는 {formatWon(kei.halves[0].carTax)}
          입니다. 1월 10일에 이전등록하면 판 사람 몫은 {
            k9.seller.days
          }일분이라 {formatWon(P.minCollectWon)}이 안 돼 내지 않습니다. 하루
          늦은 1월 11일이면 {k10.seller.days}일분 {formatWon(k10.seller.carTax)}
          이 되어 지방교육세를 더해 {formatWon(k10.seller.total)}을 냅니다.
        </p>
      </section>

      <section data-article-section="pitfalls">
        <h2>놓치기 쉬운 것</h2>
        <ol>
          <li>
            <strong>기준은 계약일이 아니라 이전등록일입니다.</strong> 계약일로
            나누려면 일할계산 신청서에 계약서 등 증명서류를 붙여 내야 합니다.
            신청서를 내지 않으면 이전등록일 기준으로 각각 과세됩니다.
          </li>
          <li>
            <strong>1년치를 미리(연납) 냈다면 돌려받을 몫이 있습니다.</strong>{" "}
            일할계산 신청서의 &apos;기납부세액 환급신청&apos; 칸에 본인 계좌를
            적으면 됩니다. 돌려받지 않고 산 사람에게 넘기려면 같은 서식으로
            납부승계에 동의합니다. 돌려줄 금액은 지자체가 정합니다.
          </li>
          <li>
            <strong>판 사람은 등록하는 날 바로 낼 수 있습니다.</strong>{" "}
            이전등록일 기준으로 자기 몫을 일할계산해 그날 신고납부할 수
            있습니다.
          </li>
        </ol>
      </section>
    </GuideLayout>
  );
}
