const ARABIC_DIGITS = '0-9０-９';
const CHINESE_NUMERALS = '零〇一二两三四五六七八九十百千万';
const DIGITS = ARABIC_DIGITS + CHINESE_NUMERALS;
const NUMBER = `(?:[${ARABIC_DIGITS}]+|[${CHINESE_NUMERALS}]+)`;
const COUNT_START = `(?<![第.${DIGITS}])`;
const GARMENT_NOUN = '(?:外套|夹克|上衣|西服|西装|礼服|礼裙|长裙|连衣裙|连衣礼服|连身礼服|裙子|裙装|衣服|演出服|成衣|套装)';
// A garment noun may follow a brief modifier, such as the intended occasion or style.
export const GARMENT_AFTER_CLASSIFIER = `(?!事|要求|意见|建议|信息|规定|规则|理由|备注|说明|反馈|(?:洗护|养护|交付|工艺|安全)(?:的)?(?:要求|建议|说明|规则))[:：]?(?=[^，,；;。！？!?、:：\\d]{0,12}${GARMENT_NOUN})`;
const DOCUMENT_AFTER_PORTION = '(?![^，,；;。！？!?、]{0,4}(?:文件|单据|合同|报表|统计|清单|记录|报价|说明|方案|报告|协议))';
const ORDER_UNIT = `(?:套(?:装)?|件|身|(?:份${DOCUMENT_AFTER_PORTION}|条)${GARMENT_AFTER_CLASSIFIER})(?![式套])`;
const QUANTITY = new RegExp(`${COUNT_START}(${NUMBER})\\s*${ORDER_UNIT}`, 'g');
const SINGLE_GARMENT = new RegExp(`(?:做|订|定做|订制|定制)\\s*([件条])(?![式套])${GARMENT_AFTER_CLASSIFIER}`);
const PERSON_ROLE = '(?:员工|同事|职工|职员|工作人员|接待人员|礼宾人员|技术人员|成员|队员|老师|学生|演员|志愿者|售货员|服务员|组员)';
const PERSON_COUNT = new RegExp(`${COUNT_START}(${NUMBER})\\s*(?:个人|人(?!均|手)|名|位|个(?=${PERSON_ROLE}))`, 'g');
const ALLOCATION_ACTOR = `(?:每(?:一)?(?:人|位|名|个(?:人)?)(?:\\s*${PERSON_ROLE})?|人[均手]|一(?:人|位)|各(?:人|自)?)`;
const ALLOCATION_ACTION = '(?:\\s|都|也|只|要|得|是|先|统一|分别|配(?:发|备|给)?|发(?:放|给)?|领(?:取|用)?|拿|分(?:到|发)?|订(?:做|制)?|定(?:做|制)?|做|备|给|选(?:择)?)';
const UNCERTAIN_LEAD = '(?:大约|约(?:有|为)?|大概|差不多|至少|至多|最多|最少|不[超多]过|不[少低]于|超过|不足)';
const OPTIONAL_ALLOCATION = `(?:${UNCERTAIN_LEAD}|可(?:以)?|可能|尽量|希望|优先)`;
const ALLOCATION_LEAD = `${ALLOCATION_ACTOR}((?:${ALLOCATION_ACTION}|${OPTIONAL_ALLOCATION}){0,7})`;
const UNCERTAIN_END = '(?:左右|上下|余|多(?=\\s|[，,；;。！？!?]|$)|以上|以下|起(?![床身头]))';
const COUNT_RANGE = '(?:到|至|[-－—~～])';
const ALLOCATION = new RegExp(
  `${ALLOCATION_LEAD}(${NUMBER})(?:(?:${ORDER_UNIT})?\\s*(${COUNT_RANGE})\\s*${NUMBER})?\\s*${ORDER_UNIT}(${UNCERTAIN_END})?`,
  'g',
);
const SINGLE_ALLOCATION = new RegExp(`${ALLOCATION_LEAD}[件条](?![式套])${GARMENT_AFTER_CLASSIFIER}`, 'g');
const UNCERTAIN_HEADCOUNT = new RegExp(`(?:${UNCERTAIN_LEAD}|${NUMBER}\\s*${COUNT_RANGE})\\s*$`);
const uncertainAllocation = new RegExp(OPTIONAL_ALLOCATION);
const ROSTER_SUFFIX = new RegExp(`^(?:\\s|的|在岗|到岗|参加|出席|${PERSON_ROLE}|，|,|；|;)*$`);
const LABELED_QUANTITY = new RegExp(`(?:套数|件数|订购数量|定制数量|数量)\\s*(?:合计|共计|是|为|共|[:：=])?\\s*(${NUMBER})(?!\\s*(?:套|件|身|份|条|[${DIGITS}]))`);

