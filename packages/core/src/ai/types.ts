export type AiAssistant = 'claude' | 'codex' | 'gemini'
export type AiInstallScope = 'project' | 'user'
export type AiInstallProfile = 'default' | 'docs'
export type AiArtifactKind =
  | 'memory'
  | 'skill'
  | 'llms'
  | 'llms-full'
  | 'markdown-guidelines'
  | 'update-docs'
  | 'update-all-docs'
export type AiWriteMode = 'merge' | 'replace'
export type AiInstallStatus = 'written' | 'merged' | 'replaced' | 'unchanged'

export type AiArtifact = {
  assistant?: AiAssistant
  kind: AiArtifactKind
  path: string
  content: string
  mode: AiWriteMode
  label: string
}

export type AiInstallResult = {
  assistant?: AiAssistant
  kind: AiArtifactKind
  path: string
  status: AiInstallStatus
  label: string
}

export type AiInstallOptions = {
  assistants?: AiAssistant[] | 'all'
  scope?: AiInstallScope
  profile?: AiInstallProfile
  cwd?: string
  homeDir?: string
  includeLlms?: boolean
  force?: boolean
  skillName?: string
  /** When true, return planned writes without actually writing files. */
  dryRun?: boolean
}
