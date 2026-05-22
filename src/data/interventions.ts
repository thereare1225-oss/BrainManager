import type { Intervention } from '../types'

export const interventions: Intervention[] = [
  {
    id: 'racing_thoughts',
    title: '脑内降噪',
    subtitle: '脑内很吵、浮躁、不集中',
    triggerLabels: ['脑内很吵', '停不下来', '浮躁', '难以集中'],
    durationMinutes: [8, 8],
    defaultDuration: 8,
    kind: 'thought-labeling',
    accent: '#2f7f8f',
    steps: [
      {
        title: '靠近噪声',
        body: '移动小光舟靠近跳动、断裂和游动的噪声。',
        cue: '不用想原因，让画面自己变慢。',
      },
      {
        title: '停一会儿',
        body: '停住后静息圈会扩散，附近的噪声会变柔。',
        cue: '不操作也在整理。',
      },
      {
        title: '进入静流',
        body: '噪声融入水流后，画面会自动漂下去。',
        cue: '最后可以什么都不做。',
      },
    ],
    evidence: [
      {
        label: 'Detached mindfulness systematic review and meta-analysis',
        url: 'https://www.frontiersin.org/journals/psychiatry/articles/10.3389/fpsyt.2026.1771705/full',
        summary: '脱离式正念强调减少继续加工和卷入，与反刍降低相关。',
      },
      {
        label: 'Mindfulness-based interventions for ruminative thinking',
        url: 'https://www.sciencedirect.com/science/article/abs/pii/S0165032722012137',
        summary: '61 项随机对照研究的元分析显示，正念干预可改善反刍思维。',
      },
    ],
    cautions: ['不要要求用户解释想法。这个模块只做移动、停留和视觉转化，不做复盘。'],
  },
  {
    id: 'sadness_healing',
    title: '伤心自愈',
    subtitle: '难过、委屈、想被接住',
    triggerLabels: ['伤心', '委屈', '想哭', '心里空'],
    durationMinutes: [3, 8],
    defaultDuration: 5,
    kind: 'self-soothe',
    accent: '#b86b72',
    steps: [
      {
        title: '移动暖灯',
        body: '把暖灯移到雨滴旁，雨滴会变成跟随你的暖珠。',
        cue: '不用解释原因，先把难受接住。',
      },
      {
        title: '修补裂片',
        body: '带着暖珠靠近冷色裂片，暖珠会自动流进去。',
        cue: '伤心不是要立刻消失，而是先被接住。',
      },
      {
        title: '让画面变暖',
        body: '裂片被修好后会回到中心，心灯一点点亮起来。',
        cue: '不用追求完成，亮一点也算数。',
      },
    ],
    evidence: [
      {
        label: 'Self-compassion interventions meta-analysis',
        url: 'https://pubmed.ncbi.nlm.nih.gov/37362192/',
        summary: '自我慈悲干预的随机对照研究元分析显示，对抑郁、焦虑和压力症状有改善趋势。',
      },
      {
        label: 'Expressive writing long-term meta-analysis',
        url: 'https://pubmed.ncbi.nlm.nih.gov/36536513/',
        summary: '表达性书写对抑郁、焦虑和压力的长期随访效果有元分析支持，但本模块只保留低负担的一句话版本。',
      },
      {
        label: 'Affect labeling and emotional distress',
        url: 'https://pubmed.ncbi.nlm.nih.gov/21534661/',
        summary: '情绪标记研究显示，用词标记负性情绪相较被动观看可降低主观痛苦；本模块用可点选短标签降低输入负担。',
      },
    ],
    cautions: ['这个模块不要求复盘事件，也不要求把情绪写完整。难受很强时，先联系现实中的支持者。'],
  },
  {
    id: 'sadness',
    title: '微行动抽卡',
    subtitle: '没动力、提不起劲、不想动',
    triggerLabels: ['没动力', '拖不动', '不想动', '提不起劲'],
    durationMinutes: [2, 10],
    defaultDuration: 5,
    kind: 'action-card',
    accent: '#9a6b2f',
    steps: [
      {
        title: '选能量档',
        body: '只选当前真的做得到的时长。',
        cue: '低能量时选 2 分钟，不需要证明自己。',
      },
      {
        title: '抽一张卡',
        body: '卡片会从身体、光线、水分、音乐、自然和微连接里抽一个小动作。',
        cue: '不处理任务，先让身体和环境动一点点。',
      },
      {
        title: '完成后再评分',
        body: '不追求开心，只观察身体和心情有没有一点变化。',
        cue: '一点点变化就值得记录。',
      },
    ],
    evidence: [
      {
        label: 'Cochrane behavioural activation review',
        url: 'https://www.cochrane.org/evidence/CD013305_behavioural-activation-therapy-depression-adults',
        summary: '行为激活通过安排有意义或愉快活动改善抑郁症状，综述纳入 53 项 RCT、5495 人。',
      },
      {
        label: 'Exercise for depression network meta-analysis',
        url: 'https://www.bmj.com/content/384/bmj-2023-075847',
        summary: 'BMJ 2024 纳入 218 项随机试验的网络元分析显示，步行、瑜伽、力量训练等活动与抑郁症状下降相关。',
      },
      {
        label: 'Bright light therapy meta-analysis',
        url: 'https://jamanetwork.com/journals/jamapsychiatry/fullarticle/2824482',
        summary: 'JAMA Psychiatry 2024 系统综述和元分析显示，明亮光照作为辅助干预与更好的缓解和反应率相关。',
      },
      {
        label: 'Music therapy RCT meta-analysis',
        url: 'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0240862',
        summary: '55 项随机试验的元分析显示，音乐治疗和音乐聆听类干预与抑郁症状下降相关，但结果异质性较高。',
      },
    ],
    cautions: ['如果卡片看起来太难，换更短的时长，不要硬撑。'],
  },
  {
    id: 'fatigue',
    title: '恢复小径',
    subtitle: '脑子累、信息过载',
    triggerLabels: ['眼睛累', '信息太多', '转不动', '想逃离屏幕'],
    durationMinutes: [5, 10],
    defaultDuration: 5,
    kind: 'rest-path',
    accent: '#4f7f3c',
    steps: [
      {
        title: '离开工作刺激',
        body: '先让眼睛离开当前任务和消息流。',
        cue: '休息不是换一个高强度任务。',
      },
      {
        title: '降低身体紧绷',
        body: '做轻伸展，重点放肩、颈、手腕。',
        cue: '动作慢一点，不追求运动量。',
      },
      {
        title: '看自然场景',
        body: '让注意力停在自然画面、窗外或植物上。',
        cue: '不用记忆，不用分析，只看。',
      },
    ],
    evidence: [
      {
        label: 'Micro-breaks systematic review and meta-analysis',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9432722/',
        summary: '微休息对提升活力、降低疲劳有小但显著的效果。',
      },
      {
        label: 'Nature exposure and attention restoration meta-analysis',
        url: 'https://www.sciencedirect.com/science/article/pii/S027249442500115X',
        summary: '自然暴露相对非自然环境对工作记忆和注意控制有更可靠的恢复收益。',
      },
    ],
    cautions: ['不要在这个模块里安排记忆题、反应题或刷内容。'],
  },
  {
    id: 'anger',
    title: '降温仪表盘',
    subtitle: '生气、想爆发',
    triggerLabels: ['想回击', '胸口热', '咬牙', '忍不住要发消息'],
    durationMinutes: [2, 4],
    defaultDuration: 2,
    kind: 'cooldown',
    accent: '#b85035',
    steps: [
      {
        title: '先降唤醒',
        body: '用慢呼气和放松肩颈让身体温度往下走。',
        cue: '这里不做发泄动作。',
      },
      {
        title: '延迟反应',
        body: '给回复、争辩或决定加一个等待时间。',
        cue: '先把手从发送键旁边拿开。',
      },
      {
        title: '再判断',
        body: '等身体没那么热，再决定要不要处理事件。',
        cue: '降温不是认输，是保留选择权。',
      },
    ],
    evidence: [
      {
        label: 'Anger arousal meta-analysis',
        url: 'https://www.sciencedirect.com/science/article/pii/S0272735824000357',
        summary: '154 项研究、10189 名参与者的元分析显示，降低唤醒的活动可减少愤怒和攻击。',
      },
    ],
    cautions: ['不要用狂点、咆哮、击打、跑步来当本模块练习。高唤醒发泄可能维持愤怒。'],
  },
  {
    id: 'anxiety',
    title: '呼吸同步器',
    subtitle: '焦虑、紧张、压力高',
    triggerLabels: ['紧张', '心跳快', '担心出事', '坐立不安'],
    durationMinutes: [3, 5],
    defaultDuration: 3,
    kind: 'breathing',
    accent: '#5169a8',
    steps: [
      {
        title: '跟随慢节奏',
        body: '默认约每分钟 6 次呼吸，不屏息。',
        cue: '呼气比平时更慢一点即可。',
      },
      {
        title: '选择关注方式',
        body: '可以数节奏，也可以只看圆环变化。',
        cue: '如果数呼吸更焦虑，就切到只看。',
      },
      {
        title: '结束后评分',
        body: '记录压力变化，而不是追求完全放松。',
        cue: '小幅下降也算有效线索。',
      },
    ],
    evidence: [
      {
        label: 'Breathwork RCT meta-analysis',
        url: 'https://www.nature.com/articles/s41598-022-27247-y',
        summary: '随机对照研究元分析显示，呼吸练习对主观压力、焦虑、抑郁有小到中等改善，证据需谨慎解读。',
      },
    ],
    cautions: ['如果关注呼吸让你更不舒服，改为看圆环或停止本轮。'],
  },
]

export const interventionsById = Object.fromEntries(
  interventions.map((intervention) => [intervention.id, intervention]),
) as Record<Intervention['id'], Intervention>
