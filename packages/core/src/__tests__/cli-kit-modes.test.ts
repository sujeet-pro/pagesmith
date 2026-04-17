import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import {
  CliError,
  assertValue,
  isInteractive,
  isNonInteractiveEnv,
  resolveInteractive,
} from '../cli-kit/index.js'

describe('isInteractive / isNonInteractiveEnv', () => {
  let savedCi: string | undefined
  let savedNonInteractive: string | undefined
  let savedStdoutTty: boolean
  let savedStdinTty: boolean

  beforeEach(() => {
    savedCi = process.env.CI
    savedNonInteractive = process.env.PAGESMITH_NON_INTERACTIVE
    savedStdoutTty = process.stdout.isTTY ?? false
    savedStdinTty = process.stdin.isTTY ?? false
    delete process.env.CI
    delete process.env.PAGESMITH_NON_INTERACTIVE
  })

  afterEach(() => {
    if (savedCi === undefined) delete process.env.CI
    else process.env.CI = savedCi
    if (savedNonInteractive === undefined) delete process.env.PAGESMITH_NON_INTERACTIVE
    else process.env.PAGESMITH_NON_INTERACTIVE = savedNonInteractive
    process.stdout.isTTY = savedStdoutTty
    process.stdin.isTTY = savedStdinTty
  })

  it('treats CI=1 as non-interactive', () => {
    process.stdout.isTTY = true
    process.stdin.isTTY = true
    process.env.CI = '1'
    expect(isNonInteractiveEnv()).toBe(true)
    expect(isInteractive()).toBe(false)
  })

  it('treats PAGESMITH_NON_INTERACTIVE=1 as non-interactive', () => {
    process.stdout.isTTY = true
    process.stdin.isTTY = true
    process.env.PAGESMITH_NON_INTERACTIVE = '1'
    expect(isNonInteractiveEnv()).toBe(true)
  })

  it('treats a missing TTY as non-interactive', () => {
    process.stdout.isTTY = false
    process.stdin.isTTY = true
    expect(isInteractive()).toBe(false)

    process.stdout.isTTY = true
    process.stdin.isTTY = false
    expect(isInteractive()).toBe(false)
  })

  it('reports interactive when both TTYs are present and no opt-out env var is set', () => {
    process.stdout.isTTY = true
    process.stdin.isTTY = true
    expect(isInteractive()).toBe(true)
  })
})

describe('resolveInteractive', () => {
  let savedCi: string | undefined
  let savedNonInteractive: string | undefined
  let savedStdoutTty: boolean
  let savedStdinTty: boolean

  beforeEach(() => {
    savedCi = process.env.CI
    savedNonInteractive = process.env.PAGESMITH_NON_INTERACTIVE
    savedStdoutTty = process.stdout.isTTY ?? false
    savedStdinTty = process.stdin.isTTY ?? false
    delete process.env.CI
    delete process.env.PAGESMITH_NON_INTERACTIVE
    process.stdout.isTTY = true
    process.stdin.isTTY = true
  })

  afterEach(() => {
    if (savedCi === undefined) delete process.env.CI
    else process.env.CI = savedCi
    if (savedNonInteractive === undefined) delete process.env.PAGESMITH_NON_INTERACTIVE
    else process.env.PAGESMITH_NON_INTERACTIVE = savedNonInteractive
    process.stdout.isTTY = savedStdoutTty
    process.stdin.isTTY = savedStdinTty
  })

  it('--yes wins over everything', () => {
    expect(resolveInteractive({ yes: true })).toEqual({ interactive: false, reason: '--yes' })
    expect(resolveInteractive({ yes: true, interactive: true })).toEqual({
      interactive: false,
      reason: '--yes',
    })
  })

  it('--non-interactive disables prompts', () => {
    expect(resolveInteractive({ nonInteractive: true })).toEqual({
      interactive: false,
      reason: '--non-interactive',
    })
  })

  it('--interactive forces prompts when a TTY is attached', () => {
    expect(resolveInteractive({ interactive: true })).toEqual({
      interactive: true,
      reason: '--interactive',
    })
  })

  it('--interactive errors when no TTY is available', () => {
    process.stdout.isTTY = false
    expect(() => resolveInteractive({ interactive: true })).toThrow(/--interactive requires a TTY/)
  })

  it('CI=1 reports CI=1 as the reason', () => {
    process.env.CI = '1'
    expect(resolveInteractive()).toEqual({ interactive: false, reason: 'CI=1' })
  })

  it('falls back to TTY auto-detection', () => {
    expect(resolveInteractive()).toEqual({ interactive: true, reason: 'TTY' })
  })
})

describe('assertValue', () => {
  it('returns the value untouched when provided', () => {
    expect(assertValue('foo', { label: 'Project name', flag: '--name', configKey: 'name' })).toBe(
      'foo',
    )
  })

  it('throws CliError when the value is missing', () => {
    expect(() =>
      assertValue(undefined, { label: 'Project name', flag: '--name', configKey: 'name' }),
    ).toThrow(CliError)

    try {
      assertValue('', {
        label: 'Project name',
        flag: '--name',
        envVar: 'PAGESMITH_NAME',
        configKey: 'name',
      })
    } catch (err) {
      expect(err).toBeInstanceOf(CliError)
      expect((err as Error).message).toContain('Project name is required in non-interactive mode')
      expect((err as CliError).hint).toContain('--name')
      expect((err as CliError).hint).toContain('$PAGESMITH_NAME')
      expect((err as CliError).hint).toContain('name in pagesmith.config.')
    }
  })
})