interface QuantityMatch {
  value: number;
  start: number;
  end: number;
}

function parseQuantity(text: string): number {
  const halfWidth = text.normalize('NFKC');
  if (/^[0-9]+$/.test(halfWidth)) return Number(halfWidth);
  const digits = '零一二三四五六七八九';
  const units: Record<string, number> = { 十: 10, 百: 100, 千: 1000 };
  let total = 0;
  let section = 0;
  let current = 0;
  for (const character of text) {
    if (character === '万') {
      total += (section + current) * 10000;
      section = current = 0;
      continue;
    }
    const unit = units[character];
    if (unit) {
      section += (current || 1) * unit;
      current = 0;
    } else {
      const digit = character === '两' ? 2 : character === '〇' ? 0 : digits.indexOf(character);
      current = current * 10 + digit;
    }
  }
  return total + section + current;
}

function isPositiveCount(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

export function matchPerPersonQuantity(text: string): QuantityMatch | undefined {
  const people = [...text.matchAll(PERSON_COUNT)];
  for (const allocation of text.matchAll(ALLOCATION)) {
    if (uncertainAllocation.test(allocation[1]) || allocation[3] || allocation[4]) continue;
    const headcount = people.findLast((match) => {
      const end = match.index + match[0].length;
      return end <= allocation.index && ROSTER_SUFFIX.test(text.slice(end, allocation.index));
    });
    if (!headcount || UNCERTAIN_HEADCOUNT.test(text.slice(0, headcount.index))) continue;
    const peopleCount = parseQuantity(headcount[1]);
    const perPerson = parseQuantity(allocation[2]);
    const total = peopleCount * perPerson;
    if (isPositiveCount(peopleCount) && isPositiveCount(perPerson) && isPositiveCount(total)) {
      return { value: total, start: headcount.index, end: allocation.index + allocation[0].length };
    }
  }
}

export function matchOrderQuantities(text: string, twoPiece: boolean): QuantityMatch[] {
  const crew = matchPerPersonQuantity(text);
  const labeled = LABELED_QUANTITY.exec(text);
  if (labeled) {
    const value = parseQuantity(labeled[1]);
    if (isPositiveCount(value)) {
      const stated = { value, start: labeled.index, end: labeled.index + labeled[0].length };
      return crew ? [crew, stated] : [stated];
    }
  }

  // An allocation describes each wearer's share. It needs a separate headcount to yield a total.
  const allocations = [...text.matchAll(ALLOCATION)];
  const quantities = [...text.matchAll(QUANTITY)].flatMap((match): QuantityMatch[] => {
    const end = match.index + match[0].length;
    if (allocations.some((allocation) => allocation.index <= match.index && allocation.index + allocation[0].length >= end)) return [];
    if (/件\s*(?:内搭|里衬|衬里|打底衫)/.test(text.slice(match.index, end + 4))) return [];
    const value = parseQuantity(match[1]);
    return isPositiveCount(value) ? [{ value, start: match.index, end }] : [];
  });
  const single = SINGLE_GARMENT.exec(text);
  const singleIsAllocation = single && [...text.matchAll(SINGLE_ALLOCATION)].some((allocation) =>
    allocation.index <= single.index && allocation.index + allocation[0].length >= single.index + single[0].length);
  if (!crew && !quantities.length && single && !singleIsAllocation) {
    quantities.push({ value: 1, start: single.index, end: single.index + single[0].length });
  }

  // Piece counts within an outfit describe its construction.
  const orderCounts = twoPiece ? quantities.filter(({ end }) => text[end - 1] !== '件') : quantities;
  return crew ? [crew, ...orderCounts] : orderCounts;
}

export function parseFormQuantity(text: string): number {
  const match = text.matchAll(QUANTITY).next().value;
  const count = match ? parseQuantity(match[1]) : 0;
  return isPositiveCount(count) ? count : 0;
}
