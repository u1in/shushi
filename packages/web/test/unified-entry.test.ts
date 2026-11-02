import { describe, expect, it } from 'vitest'
import {
  compileMacro,
  computeAddition,
  createAdditionMacroSource,
  renderDomGrid,
} from '@u1in/shushi-core'

describe('统一 npm 入口', () => {
  it('汇总计算、布局、宏编译和渲染 API', () => {
    const computation = computeAddition('2', '3')
    const source = createAdditionMacroSource(computation)
    const scene = compileMacro(source)

    expect(scene.rows.length).toBeGreaterThan(0)
    expect(typeof renderDomGrid).toBe('function')
  })
})
