# @u1in/shushi-core 公开出口补充清单

本文件补充统一入口实际 re-export 的辅助函数、类型和常量。类型只用于 TypeScript 类型标注；JavaScript 运行时只导入函数或常量。不要依赖包内部源码目录中的未导出函数。

## 1. 布局器的直接场景 API

如果不需要保留可编辑宏源码，可以直接取得 GridScene；需要用户编辑、保存或复制宏时，优先使用对应的 create*MacroSource。

    createAdditionGridScene(
      computation: AdditionComputation,
      settings?: Partial<AdditionRenderSettings>,
    ): GridScene

    createSubtractionGridScene(
      computation: SubtractionComputation,
      settings: SubtractionRenderSettings,
    ): GridScene

    createMultiplicationGridScene(
      computation: MultiplicationComputation,
      settings: MultiplicationRenderSettings,
    ): GridScene

    createDivisionGridScene(
      computation: DivisionComputation,
      settings: RenderSettings,
    ): GridScene

    createShortDivisionGridScene(
      computation: ShortDivisionComputation,
      settings: ShortDivisionRenderSettings,
    ): GridScene

    compileCalculatorMacro(source: string): GridScene

这些函数仍然通过宏编译链路生成 GridScene，不会绕过宏语言直接拼装渲染器数据。加法设置可省略，其他运算的设置必须完整提供。

## 2. 完整布局设置

    interface GridRenderSettings {
      cellWidth: number
      rowHeight: number
      fontSizeRatio: number
      showGuideGrid: boolean
      visibleStepCount?: number
      textHorizontalAlign?: GridTextHorizontalAlign
      textVerticalAlign?: GridTextVerticalAlign
    }

    interface RenderSettings extends GridRenderSettings {
      bracketBend: number
      uniformSubtractionBars: boolean
      showZeroQuotientSteps: boolean
    }

    interface MultiplicationRenderSettings extends GridRenderSettings {
      uniformMultiplicationBars: boolean
      showCarrySteps: boolean
    }

    interface AdditionRenderSettings extends GridRenderSettings {
      showCarrySteps: boolean
    }

    interface SubtractionRenderSettings extends GridRenderSettings {
      showBorrowSteps: boolean
    }

    interface ShortDivisionRenderSettings extends GridRenderSettings {
      showRemainders: boolean
    }

参数含义：

- cellWidth 和 rowHeight 是 CSS 像素尺寸。
- fontSizeRatio 是相对单元格字号的比例。
- visibleStepCount 从 0 开始；省略时显示完整过程。
- textHorizontalAlign 和 textVerticalAlign 是场景默认对齐，单个 GridTextContent 可以覆盖。
- bracketBend 控制长除法弯折轨道。
- showZeroQuotientSteps 必须与 getDivisionPlaybackStepCount 的参数保持一致。
- showRemainders 只对短除法进制转换的余数展示有意义。

## 3. 布局宏片段辅助函数

这些函数用于生成合法宏片段，适合自定义布局器或拼装宏源码；它们不负责解析完整用户源码。

    macroLiteral(value: string): string
    macroOption(key: string, value: string | number | boolean): string
    macroTextCell(text: string, styleToken: string, annotations?: string[]): string
    macroEmptyCell(): string
    macroAnnotationCell(annotation: string): string
    macroRightBottom(text: string, styleToken: string): string
    macroRightTop(text: string, styleToken: string): string
    macroBorrowDot(styleToken: string): string
    macroRow(cells: string[], align?: 'left' | 'right'): string
    macroLine(
      styleToken: string,
      span?: 'previous' | 'longest' | 'full',
    ): string
    macroGrid(
      columns: number,
      settings: GridRenderSettings,
      ariaLabel: string,
      children: string[],
    ): string

