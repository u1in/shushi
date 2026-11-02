/**
 * 宏 GRID 的固定自动配色主题。
 * 三组 40 色严格分离：普通文本行、进位行、借位行不共用颜色；后续换主题只需修改本文件。
 *
 * 色板面向小学课堂的屏幕阅读：
 * - 正文使用 10 个高饱和、中明度的色相家族：红、橙、粉、品红、紫、蓝、天蓝、青、青绿、绿。
 * - 排列时故意让相邻行跨越较大的色相距离，并让奇偶行相差约 0.06 的明度，
 *   相邻数字不会因颜色接近而混在一起。
 * - 刻意避开黄褐、橄榄、咖色与深紫：这些颜色在中低明度下容易显得沉闷，
 *   不适合作为儿童教学的主色。
 * - 每 10 行只做 0.004 的明度微调，保证 40 色互不重复，又不破坏整组长竖式的协调。
 * - 进位色在行色相上 +36° 并略压暗、提高饱和度；借位色回转 -35° 并压暗，
 *   让注记既跟随所在行，又能从正文中辨认出来。
 *
 * 当前目标为屏幕与投影教学；若后续需要严格印刷，应整体压暗并重新复核对比度。
 */
export const AUTO_COLOR_MAX_ROWS = 40

/**
 * 10 个色相家族按“冷暖交替、色相跳开”的顺序排列：
 * 红、天蓝、橙、绿、品红、青绿、粉、蓝、青、紫。
 * 奇数行整体提亮，偶数行压暗，形成明快的深浅节奏。
 */
const AUTO_COLOR_ROW_TEXT = [
  // 0–9：基础明度。
  '#c43e49', '#0096c9', '#be4c00', '#4f9b3e', '#9752b4', '#00a079', '#b2468a', '#3986e4', '#008c8e', '#7e74e1',
  // 10–19：同组色相，整体明度 +0.004。
  '#c63f4a', '#0098cb', '#c04e00', '#509c3f', '#9853b5', '#00a17a', '#b4478b', '#3a88e5', '#008d8f', '#8075e3',
  // 20–29：同组色相，整体明度 +0.008。
  '#c7414b', '#0099cc', '#c14f00', '#529e40', '#9954b6', '#00a37b', '#b5488c', '#3c89e6', '#008e90', '#8177e4',
  // 30–39：同组色相，整体明度 +0.012。
  '#c8424c', '#009acd', '#c35000', '#539f41', '#9b55b8', '#00a47d', '#b6498d', '#3d8ae8', '#009091', '#8278e5',
] as const

/** 进位色：由 rowText 派生，色相 +36°、明度 -0.02、彩度 ×1.3；调整 rowText 后需同步重新生成。 */
const AUTO_COLOR_CARRY = [
  '#c63400', '#587be7', '#ab5700', '#00a27c', '#bf1e7e', '#009caf', '#cb1636', '#865ef0', '#0080b3', '#b549c9',
  '#c83500', '#597de9', '#ac5900', '#00a37d', '#c0207f', '#009db0', '#ce1836', '#8660f2', '#0080b4', '#b74acb',
  '#c93700', '#597eea', '#ad5a00', '#00a57e', '#c1217f', '#009fb2', '#cf1a37', '#8762f2', '#0081b5', '#b84ccc',
  '#ca3800', '#597fec', '#af5b00', '#00a67f', '#c42281', '#00a0b4', '#d01c38', '#8962f4', '#0084b7', '#b94dcd',
] as const

/** 借位色：由 rowText 派生，色相 -35°、明度 -0.08、彩度 ×0.9；调整 rowText 后需同步重新生成。 */
const AUTO_COLOR_BORROW = [
  '#953071', '#008689', '#9e304c', '#7b7100', '#5050ac', '#567e33', '#764199', '#007fa8', '#2a7353', '#1471be',
  '#973172', '#00888a', '#a0314c', '#7c7200', '#5151ad', '#567f34', '#78429b', '#0081a9', '#2b7454', '#1772c0',
  '#983373', '#00898b', '#a1324d', '#7e7400', '#5252ae', '#588134', '#79439c', '#0082aa', '#2b7555', '#1a74c1',
  '#993474', '#008a8c', '#a3334e', '#7f7500', '#5453b0', '#588236', '#7a449d', '#0083ac', '#2d7655', '#1c75c2',
] as const

export const AUTO_COLOR_THEME = {
  /** 每条 ROW 的普通文字色，索引即包含借位行在内的实际行号。 */
  rowText: AUTO_COLOR_ROW_TEXT,
  /** RB(text) 代表的进位标记色，按所在 ROW 分配。 */
  carry: AUTO_COLOR_CARRY,
  /** MT(text) 代表的借位标记色，按所在 ROW 分配。 */
  borrow: AUTO_COLOR_BORROW,
  /** 运算符为全局独占色，不与行、进位、借位色复用。 */
  operators: {
    '+': '#b02a37',
    '-': '#c2410c',
    '−': '#c2410c',
    '×': '#7b3fa0',
    '*': '#7b3fa0',
    '÷': '#00757a',
    '/': '#00757a',
  },
  /** 小数点始终使用此独占色。 */
  decimal: '#c2185b',
  /** 普通横线与一般单元格边框共享的线条规则。 */
  rule: { color: '#3a3430', thickness: 2 },
  /** BRACKET 自动生成的厂字弯与厂字横共用的独立线条规则。 */
  bracketRule: { color: '#4a5f78', thickness: 2 },
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
