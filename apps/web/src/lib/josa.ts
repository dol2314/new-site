/** 단어 끝 글자의 받침에 맞춰 조사를 붙인다. 한글이 아니면 받침 없음으로 본다. */
type Pair = "은/는" | "이/가" | "을/를" | "과/와" | "으로/로";

export function josa(word: string, pair: Pair): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  const isHangul = code >= 0 && code <= 11171;
  const final = isHangul ? code % 28 : 0;
  const [withFinal, without] = pair.split("/") as [string, string];
  // "으로/로": ㄹ 받침(8)은 "로"
  if (pair === "으로/로")
    return word + (final !== 0 && final !== 8 ? withFinal : without);
  return word + (final !== 0 ? withFinal : without);
}