- macroLiteral 负责 JSON 转义宏字面量，不要手工拼接引号。
- macroOption 生成 KV(key, value)；字符串自动转义，数字和布尔值按字面输出。
- macroTextCell 生成居中文字单元格，可附加进位或借位宏。
- macroEmptyCell 生成空单元格；macroAnnotationCell 把已有定位宏包成 CELL。
- macroRightBottom 和 macroRightTop 分别生成右下、右上文字定位。
- macroBorrowDot 生成借位点。
- macroRow 默认右对齐；传入 left 才写入显式左对齐选项。
- macroLine 的 span 默认是 previous，也支持 longest 和 full。
- macroGrid 写入列数、尺寸、字号、内边距、自动配色、网格显示和无障碍标签。

## 4. 计算结果完整字段

### 4.1 加法

    interface AdditionColumnStep {
      columnFromRight: number
      addendDigits: string[]
      carryIn: number
      total: number
      resultDigit: string
      carryOut: number
    }

    interface AdditionComputation {
      addendDigits: string[]
      sumDigits: string
      steps: AdditionColumnStep[]
    }

columnFromRight 从个位 0 开始。addendDigits 是该列参与计算的数字；carryIn 和 carryOut 是列间进位；sumDigits 是不含布局信息的结果字符串。

### 4.2 减法

    interface SubtractionColumnStep {
      columnFromRight: number
      minuendDigit: string
      subtrahendDigit: string
      borrowIn: number
      minuendDisplay: string
      resultDigit: string
      borrowOut: number
    }

    interface SubtractionComputation {
      minuendDigits: string
      subtrahendDigits: string
      workingMinuendDigits: string
      workingSubtrahendDigits: string
      differenceDigits: string
      resultText: string
      isNegative: boolean
      steps: SubtractionColumnStep[]
    }

负结果时原始输入仍保存在 minuendDigits 和 subtrahendDigits；workingMinuendDigits 与 workingSubtrahendDigits 是为逐位求绝对值而使用的“大数减小数”过程。不要只读取 differenceDigits 判断符号。

### 4.3 乘法

    interface MultiplicationDigitStep {
      multiplicandDigitIndex: number
      multiplicandDigit: string
      multiplierDigit: string
      carryIn: number
      total: number
      resultDigit: string
      carryOut: number
    }

    interface MultiplicationPartialProduct {
      multiplierDigitIndex: number
      multiplierDigit: string
      shift: number
      value: string
      digitSteps: MultiplicationDigitStep[]
    }

    interface MultiplicationAdditionStep {
      columnFromRight: number
      addendDigits: string[]
      carryIn: number
      total: number
      resultDigit: string
      carryOut: number
    }

    interface MultiplicationTrailingZeroShortcut {
      trailingZeroCount: number
      significantMultiplierDigits: string
    }

    interface MultiplicationComputation {
      multiplicandDigits: string
      multiplierDigits: string
      operandsSwapped: boolean
      productDigits: string
      trailingZeroShortcut: MultiplicationTrailingZeroShortcut | null
      partialProducts: MultiplicationPartialProduct[]
      additionSteps: MultiplicationAdditionStep[]
    }

shift 是部分积相对个位的位移；digitSteps 是该部分积的逐位过程；additionSteps 是多个部分积相加的过程；operandsSwapped 记录内部是否交换了操作数以减少展示复杂度。

### 4.4 长除法

    type DivisionResultMode = 'decimal' | 'remainder'

    type QuotientToken =
      | { kind: 'digit'; digit: string; column: number }
      | { kind: 'decimalSeparator'; digit: '.'; column: number }

    interface LongDivisionStep {
      dividendColumn: number
      divisor: string
      quotientDigit: string
      partialDividend: string
      product: string
      remainder: string
    }

    interface DivisionComputation {
      divisorDigits: string
      dividendDigits: string
      quotientText: string
      quotientTokens: QuotientToken[]
      steps: LongDivisionStep[]
      remainder: string
      hasFraction: boolean
      fractionalDigitCount: number
      decimalFallback: boolean
      integerStartColumn: number
      digitColumnCount: number
    }

