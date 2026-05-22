export type BrainState =
  | 'racing_thoughts'
  | 'sadness_healing'
  | 'sadness'
  | 'fatigue'
  | 'anger'
  | 'anxiety'

export type PracticeKind =
  | 'thought-labeling'
  | 'self-soothe'
  | 'action-card'
  | 'rest-path'
  | 'cooldown'
  | 'breathing'

export interface PracticeStep {
  title: string
  body: string
  cue: string
}

export interface EvidenceRef {
  label: string
  url: string
  summary: string
}

export interface Intervention {
  id: BrainState
  title: string
  subtitle: string
  triggerLabels: string[]
  durationMinutes: [number, number]
  defaultDuration: number
  kind: PracticeKind
  accent: string
  steps: PracticeStep[]
  evidence: EvidenceRef[]
  cautions: string[]
}

export interface SessionResult {
  stateId: BrainState
  beforeScore: number
  afterScore: number
  completedAt: string
  note?: string
}
