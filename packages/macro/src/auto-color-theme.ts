/**
 * 宏 GRID 的固定自动配色主题。
 * 三组 40 色严格分离：普通文本行、进位行、借位行不共用颜色；后续换主题只需修改本文件。
 */
export const AUTO_COLOR_MAX_ROWS = 40

/**
 * 固定的四段式色板：蓝青、青绿、橄榄金、暖玫红紫。
 * 每段含十行，段首和上一段尾部选用临近色，使长竖式的色彩过渡自然。
 */
const AUTO_COLOR_ROW_TEXT = [
  // 0–9：深蓝逐渐过渡至青绿。
  '#264653', '#2A5D78', '#2F6F9F', '#277DA1', '#168AAD', '#0F88A5', '#0E7490', '#147A83', '#1D7874', '#287271',
  // 10–19：青绿逐渐过渡至橄榄金。
  '#2E7D69', '#3A8A5A', '#4E9A4F', '#659E43', '#7AA33B', '#8FA83A', '#A0AA3D', '#AEA73F', '#B9A343', '#C29D4D',
  // 20–29：金色逐渐过渡至珊瑚玫红。
  '#C79F49', '#D09A3E', '#D8913E', '#DE8542', '#DC794B', '#D26F58', '#C86A65', '#BE6473', '#B35E80', '#A85A8B',
  // 30–39：玫红紫逐渐回落至蓝绿色。
  '#9F568F', '#925495', '#83539A', '#73569B', '#655D99', '#596794', '#4E718C', '#447B83', '#3B8278', '#34856D',
] as const

const mixHex = (source: string, target: string, targetWeight: number): string => {
  const readChannels = (color: string): [number, number, number] => [0, 2, 4].map((offset) => Number.parseInt(color.slice(offset + 1, offset + 3), 16)) as [number, number, number]
  const sourceChannels = readChannels(source)
  const targetChannels = readChannels(target)
  const toHex = (value: number): string => Math.round(value).toString(16).padStart(2, '0')
  const channels = sourceChannels.map((channel, index) => channel * (1 - targetWeight) + targetChannels[index] * targetWeight)
  return `#${channels.map(toHex).join('')}`
}

/** 进位略提亮、借位略压暗，保留同组和谐关系且不与正文行复用完全相同的颜色。 */
const createAnnotationPalette = (target: string, targetWeight: number): string[] => (
  AUTO_COLOR_ROW_TEXT.map((color) => mixHex(color, target, targetWeight))
)

export const AUTO_COLOR_THEME = {
  /** 每条 ROW 的普通文字色，索引即包含借位行在内的实际行号。 */
  rowText: AUTO_COLOR_ROW_TEXT,
  /** RB(text) 代表的进位标记色，按所在 ROW 分配。 */
  carry: createAnnotationPalette('#ffffff', 0.22),
  /** MT(text) 代表的借位标记色，按所在 ROW 分配。 */
  borrow: createAnnotationPalette('#111827', 0.28),
  /** 四则运算符为全局独占色，不与行、进位、借位色复用。 */
  operators: {
    '+': '#e11d48',
    '-': '#f97316',
    '−': '#f97316',
    '×': '#7c3aed',
    '*': '#7c3aed',
    '÷': '#0891b2',
    '/': '#0891b2',
  },
  /** 小数点始终使用此独占色。 */
  decimal: '#0f766e',
  /** 普通横线与一般单元格边框共享的线条规则。 */
  rule: { color: '#111827', thickness: 2 },
  /** BRACKET 自动生成的厂字弯与厂字横共用的独立线条规则。 */
  bracketRule: { color: '#365F8B', thickness: 2 },
} as const

const getRowPaletteColor = (palette: readonly string[], row: number, label: string): string => {
  const color = palette[row]
  if (color === undefined) throw new Error(`autoColor 最多支持 ${AUTO_COLOR_MAX_ROWS} 行；${label}请求了第 ${row + 1} 行。`)
  return color
}

export const getAutoRowTextColor = (row: number): string => getRowPaletteColor(AUTO_COLOR_THEME.rowText, row, '普通文本')
export const getAutoCarryColor = (row: number): string => getRowPaletteColor(AUTO_COLOR_THEME.carry, row, '进位')
export const getAutoBorrowColor = (row: number): string => getRowPaletteColor(AUTO_COLOR_THEME.borrow, row, '借位')

export const getAutoOperatorColor = (text: string): string | undefined => (
  AUTO_COLOR_THEME.operators[text as keyof typeof AUTO_COLOR_THEME.operators]
)