quotientTokens 适合布局器定位商位和小数点；steps 记录试商、部分被除数、乘积和余数；decimalFallback 表示有限小数模式达到限制后仍无法得到终止小数。integerStartColumn 和 digitColumnCount 用于除法版式对齐。

### 4.5 短除法

    type ShortDivisionMode =
      | 'factorization'
      | 'commonFactor'
      | 'baseConversion'

    interface ShortDivisionStep {
      divisor: string
      dividends: string[]
      quotients: string[]
      remainders: string[]
    }

    interface ShortDivisionInput {
      mode: ShortDivisionMode
      values: unknown[]
      targetBase?: unknown
    }

    interface FactorizationShortDivisionComputation {
      mode: 'factorization'
      inputValues: string[]
      steps: ShortDivisionStep[]
      finalValues: string[]
      divisors: string[]
      primeFactors: string[]
      factorizationText: string
      divisorCount: number
      divisorSum: string
    }

    interface CommonFactorShortDivisionComputation {
      mode: 'commonFactor'
      inputValues: string[]
      steps: ShortDivisionStep[]
      finalValues: string[]
      divisors: string[]
      gcd: string
      lcm: string
    }

    interface BaseConversionShortDivisionComputation {
      mode: 'baseConversion'
      inputValues: string[]
      steps: ShortDivisionStep[]
      finalValues: string[]
      targetBase: number
      remaindersBottomUp: string[]
      convertedText: string
    }

    type ShortDivisionComputation =
      | FactorizationShortDivisionComputation
      | CommonFactorShortDivisionComputation
      | BaseConversionShortDivisionComputation

短除法 steps 中的 remainders 只有进制转换实际使用；其他模式的余数为 '0'。baseConversion 的 convertedText 按目标进制输出，remaindersBottomUp 按短除法从下往上的读取顺序保存。

## 5. GridScene、几何和图元类型

    type GridTextHorizontalAlign = 'left' | 'center' | 'right'
    type GridTextVerticalAlign = 'top' | 'center' | 'bottom'
    type GridEdge = 'top' | 'right' | 'bottom' | 'left'

    interface GridTrack {
      id: string
      size: number
    }

    interface GridCellPosition {
      kind: 'cell'
      column: number
      row: number
      columnSpan?: number
      rowSpan?: number
    }

    interface GridIntersectionPosition {
      kind: 'intersection'
      columnLine: number
      rowLine: number
    }

    interface GridEdgePosition {
      kind: 'edge'
      column: number
      row: number
      edge: GridEdge
      columnSpan?: number
      rowSpan?: number
    }

    interface GridEdgeMidpointPosition {
      kind: 'edgeMidpoint'
      column: number
      row: number
      edge: GridEdge
      columnSpan?: number
      rowSpan?: number
    }

    type GridPosition =
      | GridCellPosition
      | GridIntersectionPosition
      | GridEdgePosition
      | GridEdgeMidpointPosition

    interface GridTextContent {
      kind: 'text'
      text: string
      styleToken?: string
      color?: string
      fontSizeRatio?: number
      horizontalAlign?: GridTextHorizontalAlign
      verticalAlign?: GridTextVerticalAlign
    }

    interface GridCornerContent {
      kind: 'corner'
      corner: 'bottomRight'
      radiusRatio: number
      color?: string
      thickness?: number
    }

    interface GridLineContent {
      kind: 'line'
      color?: string
      thickness?: number
    }

    type GridElementContent =
      | GridTextContent
      | GridCornerContent
      | GridLineContent

    interface GridElement {
      id: string
      position: GridPosition
      content: GridElementContent
      styleToken?: string
    }

    interface GridScene {
      columns: GridTrack[]
      rows: GridTrack[]
      padding: {
        top: number
        right: number
        bottom: number
        left: number
      }
      unitWidth: number
      unitHeight: number
      fontSize: number
      defaultTextStyleToken?: string
      textHorizontalAlign: GridTextHorizontalAlign
      textVerticalAlign: GridTextVerticalAlign
      elements: GridElement[]
      showGuideGrid: boolean
      ariaLabel: string
    }

    interface GridMetrics {
      width: number
      height: number
      columnOffsets: number[]
      rowOffsets: number[]
    }

    interface GridRect {
      left: number
      top: number
      width: number
      height: number
    }

    interface GridTextAnchor {
      x: number
      y: number
      horizontalAlign: GridTextHorizontalAlign
      verticalAlign: GridTextVerticalAlign
    }

