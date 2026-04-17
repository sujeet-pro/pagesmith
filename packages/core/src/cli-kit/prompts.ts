/**
 * Thin, opinionated wrappers around `@clack/prompts` shared by every Pagesmith CLI.
 *
 * Goals:
 *   - One cancel-handling policy: any prompt cancelled with Ctrl+C calls
 *     `cancel('Cancelled.')` and exits the process with code 130 (POSIX SIGINT).
 *   - Re-export the most useful clack helpers so command files can import a
 *     single module and follow modern clack patterns: `intro`, `outro`,
 *     `note`, `log.*`, `spinner`, `tasks`, `group`.
 *   - Keep the typed wrappers narrow so call-sites don't touch clack's
 *     `Symbol`-typed cancel returns directly.
 */

import {
  cancel,
  confirm as clackConfirm,
  group as clackGroup,
  intro as clackIntro,
  isCancel,
  log as clackLog,
  multiselect as clackMultiselect,
  note as clackNote,
  outro as clackOutro,
  select as clackSelect,
  spinner as clackSpinner,
  tasks as clackTasks,
  text as clackText,
} from '@clack/prompts'

export {
  cancel,
  isCancel,
  clackLog as log,
  clackNote as note,
  clackSpinner as spinner,
  clackTasks as tasks,
}

export function intro(message: string): void {
  clackIntro(message)
}

export function outro(message: string): void {
  clackOutro(message)
}

function exitOnCancel<T>(value: T | symbol): T {
  if (isCancel(value)) {
    cancel('Cancelled.')
    process.exit(130)
  }
  return value as T
}

export type TextPromptOptions = {
  message: string
  placeholder?: string
  defaultValue?: string
  validate?: (value: string | undefined) => string | Error | undefined
}

export async function promptText(options: TextPromptOptions): Promise<string> {
  const value = await clackText({
    message: options.message,
    placeholder: options.placeholder,
    defaultValue: options.defaultValue,
    validate: options.validate,
  })
  return exitOnCancel(value)
}

export type ConfirmPromptOptions = {
  message: string
  initialValue?: boolean
}

export async function promptConfirm(options: ConfirmPromptOptions): Promise<boolean> {
  const value = await clackConfirm({
    message: options.message,
    initialValue: options.initialValue ?? true,
  })
  return exitOnCancel(value)
}

export type SelectOption<T> = { value: T; label?: string; hint?: string }

export type SelectPromptOptions<T extends string> = {
  message: string
  options: Array<SelectOption<T>>
  initialValue?: T
}

export async function promptSelect<T extends string>(options: SelectPromptOptions<T>): Promise<T> {
  const value = await clackSelect({
    message: options.message,
    options: options.options as unknown as Parameters<typeof clackSelect<T>>[0]['options'],
    initialValue: options.initialValue,
  })
  return exitOnCancel(value) as T
}

export type MultiselectPromptOptions<T extends string> = {
  message: string
  options: Array<SelectOption<T>>
  initialValues?: T[]
  required?: boolean
}

export async function promptMultiselect<T extends string>(
  options: MultiselectPromptOptions<T>,
): Promise<T[]> {
  const value = await clackMultiselect({
    message: options.message,
    options: options.options as unknown as Parameters<typeof clackMultiselect<T>>[0]['options'],
    initialValues: options.initialValues,
    required: options.required ?? false,
  })
  return exitOnCancel(value) as T[]
}

/**
 * Sequential prompt group. The provided record is passed straight through to
 * clack's `group()`; we only keep the cancel-handling policy consistent by
 * intercepting cancel results in the typed wrappers above.
 */
export const group = clackGroup
