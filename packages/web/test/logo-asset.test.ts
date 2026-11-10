import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const logoSource = readFileSync(new URL('../../core/assets/shushi-logo.svg', import.meta.url), 'utf8')
const darkLogoSource = readFileSync(new URL('../../core/assets/shushi-logo-dark.svg', import.meta.url), 'utf8')

describe('Shushi logo asset', () => {
  it('声明 64x64 的固有尺寸', () => {
    expect(logoSource).toContain('width="64" height="64"')
    expect(darkLogoSource).toContain('width="64" height="64"')
  })

  it('固定使用 Shushi 品牌色', () => {
    expect(logoSource).toContain('fill="#ffffff"')
    expect(logoSource).toContain('stroke="#0f172a"')
    expect(logoSource).toContain('fill="#4166b6"')
    expect(logoSource).not.toContain('var(--')
  })

  it('提供固定品牌色的深色版本', () => {
    expect(darkLogoSource).toContain('fill="#0f172a"')
    expect(darkLogoSource).toContain('stroke="#f8fafc"')
    expect(darkLogoSource).toContain('fill="#8db4ff"')
    expect(darkLogoSource).not.toContain('var(--')
  })
})