GridPosition 是声明式位置：cell 表示单元格区域，intersection 表示轨道交点，edge 表示单元格边，edgeMidpoint 表示边中点。文本自然尺寸不会被强制裁剪；对齐和样式可以在图元上覆盖场景默认值。GridScene 不包含运算类型字段，渲染器不应根据 ariaLabel 或 styleToken 推断运算规则。

轨道可能是可变尺寸，因此几何查询必须先调用 resolveGridMetrics，再把结果传给 getGridPositionRect、getGridElementRect 和 getGridTextAnchor；不要手工用 unitWidth 和 unitHeight 推算跨轨道位置。

## 6. 宏 AST、编译器和类型

    interface MacroCall {
      kind: 'call'
      name: string
      arguments: MacroNode[]
    }

    interface MacroLiteral {
      kind: 'literal'
      value: string
    }

    interface MacroSymbol {
      kind: 'symbol'
      name: string
    }

    type MacroNode = MacroCall | MacroLiteral | MacroSymbol

    interface MacroStyle {
      color?: string
      thickness?: number
    }

    compileMacroAst(root: MacroCall): GridScene

parseMacro 适合从源码取得 AST；compileMacroAst 适合在已有 MacroCall 上直接编译。通常用户输入应先走 parseMacro，再调用 compileMacro；只有 AST 已经经过合法性保证时才直接使用 compileMacroAst。

## 7. 公开词表与主题常量

- BASIC_MACRO_NAMES：GRID、ROW、CELL、EMPTY、LINE、DIV、VALUE、STYLE、KV。
- BASIC_ZERO_ARGUMENT_MACROS：可省略空括号的基础宏集合，包括 LINE、EMPTY、STYLE、DIV。
- DEFAULT_LINE_STYLE：默认线宽配置，当前 thickness 为 2。
- SUGAR_MACRO_NAMES：LT、MT、RT、ML、MM、MR、LB、MB、RB、RBL、MTD、DOT、BRACKET、TBD、RBD、BBD、LBD。
- SUGAR_ZERO_ARGUMENT_MACROS：可省略空括号的边框、弯折和 MTD 宏集合。
- AUTO_COLOR_MAX_ROWS：自动配色最多支持 40 行。
- AUTO_COLOR_THEME：包含 rowText、carry、borrow、operators、decimal、rule、bracketRule 的固定主题对象。

这些常量适合宏编辑器做补全、语法高亮或能力提示。不要修改集合后把它当作包运行时配置；宏解析和编译仍以库内固定词表为准。

## 8. API 选择边界

- 仅计算：只导入 compute* 和对应结果类型。
- 自动竖式：优先 compute*、create*MacroSource、compileMacro、render*。
- 自定义宏：使用 macro* 辅助函数或直接写宏，再通过 parseMacro 和 compileMacro 校验。
- AST 编辑器：使用 createMacroAstInspection，不要从字符串偏移量自行猜图元位置。
- 只需要场景：使用 create*GridScene；需要源码可编辑性时改用 create*MacroSource。
- 只需要几何：使用 resolveGridMetrics 和 getGrid*，不要读取渲染器私有 DOM/CSS 坐标。
- 只需要 SVG：使用 renderSvgGrid；只需要浏览器交互：使用 renderDomGrid 并导入 CSS。

