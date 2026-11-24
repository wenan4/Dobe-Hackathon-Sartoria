// Preserve offsets so every extracted fact can point to the customer's original text.
export interface RequirementClause {
  text: string;
  start: number;
  end: number;
}

const clauseBoundary = /[，,；;。！？!?\n]+|(?<!不)但(?:是)?|另外|而且|同时|只是(?!\s*(?:参考|对照|示意|备选|候选))|并且|并(?=把|将|改|换|只|要)|随后|却|、(?=(?:不要|要用|只要|还要|不能|必须|最好|希望|洗护|面料|色系|颜色|工艺|领型|套数|数量))|(?<=不动|不变|照旧|待定|不强求|原计划|原方案|原单)(?=只|改|换|想|请|调整|色系|颜色|洗护|可机洗|必须)|[^\S\r\n]+/gu;
const unfinishedPhrase = /(?:必须|务必|只能|不能|不许|不接受|不允许|不考虑|不得|不要|别用|排除|需要|最好|优先|希望|想要|倾向|确定|确认为|改成|换成|定为|定在|按|为|在|选|用|做|给|订|和|或|与|的|是|比|别|不)$/u;
const unitAfterNumber = /^(?:套|件|身|条|份|人|位|名|个|成|厘米|毫米|公分|%|％|cm\b|mm\b)/iu;
const trailingStance = /^(?:(?:我|我们|采购|后勤)(?:这边|本人)?\s*)?(?:一律|也|都|明确|完全|坚决|暂时|先)*\s*(?:排除|不接受|不要|别用|不用|为准|照旧|待定|优先|不能用)(?=[\s，,。；;！？!?]|$)/u;

function isSpokenBreak(left: string, right: string): boolean {
  if (!left || !right) return false;
  if (unfinishedPhrase.test(left) && !(
    /(?:都|也|一律|明确|坚决)(?:明确)?(?:排除|不要|不接受|不用)$/u.test(left) &&
    /^[\p{Script=Han}]{1,8}(?:必须|务必|只能|改成|定为)/u.test(right)
  )) return false;
  if (/[\d０-９零〇一二两三四五六七八九十百千万]$/u.test(left) && unitAfterNumber.test(right)) return false;
  if (/^(?:的|或(?:者)?|和|与|及)(?:\s|[，。；！？]|$)/u.test(right) || trailingStance.test(right)) return false;
  if (/[A-Za-z０-９0-9]$/u.test(left) && /^[A-Za-z０-９0-9型版形]/u.test(right)) return false;
  // A space between grammatical words (such as “颜色 暖灰”) is weaker than a clause ending.
  return /\p{Script=Han}/u.test(left) && left.trim().length >= 3 && /^[\p{Script=Han}]/u.test(right);
}

export function splitRequirementClauses(text: string): RequirementClause[] {
  const clauses: RequirementClause[] = [];
  let start = 0;
  function append(end: number) {
    const source = text.slice(start, end);
    const value = source.trim();
    if (!value) return;
    const offset = start + source.indexOf(value);
    clauses.push({ text: value, start: offset, end: offset + value.length });
  }
  for (const boundary of text.matchAll(clauseBoundary)) {
    const next = boundary.index + boundary[0].length;
    if (/^[^\S\r\n]+$/u.test(boundary[0]) &&
      !isSpokenBreak(text.slice(start, boundary.index), text.slice(next))) continue;
    append(boundary.index);
    start = next;
  }
  append(text.length);
  return clauses;
}
