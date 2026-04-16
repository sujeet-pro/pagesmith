/**
 * Thin wrappers around `@clack/prompts` with a consistent cancel-handling
 * policy and a TTY-aware non-interactive fallback.
 *
 * Rules:
 * - `isInteractive()` is false when stdout is not a TTY, `CI` is set, or the
 *   caller passed `--yes` (the caller handles the flag). Callers should then
 *   skip prompts and rely on flags or config defaults.
 * - On user cancel (Ctrl+C), we call `cancel()` and exit 130 to match POSIX.
 */

import {
  cancel,
  confirm as clackConfirm,
  intro as clackIntro,
  isCancel,
  multiselect as clackMultiselect,
  outro as clackOutro,
  select as clackSelect,
  text as clackText,
} from '@clack/prompts'

export function isInteractive(): boolean {
  if (process.env.CI) return false
  if (process.env.PAGESMITH_NON_INTERACTIVE) return false
  return Boolean(process.stdout.isTTY && process.stdin.isTTY)
}

function exitOnCancel<T>(value: T | symbol): T {
  if (isCancel(value)) {
    cancel('Cancelled.')
    process.exit(130)
  }
  return value as T
}

export function intro(message: string): void {
  clackIntro(message)
}

export function outro(message: string): void {
  clackOutro(message)
}

export async function promptText(options: {
  message: string
  placeholder?: string
  defaultValue?: string
  validate?: (value: string | undefined) => string | Error | undefined
}): Promise<string> {
  const value = await clackText({
    message: options.message,
    placeholder: options.placeholder,
    defaultValue: options.defaultValue,
    validate: options.validate,
  })
  return exitOnCancel(value)
}

export async function promptConfirm(options: {
  message: string
  initialValue?: boolean
}): Promise<boolean> {
  const value = await clackConfirm({
    message: options.message,
    initialValue: options.initialValue ?? true,
  })
  return exitOnCancel(value)
}

type PromptOption<T> = { value: T; label?: string; hint?: string }

export async function promptSelect<T extends string>(options: {
  message: string
  options: Array<PromptOption<T>>
  initialValue?: T
}): Promise<T> {
  // clack's `Option<T>` overload uses a conditional type on `Value extends Primitive`
  // that does not re-narrow through our generic, so we cast the option array once here.
  const value = await clackSelect({
    message: options.message,
    options: options.options as unknown as Parameters<typeof clackSelect<T>>[0]['options'],
    initialValue: options.initialValue,
  })
  return exitOnCancel(value) as T
}

export async function promptMultiselect<T extends string>(options: {
  message: string
  options: Array<PromptOption<T>>
  initialValues?: T[]
  required?: boolean
}): Promise<T[]> {
  const value = await clackMultiselect({
    message: options.message,
    options: options.options as unknown as Parameters<typeof clackMultiselect<T>>[0]['options'],
    initialValues: options.initialValues,
    required: options.required ?? false,
  })
  return exitOnCancel(value) as T[]
}
