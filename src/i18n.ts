import { interventions } from './data/interventions'
import type { BrainState, Intervention } from './types'

export type AppLanguage = 'zh' | 'en'

export const LANGUAGE_KEY = 'brainmanager.language.v1'

export const uiCopy = {
  zh: {
    languageName: '中文',
    languageToggle: 'English',
    switchLanguage: '切换到英文',
    homeTitle: '现在脑子是什么状态？',
    homeCopy: '这是一个个人自助工具。它不判断病情，也不保证结果，只帮你用短练习记录前后变化。',
    chooseState: '选择当前状态',
    localRecords: '本地记录',
    recentSessions: '最近 5 次',
    clearRecords: '清除本地记录',
    emptyHistory: '完成一轮后，这里会显示前后评分变化。',
    contactAuthor: '联系作者',
    currentEntry: '当前入口',
    whyDesigned: '为什么这样设计',
    before: '开始前',
    directStart: '直接开始降噪',
    scoreNow: '现在主观状态打几分？',
    quickStart: '分数已经默认填好。现在不用分析自己，先做一轮短动作。',
    startDenoise: '开始降噪',
    startRound: '开始这一轮',
    practicing: '练习中',
    finishRound: '完成本轮',
    backHome: '返回首页',
    streamGameLabel: '静流脑内降噪游戏',
    streamStart: '开始',
    returnReality: '回到现实',
    pause: '暂停',
    resume: '继续',
    denoiseHint: '尝试让乱窜的噪声慢慢停下来',
    forceTip: '按住左键牵引',
    actionCard: '行动卡',
    drawAnother: '换一张卡',
    actionNote: '这组卡不处理任务，只让身体、环境或感官动一点。抽到不合适就换。',
    after: '结束后',
    roundEnded: '这一轮结束了',
    scoreAgain: '现在再打一次分',
    afterDenoiseCopy: '不用写总结。只看一下现在比开始时有没有松一点。',
    optionalThoughtNote: '想留一句就写，不想写直接保存',
    optionalNote: '可选记录',
    notePlaceholder: '例如：脑子没停，但没那么追着想法跑。',
    restart: '再来一轮',
    saveAndHome: '保存并回首页',
    safetyTitle: '先暂停这个练习',
    safetyBody: '如果此刻可能伤害自己，请立刻联系身边可信任的人或当地急救电话。在美国可拨打或短信 988，也可以访问',
    scoreAria: '当前状态评分',
    scoreLow: '0 很糟',
    scoreHigh: '10 很稳',
    focusMode: '关注方式',
    countMode: '数节奏',
    visualMode: '只看圆环',
    heatAria: '当前热度',
    heatLow: '温度已经降下来了',
    heatHigh: '先把热度往下调',
    heatCopy: '慢呼气、松肩颈，再把冲动砸成碎块。',
    ventGameAria: '怒气粉碎机小游戏',
    ventGameTitle: '怒气粉碎机',
    ventGameHint: '拖住重锤，甩向热块。轻点不生效。',
    ventGameMiss: '速度太慢，甩动重锤再撞上去。',
    ventGameImpact: '撞裂了，再甩一次。',
    ventGameShatter: '砸碎了，拖向下一块。',
    ventGameDone: '热块已经清空。',
    inhale: '吸 1 2 3 4',
    exhale: '呼 1 2 3 4 5 6',
    watchRing: '只看圆环',
    noCount: '不用数，不屏息。',
    selfSootheStageLabel: '选择伤心自愈关卡',
    harborAria: '移动暖灯接住泪滴，把暖珠带到裂片旁',
    echoAria: '移动暖光整理回声',
    bridgeAria: '移动暖光搭起星桥',
    hearthAria: '移动暖光守住暖炉',
    gardenAria: '移动暖光让花园慢慢亮起',
    sootheLabels: {
      harbor: '接泪',
      weave: '回声',
      garden: '花园',
      bridge: '星桥',
      hearth: '暖炉',
    },
    restItems: ['眼睛离开屏幕 20 秒', '肩颈慢慢转一圈', '看自然画面或窗外', '手腕和手指放松'],
    coolingItems: ['做一次慢呼气', '放松肩膀', '把回复延迟 10 分钟', '下巴松开'],
    scoreLabels: ['很难受', '偏乱', '一般', '比较稳', '很稳'],
  },
  en: {
    languageName: 'English',
    languageToggle: '中文',
    switchLanguage: 'Switch to Chinese',
    homeTitle: 'What is your mind like right now?',
    homeCopy: 'A local self-help tool. It does not diagnose or promise results; it helps you try short practices and record before/after changes.',
    chooseState: 'Choose current state',
    localRecords: 'Local records',
    recentSessions: 'Latest 5',
    clearRecords: 'Clear local records',
    emptyHistory: 'After a round, before/after score changes will appear here.',
    contactAuthor: 'Contact author',
    currentEntry: 'Current entry',
    whyDesigned: 'Why this design',
    before: 'Before',
    directStart: 'Start denoising',
    scoreNow: 'How steady does it feel right now?',
    quickStart: 'The score is prefilled. No need to analyze yourself; start with one short round.',
    startDenoise: 'Start denoising',
    startRound: 'Start this round',
    practicing: 'Practicing',
    finishRound: 'Finish round',
    backHome: 'Back home',
    streamGameLabel: 'Quiet Stream mind denoising game',
    streamStart: 'Start',
    returnReality: 'Return',
    pause: 'Pause',
    resume: 'Resume',
    denoiseHint: 'Try slowing the restless noise down',
    forceTip: 'Hold left to pull',
    actionCard: 'Action card',
    drawAnother: 'Draw another',
    actionNote: 'These cards do not handle tasks. They only nudge the body, senses, or environment. Draw again if one does not fit.',
    after: 'After',
    roundEnded: 'This round is done',
    scoreAgain: 'Score it once more',
    afterDenoiseCopy: 'No summary needed. Just notice whether things feel a little looser than before.',
    optionalThoughtNote: 'Leave one line if you want; otherwise save directly',
    optionalNote: 'Optional note',
    notePlaceholder: 'Example: My mind kept running, but I chased thoughts a little less.',
    restart: 'Another round',
    saveAndHome: 'Save and return',
    safetyTitle: 'Pause this practice',
    safetyBody: 'If you might hurt yourself right now, contact a trusted person or local emergency service immediately. In the US, call or text 988, or visit',
    scoreAria: 'Current state score',
    scoreLow: '0 awful',
    scoreHigh: '10 steady',
    focusMode: 'Focus mode',
    countMode: 'Count rhythm',
    visualMode: 'Watch ring',
    heatAria: 'Current heat',
    heatLow: 'The heat has come down',
    heatHigh: 'Bring the heat down first',
    heatCopy: 'Slow exhale, release shoulders and neck, then smash the impulse into pieces.',
    ventGameAria: 'Anger crusher mini-game',
    ventGameTitle: 'Anger crusher',
    ventGameHint: 'Drag the hammer and whip it into the heat block. Taps do nothing.',
    ventGameMiss: 'Too slow. Swing the hammer into it.',
    ventGameImpact: 'Cracked it. Swing again.',
    ventGameShatter: 'Shattered. Drag toward the next block.',
    ventGameDone: 'The heat blocks are cleared.',
    inhale: 'In 1 2 3 4',
    exhale: 'Out 1 2 3 4 5 6',
    watchRing: 'Watch the ring',
    noCount: 'No counting, no breath holding.',
    selfSootheStageLabel: 'Choose sadness-healing level',
    harborAria: 'Move the warm light to catch tears and carry warm beads to the shards',
    echoAria: 'Move warm light to settle echoes',
    bridgeAria: 'Move warm light to build the star bridge',
    hearthAria: 'Move warm light to tend the hearth',
    gardenAria: 'Move warm light to brighten the garden',
    sootheLabels: {
      harbor: 'Tears',
      weave: 'Echo',
      garden: 'Garden',
      bridge: 'Stars',
      hearth: 'Hearth',
    },
    restItems: ['Eyes off screen for 20 seconds', 'Slow shoulder and neck circle', 'Look at nature or outside', 'Relax wrists and fingers'],
    coolingItems: ['Do one slow exhale', 'Relax shoulders', 'Delay replies for 10 minutes', 'Release the jaw'],
    scoreLabels: ['rough', 'unsettled', 'okay', 'steadier', 'steady'],
  },
} as const

export type UiCopy = (typeof uiCopy)[AppLanguage]

const interventionEnglish: Record<BrainState, Pick<Intervention, 'title' | 'subtitle' | 'triggerLabels' | 'steps' | 'evidence' | 'cautions'>> = {
  racing_thoughts: {
    title: 'Mind Denoise',
    subtitle: 'Noisy, restless, hard to focus',
    triggerLabels: ['noisy mind', 'can’t stop', 'restless', 'hard to focus'],
    steps: [
      { title: 'Move near noise', body: 'Guide the small light boat near jumping, broken, and swimming noise.', cue: 'No need to explain it; let the scene slow down.' },
      { title: 'Pause briefly', body: 'When you stop, a rest ring spreads and nearby noise softens.', cue: 'Not operating is also organizing.' },
      { title: 'Enter quiet flow', body: 'As noise joins the current, the scene becomes steadier.', cue: 'Toward the end, you can do almost nothing.' },
    ],
    evidence: [
      { label: 'Detached mindfulness systematic review and meta-analysis', url: 'https://www.frontiersin.org/journals/psychiatry/articles/10.3389/fpsyt.2026.1771705/full', summary: 'Detached mindfulness reduces continued processing and involvement, which is linked with lower rumination.' },
      { label: 'Mindfulness-based interventions for ruminative thinking', url: 'https://www.sciencedirect.com/science/article/abs/pii/S0165032722012137', summary: 'A meta-analysis of 61 randomized trials found mindfulness-based interventions can improve ruminative thinking.' },
    ],
    cautions: ['Do not ask users to explain thoughts. This module only uses movement, pausing, and visual transformation.'],
  },
  sadness_healing: {
    title: 'Sadness Healing',
    subtitle: 'Sad, hurt, wanting to be held',
    triggerLabels: ['sad', 'hurt', 'tearful', 'empty'],
    steps: [
      { title: 'Move the warm light', body: 'Move the warm light near falling tears; they become warm beads that follow you.', cue: 'No need to explain why it hurts; first let it be held.' },
      { title: 'Repair shards', body: 'Carry warm beads near cool shards; the beads flow in automatically.', cue: 'Sadness does not have to disappear immediately. It can first be received.' },
      { title: 'Warm the scene', body: 'Repaired shards return to the center and the heart light brightens little by little.', cue: 'No need to finish perfectly. A little light counts.' },
    ],
    evidence: [
      { label: 'Self-compassion interventions meta-analysis', url: 'https://pubmed.ncbi.nlm.nih.gov/37362192/', summary: 'Meta-analytic evidence suggests self-compassion interventions can improve depression, anxiety, and stress symptoms.' },
      { label: 'Expressive writing long-term meta-analysis', url: 'https://pubmed.ncbi.nlm.nih.gov/36536513/', summary: 'Expressive writing has meta-analytic support for longer-term effects; this module keeps only a very low-burden version.' },
      { label: 'Affect labeling and emotional distress', url: 'https://pubmed.ncbi.nlm.nih.gov/21534661/', summary: 'Affect labeling can reduce subjective distress compared with passive viewing; this module uses lightweight labels and interaction.' },
    ],
    cautions: ['This module does not ask you to replay the event or fully write out the emotion. If distress is intense, contact real-life support.'],
  },
  sadness: {
    title: 'Micro Action Cards',
    subtitle: 'No motivation, low energy, hard to move',
    triggerLabels: ['no motivation', 'stuck', 'don’t want to move', 'low energy'],
    steps: [
      { title: 'Draw a card', body: 'Cards suggest tiny body, light, hydration, music, nature, or connection actions.', cue: 'Do not handle tasks; nudge body and environment first.' },
      { title: 'Do just enough', body: 'Use only an action that truly feels possible right now.', cue: 'Low energy does not need proof.' },
      { title: 'Score after', body: 'Do not chase happiness; just notice whether body or mood changed a little.', cue: 'A small change is useful data.' },
    ],
    evidence: [
      { label: 'Cochrane behavioural activation review', url: 'https://www.cochrane.org/evidence/CD013305_behavioural-activation-therapy-depression-adults', summary: 'Behavioural activation schedules meaningful or pleasant activities; a review included 53 RCTs and 5495 people.' },
      { label: 'Exercise for depression network meta-analysis', url: 'https://www.bmj.com/content/384/bmj-2023-075847', summary: 'A 2024 BMJ network meta-analysis found walking, yoga, and strength training were linked with lower depression symptoms.' },
      { label: 'Bright light therapy meta-analysis', url: 'https://jamanetwork.com/journals/jamapsychiatry/fullarticle/2824482', summary: 'A 2024 JAMA Psychiatry review found bright light as an adjunct was linked with better remission and response.' },
      { label: 'Music therapy RCT meta-analysis', url: 'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0240862', summary: 'A meta-analysis of 55 randomized trials found music therapy and music listening were associated with lower depression symptoms.' },
    ],
    cautions: ['If a card feels too hard, draw another one. Do not force it.'],
  },
  fatigue: {
    title: 'Recovery Path',
    subtitle: 'Mental fatigue, information overload',
    triggerLabels: ['tired eyes', 'too much input', 'stuck', 'want off screen'],
    steps: [
      { title: 'Leave work stimuli', body: 'Let your eyes leave the current task and message stream first.', cue: 'Rest is not switching to another high-load task.' },
      { title: 'Lower body tension', body: 'Do gentle stretching, especially shoulders, neck, and wrists.', cue: 'Move slowly. No performance needed.' },
      { title: 'Look at nature', body: 'Rest attention on a natural scene, window view, or plant.', cue: 'No memory task, no analysis, just looking.' },
    ],
    evidence: [
      { label: 'Micro-breaks systematic review and meta-analysis', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9432722/', summary: 'Micro-breaks show small but significant effects on vitality and fatigue reduction.' },
      { label: 'Nature exposure and attention restoration meta-analysis', url: 'https://www.sciencedirect.com/science/article/pii/S027249442500115X', summary: 'Nature exposure shows more reliable benefits for working memory and attentional control than non-natural settings.' },
    ],
    cautions: ['Do not add memory tasks, reaction tasks, or content scrolling to this module.'],
  },
  anger: {
    title: 'Cooling Dashboard',
    subtitle: 'Angry, heated, about to react',
    triggerLabels: ['want to hit back', 'chest heat', 'jaw tight', 'about to send'],
    steps: [
      { title: 'Lower arousal first', body: 'Use slow exhale and relaxed shoulders/neck to bring body heat down.', cue: 'Drag the hammer into heat blocks. Taps do not count.' },
      { title: 'Delay response', body: 'Add waiting time before replies, arguments, or decisions.', cue: 'Move your hand away from the send button first.' },
      { title: 'Then decide', body: 'When the body is less hot, decide whether to handle the event.', cue: 'Cooling down is not surrender; it keeps options open.' },
    ],
    evidence: [
      { label: 'Anger arousal meta-analysis', url: 'https://www.sciencedirect.com/science/article/pii/S0272735824000357', summary: 'A meta-analysis of 154 studies and 10189 participants found arousal-lowering activities reduce anger and aggression.' },
    ],
    cautions: ['Do not use frantic clicking, yelling, hitting, or intense running here. High-arousal venting may maintain anger.'],
  },
  anxiety: {
    title: 'Breathing Sync',
    subtitle: 'Anxious, tense, high pressure',
    triggerLabels: ['tense', 'fast heartbeat', 'worried', 'restless'],
    steps: [
      { title: 'Follow a slow rhythm', body: 'Default is about 6 breaths per minute, without breath holding.', cue: 'Just make the exhale a little slower than usual.' },
      { title: 'Choose focus style', body: 'Count the rhythm or simply watch the ring change.', cue: 'If counting makes anxiety worse, switch to watching.' },
      { title: 'Score after', body: 'Record pressure change instead of chasing perfect calm.', cue: 'A small drop is still useful evidence.' },
    ],
    evidence: [
      { label: 'Breathwork RCT meta-analysis', url: 'https://www.nature.com/articles/s41598-022-27247-y', summary: 'A meta-analysis of randomized trials found breathwork has small-to-medium effects on subjective stress, anxiety, and depression; evidence should be interpreted cautiously.' },
    ],
    cautions: ['If focusing on breath feels worse, switch to watching the ring or stop this round.'],
  },
}

export const englishActionDeck = [
  { lane: 'Body wake-up', title: 'Feet on floor', body: 'Place both feet on the floor. Gently curl and release your toes.', done: 'Repeat 5 times.' },
  { lane: 'Body wake-up', title: 'Stand up', body: 'Move from sitting to standing. You do not have to do anything else.', done: 'Stand steady for 10 seconds.' },
  { lane: 'Body wake-up', title: 'Drop shoulders', body: 'Lift your shoulders, then let them slowly drop.', done: 'Do 6 rounds.' },
  { lane: 'Sensory reset', title: 'Warm hands', body: 'Wash or wipe your hands with warm water and notice warmth in your palms.', done: 'Stop when your hands feel warmer.' },
  { lane: 'Sensory reset', title: 'Touch texture', body: 'Touch fabric, a cup, a desk, or the wall.', done: 'Notice texture for 20 seconds.' },
  { lane: 'Hydration', title: 'Three sips', body: 'Drink three small sips of water. Pause before swallowing each one.', done: 'Finish 3 sips.' },
  { lane: 'Light', title: 'Change the light', body: 'Open curtains, turn on a lamp, or soften screen brightness.', done: 'A small light change is enough.' },
  { lane: 'Sound', title: 'Play one sound', body: 'Play water sound, white noise, quiet music, or a soft background track.', done: 'Listen for 60 seconds.' },
  { lane: 'Micro connection', title: 'Send one emoji', body: 'Send one emoji or punctuation mark to someone familiar. No explanation needed.', done: 'Sending or drafting both count.' },
  { lane: 'Tiny pleasant', title: 'Hold something soft', body: 'Pick up a pillow, towel, jacket, or anything soft.', done: 'Hold it for 20 seconds.' },
  { lane: 'Environment', title: 'Open air', body: 'Open a window or door, or let air move in the room.', done: 'A little airflow is enough.' },
  { lane: 'Nature contact', title: 'Find green', body: 'Look at a plant, sky, tree shadow, or a nature image.', done: 'Look for 30 seconds.' },
  { lane: 'Body wake-up', title: 'Slow walk', body: 'Walk slowly in the room, hallway, or outside.', done: 'Walk for 5 minutes.' },
  { lane: 'Sound', title: 'Hum quietly', body: 'Hum along with music without trying to sound good.', done: 'Hum for 30 seconds.' },
  { lane: 'Tiny pleasant', title: 'One small bite', body: 'Eat one easy bite of something.', done: 'One bite counts.' },
  { lane: 'Rest recovery', title: 'Slow exhale', body: 'Do not count breaths. Just make each exhale a little slower.', done: 'Do 10 slow exhales.' },
]

export function loadLanguage(): AppLanguage {
  try {
    return localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'zh'
  } catch {
    return 'zh'
  }
}

export function scoreLabel(score: number, language: AppLanguage) {
  const labels = uiCopy[language].scoreLabels
  if (score <= 2) return labels[0]
  if (score <= 4) return labels[1]
  if (score <= 6) return labels[2]
  if (score <= 8) return labels[3]
  return labels[4]
}

export function localizeInterventions(language: AppLanguage) {
  const localized = interventions.map((intervention) =>
    language === 'zh' ? intervention : { ...intervention, ...interventionEnglish[intervention.id] },
  )
  return {
    interventions: localized,
    interventionsById: Object.fromEntries(
      localized.map((intervention) => [intervention.id, intervention]),
    ) as Record<BrainState, Intervention>,
  }
}
