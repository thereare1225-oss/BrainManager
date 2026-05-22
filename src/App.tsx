import { useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  BatteryMedium,
  Brain,
  CheckCircle2,
  Cloud,
  Flame,
  HeartHandshake,
  LogOut,
  Pause,
  Play,
  RotateCcw,
  Shuffle,
  Trash2,
  Wind,
  type LucideIcon,
} from 'lucide-react'
import './App.css'
import { interventions, interventionsById } from './data/interventions'
import type { BrainState, Intervention, SessionResult } from './types'

type Stage = 'before' | 'practice' | 'after'
type BreathMode = 'count' | 'visual'
type ActionCard = {
  lane: string
  title: string
  body: string
  done: string
}

const STORAGE_KEY = 'brainmanager.sessions.v1'

const iconMap: Record<BrainState, LucideIcon> = {
  racing_thoughts: Cloud,
  sadness_healing: HeartHandshake,
  sadness: Shuffle,
  fatigue: BatteryMedium,
  anger: Flame,
  anxiety: Wind,
}

const actionDecks: Record<number, ActionCard[]> = {
  2: [
    { lane: '身体唤醒', title: '脚踩地', body: '两只脚都踩到地面，脚趾轻轻抓地再松开。', done: '重复 5 次。' },
    { lane: '身体唤醒', title: '站起来', body: '从坐着变成站着，什么都不用做。', done: '站稳 10 秒。' },
    { lane: '身体唤醒', title: '肩膀下沉', body: '把肩膀抬高，再慢慢放下。', done: '做 6 次。' },
    { lane: '身体唤醒', title: '手臂画圈', body: '两只手臂小幅度向后画圈。', done: '画 12 圈。' },
    { lane: '身体唤醒', title: '原地踏步', body: '不用抬很高，脚跟离地就行。', done: '踏 30 下。' },
    { lane: '身体唤醒', title: '下巴松开', body: '嘴唇轻闭，牙齿分开，让下巴掉下来一点。', done: '保持 20 秒。' },
    { lane: '感官重启', title: '温水擦手', body: '用温水洗手或擦手，感受手心变热。', done: '手变暖就完成。' },
    { lane: '感官重启', title: '闻一点气味', body: '闻肥皂、茶、咖啡或任何温和气味。', done: '慢慢闻 3 次。' },
    { lane: '感官重启', title: '摸一个材质', body: '摸衣角、杯子、桌面或墙面。', done: '注意触感 20 秒。' },
    { lane: '感官重启', title: '喝三口水', body: '每一口都停一下再咽。', done: '喝满 3 口。' },
    { lane: '光线', title: '拉开一点光', body: '拉开窗帘、开灯，或把屏幕亮度调柔和。', done: '光线变化就完成。' },
    { lane: '光线', title: '看远处', body: '看向窗外、墙角或房间最远的地方。', done: '看 30 秒。' },
    { lane: '声音', title: '放一段声音', body: '放水声、白噪、轻音乐或安静背景声。', done: '听 60 秒。' },
    { lane: '声音', title: '跟节奏点头', body: '选一段慢一点的声音，轻轻点头。', done: '点 20 下。' },
    { lane: '微连接', title: '发一个表情', body: '给熟悉的人发一个表情或标点，不解释。', done: '发出或存草稿都算。' },
    { lane: '微连接', title: '看一眼联系人', body: '打开联系人列表，只看一个让你不紧绷的名字。', done: '看见名字就停。' },
    { lane: '小愉快', title: '换个杯子', body: '把水倒进一个更顺眼的杯子里。', done: '杯子换好就完成。' },
    { lane: '小愉快', title: '拿一个软物', body: '拿抱枕、毛巾、外套或任何柔软物。', done: '抱住 20 秒。' },
    { lane: '环境轻动', title: '开一点窗', body: '打开窗、门，或让空气流动一下。', done: '空气变化就完成。' },
    { lane: '环境轻动', title: '换个坐姿', body: '身体换到一个没那么塌的姿势。', done: '保持 20 秒。' },
    { lane: '自然接触', title: '看一眼绿色', body: '看植物、天空、树影或一张自然图。', done: '看 30 秒。' },
    { lane: '自然接触', title: '摸一点水', body: '让手指碰到水，冷水温水都可以。', done: '碰到水就完成。' },
    { lane: '感官重启', title: '眨眼放松', body: '闭眼 3 秒，再睁眼看远处。', done: '重复 5 次。' },
    { lane: '身体唤醒', title: '掌心按压', body: '两只手掌互相按住，再慢慢松开。', done: '按压 8 次。' },
  ],
  5: [
    { lane: '身体唤醒', title: '慢走一圈', body: '在房间、走廊或楼下慢慢走。', done: '走满 5 分钟。' },
    { lane: '身体唤醒', title: '靠墙伸展', body: '手扶墙，胸口轻轻打开。', done: '左右各 30 秒。' },
    { lane: '身体唤醒', title: '脚跟起落', body: '扶着桌边，脚跟抬起再落下。', done: '做 20 次。' },
    { lane: '身体唤醒', title: '站着听歌', body: '放一首歌，站着听完。', done: '歌没完也可以停。' },
    { lane: '身体唤醒', title: '手腕放松', body: '手腕慢慢转圈，手指张开再合上。', done: '做 2 轮。' },
    { lane: '身体唤醒', title: '轻拍身体', body: '轻拍手臂、肩膀和大腿外侧。', done: '每处 10 下。' },
    { lane: '光线', title: '站到亮处', body: '去窗边、门口或更亮的位置站一会儿。', done: '站满 2 分钟。' },
    { lane: '光线', title: '整理光源', body: '把灯光调到不刺眼但更清楚。', done: '眼睛舒服一点就完成。' },
    { lane: '水分', title: '慢慢喝水', body: '倒一杯水，分 5 口喝。', done: '不需要喝完。' },
    { lane: '水分', title: '洗脸重启', body: '洗脸或用湿毛巾敷脸。', done: '脸部有清醒感就完成。' },
    { lane: '感官重启', title: '冷热交替手', body: '手先碰温水，再碰凉一点的水。', done: '各 10 秒。' },
    { lane: '感官重启', title: '选一个颜色', body: '在房间里找 5 个同色物品。', done: '找到 5 个就停。' },
    { lane: '声音', title: '听完一首', body: '选一首不刺激的歌或纯音乐。', done: '听完或听到一半都算。' },
    { lane: '声音', title: '轻声哼唱', body: '跟着音乐轻轻哼，不追求好听。', done: '哼 30 秒。' },
    { lane: '自然接触', title: '看云或天空', body: '看窗外、天空、树影或自然图片。', done: '看满 2 分钟。' },
    { lane: '自然接触', title: '照顾植物', body: '给植物浇一点水，或只是摸摸叶子。', done: '接触到就完成。' },
    { lane: '微连接', title: '发一句短话', body: '发“我现在有点没劲，先冒个泡”。', done: '发出或存草稿都算。' },
    { lane: '微连接', title: '听一段人声', body: '打开一段温和的人声、播客或语音。', done: '听 2 分钟。' },
    { lane: '小愉快', title: '换一件舒服的', body: '换袜子、外套，或把勒人的东西松开。', done: '身体舒服一点就完成。' },
    { lane: '小愉快', title: '吃一小口', body: '吃一口容易入口的东西。', done: '只吃一口也算。' },
    { lane: '环境轻动', title: '换一个位置', body: '从当前位置换到另一个座位或站点。', done: '位置变了就完成。' },
    { lane: '环境轻动', title: '让空气动起来', body: '开窗、开门或打开风扇低档。', done: '空气流动就完成。' },
    { lane: '身体唤醒', title: '扶桌前倾', body: '双手扶桌，身体慢慢前倾再回来。', done: '做 8 次。' },
    { lane: '身体唤醒', title: '左右摆动', body: '站着或坐着，让上半身轻轻左右摆。', done: '摆 30 秒。' },
  ],
  10: [
    { lane: '身体唤醒', title: '低配散步', body: '出门、楼道或室内都可以，慢慢走。', done: '走满 10 分钟。' },
    { lane: '身体唤醒', title: '舒展全身', body: '脖子、肩膀、腰背、腿各做一个慢动作。', done: '每处 30 秒。' },
    { lane: '身体唤醒', title: '轻微出汗', body: '原地踏步、开合步或深蹲，选最轻的一种。', done: '身体热一点就停。' },
    { lane: '身体唤醒', title: '慢动作伸展', body: '像放慢镜头一样伸展手臂和背部。', done: '做 5 轮。' },
    { lane: '光线', title: '窗边停留', body: '坐到窗边或亮处，不刷内容。', done: '待满 10 分钟。' },
    { lane: '光线', title: '短暂日光', body: '能出门就接触自然光，不能出门就靠近窗。', done: '眼睛不直视太阳。' },
    { lane: '水分', title: '热饮时间', body: '泡一杯温热饮品，慢慢喝。', done: '喝几口就可以。' },
    { lane: '水分', title: '简单补给', body: '拿一个不需要加工的食物或饮品。', done: '拿到手边就完成。' },
    { lane: '感官重启', title: '洗澡低配版', body: '冲手腕、洗脸、泡脚或快速冲澡，任选一个。', done: '身体温度变化就完成。' },
    { lane: '感官重启', title: '换触感', body: '换一件更舒服的衣物，或盖一条柔软织物。', done: '触感变化就完成。' },
    { lane: '声音', title: '十分钟播放列表', body: '放 2 到 3 首低刺激音乐。', done: '听到身体慢一点。' },
    { lane: '声音', title: '跟着节奏动', body: '跟音乐摆手、点头或轻轻摇晃。', done: '动 3 分钟即可。' },
    { lane: '自然接触', title: '看自然十分钟', body: '看天空、树、植物、水面或自然图片。', done: '不需要想事情。' },
    { lane: '自然接触', title: '小段户外', body: '到门口、楼下、阳台或窗边待一会儿。', done: '空间变化就完成。' },
    { lane: '微连接', title: '发一个在场信号', body: '给熟人发“我有点没动力，先露个面”。', done: '不等回复。' },
    { lane: '微连接', title: '听别人说话', body: '打开一段温和人声，不用互动。', done: '听 5 分钟。' },
    { lane: '小愉快', title: '换一个味道', body: '准备茶、糖、薄荷、咖啡或喜欢的小味道。', done: '闻到或尝到就完成。' },
    { lane: '小愉快', title: '看三张照片', body: '看三张让你没那么紧绷的照片。', done: '三张就停。' },
    { lane: '环境轻动', title: '换一个角度', body: '把椅子、坐姿或面对方向换一下。', done: '视野变了就完成。' },
    { lane: '环境轻动', title: '小范围通风', body: '开窗、开门或走到空气更流动的地方。', done: '待 3 分钟。' },
    { lane: '身体唤醒', title: '交替触碰', body: '右手碰左肩，左手碰右肩，慢慢交替。', done: '做 20 次。' },
    { lane: '休息恢复', title: '安静靠坐', body: '背靠椅背或墙，手放在腿上。', done: '靠坐 5 分钟。' },
    { lane: '休息恢复', title: '躺平十分钟', body: '躺下或靠着坐，不刷刺激内容。', done: '闭眼也可以。' },
    { lane: '休息恢复', title: '安静呼气', body: '不数呼吸，只把呼气放慢一点。', done: '做 10 次慢呼气。' },
  ],
}

const safetyTerms = ['自杀', '自残', '伤害自己', '不想活', '结束生命', 'suicide', 'kill myself', 'self harm', 'die']

function loadSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SessionResult[]) : []
  } catch {
    return []
  }
}

function scoreLabel(score: number) {
  if (score <= 2) return '很难受'
  if (score <= 4) return '偏乱'
  if (score <= 6) return '一般'
  if (score <= 8) return '比较稳'
  return '很稳'
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${rest.toString().padStart(2, '0')}`
}

function hasSafetyRisk(text: string) {
  const normalized = text.trim().toLowerCase()
  return safetyTerms.some((term) => normalized.includes(term))
}

function getActionDeck() {
  return Object.values(actionDecks).flat()
}

function App() {
  const [sessions, setSessions] = useState<SessionResult[]>(loadSessions)
  const [selectedId, setSelectedId] = useState<BrainState | null>(null)
  const [stage, setStage] = useState<Stage>('before')
  const [beforeScore, setBeforeScore] = useState(5)
  const [afterScore, setAfterScore] = useState(5)
  const [remaining, setRemaining] = useState(0)
  const [note, setNote] = useState('')
  const [labelCounts, setLabelCounts] = useState<Record<string, number>>({})
  const [actionCard, setActionCard] = useState<ActionCard>(actionDecks[5][0])
  const [restChecks, setRestChecks] = useState<string[]>([])
  const [coolingActions, setCoolingActions] = useState<string[]>([])
  const [breathMode, setBreathMode] = useState<BreathMode>('count')

  const selected = selectedId ? interventionsById[selectedId] : null
  const latestSessions = sessions.slice(0, 5)
  const needsSupport = hasSafetyRisk(note)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  }, [sessions])

  useEffect(() => {
    if (stage !== 'practice') return
    if (selected?.kind === 'thought-labeling') return
    if (selected?.kind === 'self-soothe') return

    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(timer)
          window.setTimeout(() => setStage('after'), 0)
          return 0
        }

        return value - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [stage, selected?.kind])

  const completedLabels = useMemo(
    () => Object.values(labelCounts).reduce((sum, count) => sum + count, 0),
    [labelCounts],
  )

  function chooseIntervention(id: BrainState) {
    const intervention = interventionsById[id]
    setSelectedId(id)
    setStage(intervention.kind === 'thought-labeling' ? 'practice' : 'before')
    setBeforeScore(5)
    setAfterScore(5)
    setRemaining(intervention.defaultDuration * 60)
    setNote('')
    setLabelCounts({})
    setRestChecks([])
    setCoolingActions([])
    setBreathMode('count')
    if (intervention.kind === 'action-card') {
      drawActionCard()
    }
  }

  function startPractice() {
    if (!selected) return
    setRemaining(selected.defaultDuration * 60)
    setStage('practice')
  }

  function finishPractice() {
    setStage('after')
  }

  function saveSession() {
    if (!selected) return

    const nextSession: SessionResult = {
      stateId: selected.id,
      beforeScore,
      afterScore,
      completedAt: new Date().toISOString(),
      note: note.trim() || undefined,
    }

    setSessions((current) => [nextSession, ...current].slice(0, 50))
    setSelectedId(null)
    setStage('before')
  }

  function clearSessions() {
    setSessions([])
    localStorage.removeItem(STORAGE_KEY)
  }

  function drawActionCard() {
    const deck = getActionDeck()
    const next = deck[Math.floor(Math.random() * deck.length)]
    setActionCard(next)
  }

  if (!selected) {
    return (
      <main className="app-shell">
        <HomeScreen
          sessions={latestSessions}
          onChoose={chooseIntervention}
          onClearSessions={clearSessions}
        />
      </main>
    )
  }

  return (
    <main
      className={`app-shell module-shell ${
        selected.kind === 'thought-labeling' && stage === 'practice' ? 'game-active' : ''
      }`}
      style={{ '--state-accent': selected.accent } as React.CSSProperties}
    >
      <header className="topbar">
        <button
          type="button"
          className="icon-button"
          onClick={() => setSelectedId(null)}
          aria-label="返回首页"
          title="返回首页"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="eyebrow">BrainManager v1</p>
          <h1>{selected.title}</h1>
        </div>
      </header>

      <section
        className={`module-layout ${
          selected.kind === 'thought-labeling' || (selected.kind === 'self-soothe' && stage === 'practice') ? 'game-only' : ''
        }`}
      >
        <aside className="module-brief">
          <StateSignal intervention={selected} />
          <StepList intervention={selected} />
          <EvidencePanel intervention={selected} />
        </aside>

        <section className="practice-panel">
          {stage === 'before' && (
            <BeforeStage
              intervention={selected}
              score={beforeScore}
              breathMode={breathMode}
              onScore={setBeforeScore}
              onBreathMode={setBreathMode}
              onStart={startPractice}
            />
          )}

          {stage === 'practice' && (
            <PracticeStage
              intervention={selected}
              remaining={remaining}
              labelCounts={labelCounts}
              completedLabels={completedLabels}
              actionCard={actionCard}
              restChecks={restChecks}
              coolingActions={coolingActions}
              breathMode={breathMode}
              onLabel={(label) =>
                setLabelCounts((current) => ({
                  ...current,
                  [label]: (current[label] ?? 0) + 1,
                }))
              }
              onDrawCard={() => drawActionCard()}
              onToggleRest={(item) =>
                setRestChecks((current) =>
                  current.includes(item)
                    ? current.filter((value) => value !== item)
                    : [...current, item],
                )
              }
              onToggleCooling={(item) =>
                setCoolingActions((current) =>
                  current.includes(item)
                    ? current.filter((value) => value !== item)
                    : [...current, item],
                )
              }
              onBreathMode={setBreathMode}
              onFinish={finishPractice}
            />
          )}

          {stage === 'after' && (
            <AfterStage
              intervention={selected}
              beforeScore={beforeScore}
              afterScore={afterScore}
              note={note}
              needsSupport={needsSupport}
              onScore={setAfterScore}
              onNote={setNote}
              onSave={saveSession}
              onRestart={() => {
                setStage('before')
                setNote('')
              }}
            />
          )}
        </section>
      </section>
    </main>
  )
}

interface HomeProps {
  sessions: SessionResult[]
  onChoose: (id: BrainState) => void
  onClearSessions: () => void
}

function HomeScreen({ sessions, onChoose, onClearSessions }: HomeProps) {
  return (
    <>
      <header className="home-header">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <Brain size={24} />
          </div>
          <div>
            <p className="eyebrow">BrainManager v1</p>
            <h1>现在脑子是什么状态？</h1>
          </div>
        </div>
        <p className="quiet-copy">
          这是一个个人自助工具。它不判断病情，也不保证结果，只帮你用短练习记录前后变化。
        </p>
      </header>

      <section className="home-layout">
        <div className="state-grid" aria-label="选择当前状态">
          {interventions.map((intervention, index) => {
            const Icon = iconMap[intervention.id]
            return (
              <button
                key={intervention.id}
                type="button"
                className={`state-card ${index === 0 ? 'recommended' : ''}`}
                style={{ '--state-accent': intervention.accent } as React.CSSProperties}
                onClick={() => onChoose(intervention.id)}
              >
                <span className="state-icon">
                  <Icon size={22} />
                </span>
                <span className="state-card-title">{intervention.title}</span>
                <span className="state-card-subtitle">{intervention.subtitle}</span>
                <span className="trigger-row">
                  {intervention.triggerLabels.slice(0, 3).map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </span>
              </button>
            )
          })}
        </div>

        <aside className="history-panel">
          <div className="history-heading">
            <div>
              <p className="eyebrow">本地记录</p>
              <h2>最近 5 次</h2>
            </div>
            {sessions.length > 0 && (
              <button
                type="button"
                className="icon-button"
                onClick={onClearSessions}
                aria-label="清除本地记录"
                title="清除本地记录"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
          {sessions.length === 0 ? (
            <p className="muted">完成一轮后，这里会显示前后评分变化。</p>
          ) : (
            <ul className="history-list">
              {sessions.map((session) => {
                const item = interventionsById[session.stateId]
                const delta = session.afterScore - session.beforeScore
                return (
                  <li key={`${session.completedAt}-${session.stateId}`}>
                    <span>{item.title}</span>
                    <strong className={delta >= 0 ? 'delta-good' : 'delta-low'}>
                      {delta >= 0 ? '+' : ''}
                      {delta}
                    </strong>
                    <time>{new Intl.DateTimeFormat('zh-CN', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(session.completedAt))}</time>
                  </li>
                )
              })}
            </ul>
          )}
          <div className="author-contact">
            <span>联系作者</span>
            <a href="mailto:thereare1225@gmail.com">thereare1225@gmail.com</a>
          </div>
        </aside>
      </section>
    </>
  )
}

function StateSignal({ intervention }: { intervention: Intervention }) {
  const Icon = iconMap[intervention.id]
  return (
    <div className="state-signal">
      <span className="state-icon">
        <Icon size={24} />
      </span>
      <div>
        <p className="eyebrow">当前入口</p>
        <h2>{intervention.subtitle}</h2>
      </div>
    </div>
  )
}

function StepList({ intervention }: { intervention: Intervention }) {
  return (
    <ol className="step-list">
      {intervention.steps.map((step) => (
        <li key={step.title}>
          <strong>{step.title}</strong>
          <span>{step.body}</span>
          <em>{step.cue}</em>
        </li>
      ))}
    </ol>
  )
}

function EvidencePanel({ intervention }: { intervention: Intervention }) {
  return (
    <details className="evidence-panel">
      <summary>为什么这样设计</summary>
      <div className="evidence-list">
        {intervention.evidence.map((item) => (
          <a key={item.url} href={item.url} target="_blank" rel="noreferrer">
            <strong>{item.label}</strong>
            <span>{item.summary}</span>
          </a>
        ))}
      </div>
      <ul className="caution-list">
        {intervention.cautions.map((caution) => (
          <li key={caution}>{caution}</li>
        ))}
      </ul>
    </details>
  )
}

interface BeforeStageProps {
  intervention: Intervention
  score: number
  breathMode: BreathMode
  onScore: (score: number) => void
  onBreathMode: (mode: BreathMode) => void
  onStart: () => void
}

function BeforeStage({
  intervention,
  score,
  breathMode,
  onScore,
  onBreathMode,
  onStart,
}: BeforeStageProps) {
  const isGuidedCloud = intervention.kind === 'thought-labeling'

  return (
    <div className="stage-content">
      <p className="stage-kicker">开始前</p>
      <h2>{isGuidedCloud ? '直接开始降噪' : '现在主观状态打几分？'}</h2>
      {isGuidedCloud && (
        <p className="quick-start-copy">分数已经默认填好。现在不用分析自己，先做一轮短动作。</p>
      )}
      <ScoreControl score={score} onScore={onScore} />

      {intervention.kind === 'breathing' && (
        <BreathModeSwitch mode={breathMode} onMode={onBreathMode} />
      )}

      <button type="button" className="primary-action" onClick={onStart}>
        <CheckCircle2 size={20} />
        {isGuidedCloud ? '开始降噪' : '开始这一轮'}
      </button>
    </div>
  )
}

interface PracticeStageProps {
  intervention: Intervention
  remaining: number
  labelCounts: Record<string, number>
  completedLabels: number
  actionCard: ActionCard
  restChecks: string[]
  coolingActions: string[]
  breathMode: BreathMode
  onLabel: (label: string) => void
  onDrawCard: () => void
  onToggleRest: (item: string) => void
  onToggleCooling: (item: string) => void
  onBreathMode: (mode: BreathMode) => void
  onFinish: () => void
}

function PracticeStage(props: PracticeStageProps) {
  if (props.intervention.kind === 'thought-labeling') {
    return (
      <div className="stage-content practice-stage game-stage">
        <ThoughtLabeling {...props} />
      </div>
    )
  }
  const isSelfSootheGame = props.intervention.kind === 'self-soothe'

  return (
    <div className={`stage-content practice-stage ${isSelfSootheGame ? 'game-stage' : ''}`}>
      {!isSelfSootheGame && (
        <div className="timer-row">
          <span className="stage-kicker">练习中</span>
          <strong>{formatTime(props.remaining)}</strong>
        </div>
      )}

      {props.intervention.kind === 'action-card' && <ActionCardPractice {...props} />}
      {props.intervention.kind === 'self-soothe' && <SelfSoothePractice onComplete={props.onFinish} />}
      {props.intervention.kind === 'rest-path' && <RestPathPractice {...props} />}
      {props.intervention.kind === 'cooldown' && <CooldownPractice {...props} />}
      {props.intervention.kind === 'breathing' && <BreathingPractice {...props} />}

      <button type="button" className="secondary-action" onClick={props.onFinish}>
        完成本轮
      </button>
    </div>
  )
}

type StreamPhase = 'idle' | 'playing' | 'paused'
type StreamForceMode = 'none' | 'attract' | 'repel'
type NoiseKind = 'spark' | 'text' | 'wave' | 'fish' | 'bubble'
type StreamNoise = {
  id: number
  kind: NoiseKind
  x: number
  y: number
  vx: number
  vy: number
  size: number
  phase: number
  calm: number
  drift: number
  touch: number
  hitCount: number
  hitCooldown: number
  waveTouchCooldown: number
  waveImpact: number
  burst: number
  gone: boolean
}
type StreamAudio = {
  context: AudioContext
  filter: BiquadFilterNode
  gain: GainNode
  hum: OscillatorNode
  noiseGain: GainNode
  noiseSource: AudioBufferSourceNode
}

const STREAM_TRANSFORM_DISTANCE = 168
const STREAM_WAKE_HORIZONTAL_DISTANCE = 420
const STREAM_WAKE_VERTICAL_DISTANCE = 150
const STREAM_REST_DELAY = 2000
const STREAM_EDGE_PADDING = 0
const STREAM_MAX_DPR = 1.35
const STREAM_WATER_LINES = 12
const STREAM_FLOW_PARTICLES = 22
const STREAM_FORCE_DISTANCE = 210
const STREAM_SPARK_ORBIT_INNER = 62
const STREAM_SPARK_ORBIT_OUTER = 150
const STREAM_FORCE_TIP_INTERVAL = 60000
const STREAM_FORCE_TIP_VISIBLE_MS = 9000
const SPARK_COLORS = ['#ff7a1a', '#f7e11d', '#00a88a', '#ffb000', '#ff3d7f']
const SPARK_GOLD_INDEX = 3
const STREAM_NOISE_COUNTS: Record<NoiseKind, number> = {
  spark: 5,
  text: 22,
  wave: 22,
  fish: 13,
  bubble: 13,
}

function ThoughtLabeling({ onFinish }: PracticeStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const audioRef = useRef<StreamAudio | null>(null)
  const lastFrameRef = useRef(0)
  const lastInputRef = useRef(0)
  const startedAtRef = useRef(0)
  const lastAudioUpdateRef = useRef(0)
  const forceTipTimerRef = useRef<number | null>(null)
  const forceTipHideTimerRef = useRef<number | null>(null)
  const forceUsedRef = useRef(false)
  const pointerRef = useRef({
    x: 0.5,
    y: 0.52,
    targetX: 0.5,
    targetY: 0.52,
    active: false,
    forceMode: 'none' as StreamForceMode,
  })
  const noiseRef = useRef<StreamNoise[]>([])
  const settledRef = useRef(0)
  const [phase, setPhase] = useState<StreamPhase>('idle')
  const [showForceTip, setShowForceTip] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const activeCanvas = canvas

    const initialNow = performance.now()
    lastFrameRef.current = initialNow
    if (noiseRef.current.length === 0) noiseRef.current = createStreamNoise()
    if (lastInputRef.current === 0) lastInputRef.current = initialNow
    if (startedAtRef.current === 0) startedAtRef.current = initialNow
    const context = activeCanvas.getContext('2d', { alpha: false, desynchronized: true })
    if (!context) return
    const activeContext = context

    function render(now: number) {
      const delta = Math.min(48, now - lastFrameRef.current)
      lastFrameRef.current = now

      drawStreamFrame(activeCanvas, activeContext, {
        delta: phase === 'paused' ? 0 : delta,
        now,
        phase,
        pointer: pointerRef.current,
        noise: noiseRef.current,
        lastInputAt: lastInputRef.current,
        onSettle: (ratio) => {
          settledRef.current = ratio
        },
      })
      if (now - lastAudioUpdateRef.current > 180) {
        updateStreamAudio(audioRef.current, settledRef.current, phase)
        lastAudioUpdateRef.current = now
      }
      animationRef.current = window.requestAnimationFrame(render)
    }

    animationRef.current = window.requestAnimationFrame(render)
    return () => {
      if (animationRef.current) window.cancelAnimationFrame(animationRef.current)
    }
  }, [phase])

  function startStream() {
    noiseRef.current = createStreamNoise()
    pointerRef.current = {
      x: 0.5,
      y: 0.52,
      targetX: 0.5,
      targetY: 0.52,
      active: false,
      forceMode: 'none',
    }
    startedAtRef.current = performance.now()
    lastInputRef.current = performance.now()
    lastAudioUpdateRef.current = 0
    forceUsedRef.current = false
    settledRef.current = 0
    setShowForceTip(false)
    scheduleForceTip()
    setPhase('playing')
    audioRef.current = startStreamAudio(audioRef.current)
  }

  function togglePause() {
    setPhase((current) => (current === 'paused' ? 'playing' : current === 'playing' ? 'paused' : current))
    lastInputRef.current = performance.now()
  }

  function handlePointer(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const nextForceMode = getPointerForceMode(event)
    if (phase === 'idle') startStream()
    pointerRef.current.targetX = (event.clientX - rect.left) / rect.width
    pointerRef.current.targetY = (event.clientY - rect.top) / rect.height
    pointerRef.current.active = true
    pointerRef.current.forceMode = nextForceMode
    markForceUsed(nextForceMode)
    lastInputRef.current = performance.now()
  }

  function releasePointer(event?: PointerEvent<HTMLCanvasElement>) {
    pointerRef.current.active = Boolean(event?.buttons)
    const nextForceMode = event ? getPointerForceMode(event) : 'none'
    pointerRef.current.forceMode = nextForceMode
    markForceUsed(nextForceMode)
    lastInputRef.current = performance.now()
  }

  function markForceUsed(forceMode: StreamForceMode) {
    if (forceMode === 'none' || forceUsedRef.current) return

    forceUsedRef.current = true
    setShowForceTip(false)
    clearForceTipTimers()
  }

  function scheduleForceTip() {
    clearForceTipTimers()
    forceTipTimerRef.current = window.setTimeout(showForceTipOnce, STREAM_FORCE_TIP_INTERVAL)
  }

  function showForceTipOnce() {
    if (forceUsedRef.current) return

    setShowForceTip(true)
    forceTipHideTimerRef.current = window.setTimeout(() => {
      setShowForceTip(false)
      if (!forceUsedRef.current) scheduleForceTip()
    }, STREAM_FORCE_TIP_VISIBLE_MS)
  }

  function clearForceTipTimers() {
    if (forceTipTimerRef.current) {
      window.clearTimeout(forceTipTimerRef.current)
      forceTipTimerRef.current = null
    }
    if (forceTipHideTimerRef.current) {
      window.clearTimeout(forceTipHideTimerRef.current)
      forceTipHideTimerRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      clearForceTipTimers()
    }
  }, [])

  return (
    <div className="stream-layout">
      <section className={`stream-game stream-${phase}`} aria-label="静流脑内降噪游戏">
        <canvas
          ref={canvasRef}
          className="stream-canvas"
          onPointerDown={handlePointer}
          onPointerMove={(event) => {
            if (phase !== 'idle') handlePointer(event)
          }}
          onPointerUp={releasePointer}
          onPointerCancel={releasePointer}
          onPointerLeave={releasePointer}
          onContextMenu={(event) => event.preventDefault()}
        />

        {phase === 'idle' && (
          <button type="button" className="stream-start" onClick={startStream}>
            开始
          </button>
        )}

        {(phase === 'playing' || phase === 'paused') && (
          <>
            <button
              type="button"
              className="stream-exit"
              onClick={onFinish}
              aria-label="回到现实"
            >
              <LogOut size={18} />
            </button>
            <button
              type="button"
              className="stream-pause"
              onClick={togglePause}
              aria-label={phase === 'paused' ? '继续' : '暂停'}
            >
              {phase === 'paused' ? <Play size={20} /> : <Pause size={20} />}
            </button>
          </>
        )}
      </section>
      <aside className="stream-side-hint" aria-label="脑内降噪提示">
        <strong>尝试让噪声安静下来</strong>
        {showForceTip && <span className="stream-force-tip">按住左键牵引，按住右键推开</span>}
      </aside>
    </div>
  )
}

function getPointerForceMode(event: PointerEvent<HTMLCanvasElement>): StreamForceMode {
  if (event.pointerType && event.pointerType !== 'mouse') return 'none'
  if ((event.buttons & 2) === 2) return 'repel'
  if ((event.buttons & 1) === 1) return 'attract'
  return 'none'
}

function createStreamNoise() {
  const kinds: NoiseKind[] = ['spark', 'text', 'wave', 'fish', 'bubble']
  const totalCount = Object.values(STREAM_NOISE_COUNTS).reduce((sum, count) => sum + count, 0)
  let nextId = 0

  return kinds.flatMap((kind, kindIndex) =>
    Array.from({ length: STREAM_NOISE_COUNTS[kind] }, (_, typeIndex): StreamNoise => {
    const index = nextId
    nextId += 1
    const perKindCount = STREAM_NOISE_COUNTS[kind]
    const band = index / totalCount
    const seedAngle = typeIndex * 2.399963229728653 + (kindIndex / kinds.length) * Math.PI * 2
    const radius = Math.sqrt((typeIndex + 0.5) / perKindCount)
    const jitterX = Math.sin(index * 12.9898) * 0.012
    const jitterY = Math.cos(index * 78.233) * 0.012
    const angle = index * 2.399 + (kind === 'fish' ? 0.8 : 0)
    const speed = (0.000012 + (index % 9) * 0.000002) * (kind === 'spark' ? 1.16 : kind === 'fish' ? 1.2 : 1)
    return {
      id: index,
      kind,
      x: 0.5 + Math.cos(seedAngle) * radius * 0.24 + jitterX,
      y: 0.5 + Math.sin(seedAngle) * radius * 0.18 + jitterY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 0.7 + (index % 7) * 0.11,
      phase: band * Math.PI * 2,
      calm: 0,
      drift: 0.15 + (index % 9) * 0.04,
      touch: 0,
      hitCount: kind === 'spark' ? typeIndex % SPARK_COLORS.length : 0,
      hitCooldown: 0,
      waveTouchCooldown: 0,
      waveImpact: 0,
      burst: 0,
      gone: false,
    }
    }),
  )
}

function drawStreamFrame(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  state: {
    delta: number
    now: number
    phase: StreamPhase
    pointer: {
      x: number
      y: number
      targetX: number
      targetY: number
      active: boolean
      forceMode: StreamForceMode
    }
    noise: StreamNoise[]
      lastInputAt: number
      onSettle: (ratio: number) => void
  },
) {
  const rect = canvas.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, STREAM_MAX_DPR)
  const nextWidth = Math.max(1, Math.round(rect.width * dpr))
  const nextHeight = Math.max(1, Math.round(rect.height * dpr))
  if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
    canvas.width = nextWidth
    canvas.height = nextHeight
  }

  const width = canvas.width
  const height = canvas.height
  const time = state.now * 0.001
  const autoCalm = 0
  const pointer = state.pointer
  const follow = pointer.active ? 0.46 : 0.22
  pointer.x += (pointer.targetX - pointer.x) * follow
  pointer.y += (pointer.targetY - pointer.y) * follow

  const idleMs = state.now - state.lastInputAt
  const restRatio = state.phase !== 'idle' && idleMs > STREAM_REST_DELAY ? Math.min(1, (idleMs - STREAM_REST_DELAY) / 2400) : 0
  const ringRadius = (74 + restRatio * 170) * dpr

  drawWater(ctx, width, height, time, autoCalm)
  const px = pointer.x * width
  const py = pointer.y * height
  drawPlayerWake(ctx, px, py, width, height, time, restRatio, state.phase, pointer.forceMode)

  let calmSum = 0
  let visibleCount = 0
  for (const item of state.noise) {
    if (item.gone) continue
    visibleCount += 1
    moveNoiseInBox(item, state.delta, time, width, height)
    if (item.gone) continue
    if (item.burst > 0) {
      item.touch = 1
      calmSum += item.calm
      continue
    }
    const ix = item.x * width
    const iy = item.y * height
    const distance = Math.hypot(px - ix, py - iy)
    applyBoatHoldForce(item, pointer, state.delta, distance, dpr)
    handleBoatContact(item, px, py, ix, iy, distance, width, height, pointer.forceMode)
    const influence = getStreamInfluence(item.kind, px - ix, py - iy, distance, width, dpr)
    const restInfluence = restRatio * Math.max(0, 1 - distance / ringRadius)
    const totalInfluence = Math.max(influence, restInfluence)
    const interactionInfluence = item.kind === 'text' ? 0 : totalInfluence
    item.touch = item.kind === 'text' ? (pointer.forceMode === 'none' ? 0 : item.touch) : totalInfluence
    if (item.kind !== 'text') {
      item.calm = Math.min(1, item.calm + getKindCalmGain(item.kind, influence, restInfluence, autoCalm))
    }
    calmSum += item.calm

    if (interactionInfluence > 0.02) {
      const wakeY = py + Math.sin(time * 0.9 + item.phase) * height * 0.018
      applyKindInteraction(item, pointer, state.delta, influence, restInfluence, wakeY / height)
      if (item.kind !== 'spark' && item.kind !== 'bubble') {
        drawCalmingBridge(ctx, px, py, ix, iy, interactionInfluence, item.calm, item.kind, width)
      }
      keepInsideBox(item, width, height)
    }
  }

  if (Math.floor(state.now / 33) % 2 === 0) {
    separateNoiseItems(state.noise, width, height)
  }
  const sparksSameColor = areAllSparksSameColor(state.noise)
  if (sparksSameColor) drawSparkAlignmentEffect(ctx, state.noise, width, height, time)
  for (const item of state.noise) {
    if (!item.gone) drawNoiseItem(ctx, item, width, height, time, item.touch, sparksSameColor)
  }

  const settledRatio = visibleCount ? calmSum / visibleCount : 1
  state.onSettle(settledRatio)
  drawFlowGuides(ctx, width, height, time, settledRatio)
  drawPlayer(ctx, pointer.x * width, pointer.y * height, time, restRatio, state.phase, pointer.forceMode, width)
}

function applyBoatHoldForce(
  item: StreamNoise,
  pointer: { x: number; y: number; forceMode: StreamForceMode },
  delta: number,
  distancePx: number,
  dpr: number,
) {
  if (pointer.forceMode === 'none' || item.gone || item.burst > 0) return
  if (item.kind === 'bubble' && pointer.forceMode === 'repel') return
  const radius = STREAM_FORCE_DISTANCE * dpr
  if (distancePx >= radius) return

  const dx = pointer.x - item.x
  const dy = pointer.y - item.y
  const distance = Math.max(0.001, Math.hypot(dx, dy))
  const nx = dx / distance
  const ny = dy / distance
  const direction = pointer.forceMode === 'attract' ? 1 : -1
  const falloff = 1 - distancePx / radius
  const fishAttractionResistance = item.kind === 'fish' && item.calm < 0.55 && pointer.forceMode === 'attract' ? 0.12 : 1
  const force = 0.0000048 * falloff * falloff * delta * fishAttractionResistance
  item.vx += nx * force * direction
  item.vy += ny * force * direction
  if (item.kind === 'spark' && pointer.forceMode === 'attract') {
    applySparkOrbitAssist(item, nx, ny, distancePx, falloff, delta, dpr)
  }
  item.touch = Math.max(item.touch, falloff * 0.5)
}

function getStreamInfluence(
  kind: NoiseKind,
  dxPx: number,
  dyPx: number,
  distancePx: number,
  width: number,
  dpr: number,
) {
  if (kind !== 'wave' && kind !== 'fish') {
    return Math.max(0, 1 - distancePx / (STREAM_TRANSFORM_DISTANCE * dpr))
  }

  const horizontal = Math.max(STREAM_WAKE_HORIZONTAL_DISTANCE * dpr, width)
  const vertical = STREAM_WAKE_VERTICAL_DISTANCE * dpr
  const wakeDistance = Math.hypot(dxPx / horizontal, dyPx / vertical)
  return Math.max(0, 1 - wakeDistance)
}

function applySparkOrbitAssist(
  item: StreamNoise,
  nx: number,
  ny: number,
  distancePx: number,
  falloff: number,
  delta: number,
  dpr: number,
) {
  const inner = STREAM_SPARK_ORBIT_INNER * dpr
  const outer = STREAM_SPARK_ORBIT_OUTER * dpr
  if (distancePx > outer) return

  const orbitDirection = item.id % 2 === 0 ? 1 : -1
  const tangentX = -ny * orbitDirection
  const tangentY = nx * orbitDirection
  const orbitStrength = (1 - Math.min(1, distancePx / outer)) * 0.000012 * delta
  item.vx += tangentX * orbitStrength
  item.vy += tangentY * orbitStrength

  if (distancePx < inner) {
    const push = (1 - distancePx / inner) * 0.000018 * delta
    item.vx -= nx * push
    item.vy -= ny * push
  }

  const orbitCap = 0.00032 + falloff * 0.0001
  limitNoiseSpeed(item, orbitCap)
}

function getKindCalmGain(kind: NoiseKind, influence: number, restInfluence: number, autoCalm: number) {
  const base = autoCalm * 0.0018
  if (kind === 'spark') return base + restInfluence * 0.004
  if (kind === 'text') return 0
  if (kind === 'wave') return base + influence * 0.008 + restInfluence * 0.01
  if (kind === 'fish') return 0
  return base + restInfluence * 0.008
}

function applyKindInteraction(
  item: StreamNoise,
  pointer: {
    x: number
    y: number
    targetX: number
    targetY: number
    active: boolean
    forceMode: StreamForceMode
  },
  delta: number,
  influence: number,
  restInfluence: number,
  wakeY: number,
) {
  const totalInfluence = Math.max(influence, restInfluence)
  const activeInfluence = influence
  const dx = pointer.x - item.x
  const dy = pointer.y - item.y
  const distance = Math.max(0.001, Math.hypot(dx, dy))
  const nx = dx / distance
  const ny = dy / distance

  if (item.kind === 'spark') {
    return
  }

  if (item.kind === 'bubble') {
    return
  }

  if (item.kind === 'text') {
    return
  }

  if (item.kind === 'wave') {
    item.vy += (wakeY - item.y) * 0.000018 * totalInfluence * delta
    item.vx *= 1 - 0.018 * totalInfluence
    item.vy *= 1 - 0.032 * totalInfluence
    limitNoiseSpeed(item, 0.000055)
    return
  }

  if (item.kind === 'fish') {
    if (item.calm < 0.55) {
      const alertInfluence = Math.max(activeInfluence, Math.max(0, 1 - distance / 0.28) * 0.92)
      const dodgeSide = Math.sin(item.phase) >= 0 ? 1 : -1
      const tangentX = -ny * dodgeSide
      const tangentY = nx * dodgeSide
      item.vx += (-nx * 0.00012 + tangentX * 0.000088) * alertInfluence * delta
      item.vy += (-ny * 0.000104 + tangentY * 0.000074) * alertInfluence * delta
      limitNoiseSpeed(item, 0.00034)
    } else {
      item.vy += (wakeY - item.y) * 0.000012 * totalInfluence * delta
      item.vx *= 1 - 0.006 * totalInfluence
      item.vy *= 1 - 0.006 * totalInfluence
      limitNoiseSpeed(item, 0.000055)
    }
    return
  }

  item.vy -= 0.000016 * (0.35 + restInfluence) * delta
  if (distance < 0.12) {
    item.vx -= nx * 0.00001 * activeInfluence * delta
    item.vy -= ny * 0.000008 * activeInfluence * delta
  }
  item.vx *= 1 - 0.01 * restInfluence
  item.vy *= 1 - 0.02 * restInfluence
  limitNoiseSpeed(item, 0.000055)
}

function handleBoatContact(
  item: StreamNoise,
  boatX: number,
  boatY: number,
  itemX: number,
  itemY: number,
  distance: number,
  width: number,
  height: number,
  forceMode: StreamForceMode,
) {
  if (item.kind !== 'spark' && item.kind !== 'bubble' && item.kind !== 'fish') return
  if (item.burst > 0) return
  if (item.hitCooldown > 0) return

  const size = item.size * (8 + width * 0.006)
  const contactDistance = item.kind === 'fish' && item.calm < 0.55 ? 17 + size * 0.5 : 30 + size * 0.9
  if (distance > contactDistance) return

  const dx = itemX - boatX
  const dy = itemY - boatY
  const length = Math.max(0.001, Math.hypot(dx, dy))
  const nx = dx / length
  const ny = dy / length
  if (item.kind === 'fish') {
    item.calm = Math.max(item.calm, 0.68)
    item.vx *= 0.42
    item.vy *= 0.42
    item.hitCooldown = 520
    item.touch = 1
    keepInsideBox(item, width, height)
    return
  }

  const currentVx = item.vx * width
  const currentVy = item.vy * height
  const normalVelocity = currentVx * nx + currentVy * ny
  const tangentVx = currentVx - normalVelocity * nx
  const tangentVy = currentVy - normalVelocity * ny
  const burst = item.kind === 'spark' ? 0.52 : 0.46
  const outVx = nx * burst + tangentVx * 0.36
  const outVy = ny * burst + tangentVy * 0.36
  const correction = Math.max(10, contactDistance - distance + 8)
  item.vx = outVx / width
  item.vy = outVy / height
  item.x += (nx * correction) / width
  item.y += (ny * correction) / height
  if (item.kind === 'bubble' && forceMode !== 'repel') {
    item.hitCooldown = 180
    item.touch = 1
    keepInsideBox(item, width, height)
    return
  }

  item.hitCount += 1
  item.hitCooldown = 360
  item.touch = 1
  item.calm = Math.min(1, item.calm + (item.kind === 'spark' ? 0.05 : 0.03))
  keepInsideBox(item, width, height)
}

function moveNoiseInBox(item: StreamNoise, delta: number, time: number, width: number, height: number) {
  if (item.burst > 0) {
    item.burst = Math.max(0, item.burst - delta / 780)
    if (item.burst === 0) item.gone = true
    return
  }

  item.hitCooldown = Math.max(0, item.hitCooldown - delta)
  item.waveTouchCooldown = Math.max(0, item.waveTouchCooldown - delta)
  item.waveImpact = Math.max(0, item.waveImpact - delta / 340)
  const noise = 1 - item.calm
  const wobble = noise * 0.000000018
  item.vx += Math.sin(time * item.drift + item.phase) * wobble * delta
  item.vy += Math.cos(time * item.drift + item.phase) * wobble * delta
  if (item.kind === 'fish' && item.calm < 0.55) {
    steerFishAwayFromWalls(item, width, height, time)
  }
  if (item.kind === 'spark' || item.kind === 'bubble') {
    // Pinball objects keep their velocity; contact and walls are the only main events.
  } else if (item.hitCooldown > 0) {
    limitNoiseSpeed(item, 0.00012)
  } else if (item.calm > 0.78) {
    const quietCap = item.kind === 'fish' ? 0.000045 : 0.000038
    limitNoiseSpeed(item, quietCap)
  } else {
    limitNoiseSpeed(item, item.kind === 'fish' && item.calm < 0.55 ? 0.0003 : item.kind === 'fish' ? 0.00008 : 0.00007)
  }

  const bounds = getNoiseBounds(item, width, height)
  const px = item.x * width + item.vx * delta * width
  const py = item.y * height + item.vy * delta * height
  const vx = item.vx * width
  const vy = item.vy * height
  const hitHorizontalEdge = px < bounds.minPx || px > bounds.maxPx
  const hitVerticalEdge = py < bounds.minPy || py > bounds.maxPy
  const hitEdge = hitHorizontalEdge || hitVerticalEdge

  const reflectedX = reflectAxis(px, vx, bounds.minPx, bounds.maxPx)
  const reflectedY = reflectAxis(py, vy, bounds.minPy, bounds.maxPy)
  item.x = reflectedX.position / width
  item.y = reflectedY.position / height
  item.vx = reflectedX.velocity / width
  item.vy = reflectedY.velocity / height
  if (item.kind === 'fish' && item.calm < 0.55 && hitEdge) {
    turnFishAfterWallBounce(item, px, py, bounds, hitHorizontalEdge, hitVerticalEdge, time)
  }
  if (item.kind === 'bubble' && item.hitCount >= 5 && hitEdge) {
    item.burst = 1
    item.touch = 1
    item.vx = 0
    item.vy = 0
  }
}

function steerFishAwayFromWalls(item: StreamNoise, width: number, height: number, time: number) {
  const bounds = getNoiseBounds(item, width, height)
  const x = item.x * width
  const y = item.y * height
  const margin = Math.max(58, width * 0.055)
  const turn = Math.sin(item.phase + time * 2.1) >= 0 ? 1 : -1

  if (x - bounds.minPx < margin) {
    const pressure = 1 - (x - bounds.minPx) / margin
    item.vx += 0.000075 * pressure
    item.vy += 0.000052 * pressure * turn
  } else if (bounds.maxPx - x < margin) {
    const pressure = 1 - (bounds.maxPx - x) / margin
    item.vx -= 0.000075 * pressure
    item.vy += 0.000052 * pressure * turn
  }

  if (y - bounds.minPy < margin) {
    const pressure = 1 - (y - bounds.minPy) / margin
    item.vy += 0.000066 * pressure
    item.vx -= 0.00005 * pressure * turn
  } else if (bounds.maxPy - y < margin) {
    const pressure = 1 - (bounds.maxPy - y) / margin
    item.vy -= 0.000066 * pressure
    item.vx -= 0.00005 * pressure * turn
  }

  limitNoiseSpeed(item, 0.00034)
}

function turnFishAfterWallBounce(
  item: StreamNoise,
  nextPx: number,
  nextPy: number,
  bounds: ReturnType<typeof getNoiseBounds>,
  hitHorizontalEdge: boolean,
  hitVerticalEdge: boolean,
  time: number,
) {
  const turn = Math.sin(item.phase + time * 1.9) >= 0 ? 1 : -1
  if (hitHorizontalEdge) {
    item.vx = nextPx < bounds.minPx ? Math.max(item.vx, 0.00016) : Math.min(item.vx, -0.00016)
    item.vy += turn * 0.00014
  }
  if (hitVerticalEdge) {
    item.vy = nextPy < bounds.minPy ? Math.max(item.vy, 0.00014) : Math.min(item.vy, -0.00014)
    item.vx -= turn * 0.00014
  }
  limitNoiseSpeed(item, 0.00036)
}

function keepInsideBox(item: StreamNoise, width: number, height: number) {
  const bounds = getNoiseBounds(item, width, height)
  if (item.x < bounds.minX) {
    item.x = bounds.minX
    item.vx = Math.abs(item.vx)
  } else if (item.x > bounds.maxX) {
    item.x = bounds.maxX
    item.vx = -Math.abs(item.vx)
  }

  if (item.y < bounds.minY) {
    item.y = bounds.minY
    item.vy = Math.abs(item.vy)
  } else if (item.y > bounds.maxY) {
    item.y = bounds.maxY
    item.vy = -Math.abs(item.vy)
  }
}

function separateNoiseItems(items: StreamNoise[], width: number, height: number) {
  const textEraseActive = areAllSparksSameColor(items)
  const allTextGone = items.every((item) => item.kind !== 'text' || item.gone)

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]
      const b = items[j]
      if (a.gone || b.gone) continue
      if (a.burst > 0 || b.burst > 0) continue
      const ax = a.x * width
      const ay = a.y * height
      const bx = b.x * width
      const by = b.y * height
      const dx = bx - ax
      const dy = by - ay
      const distance = Math.max(0.001, Math.hypot(dx, dy))
      const minDistance = (a.size + b.size) * (8 + width * 0.004)
      if (distance >= minDistance) continue
      if (handleSparkTextCollision(a, b, textEraseActive)) continue
      if (allTextGone) handleSparkWaveCollision(a, b)

      const push = (minDistance - distance) * 0.5
      const nx = dx / distance
      const ny = dy / distance
      a.x -= (nx * push) / width
      a.y -= (ny * push) / height
      b.x += (nx * push) / width
      b.y += (ny * push) / height
      a.vx -= (nx * push * 0.000003) / width
      a.vy -= (ny * push * 0.000003) / height
      b.vx += (nx * push * 0.000003) / width
      b.vy += (ny * push * 0.000003) / height
      keepInsideBox(a, width, height)
      keepInsideBox(b, width, height)
    }
  }
}

function handleSparkWaveCollision(a: StreamNoise, b: StreamNoise) {
  const spark = a.kind === 'spark' && b.kind === 'wave' ? a : b.kind === 'spark' && a.kind === 'wave' ? b : null
  const wave = spark === a ? b : spark === b ? a : null
  if (!spark || !wave || spark.waveTouchCooldown > 0) return

  spark.vx *= 0.88
  spark.vy *= 0.88
  spark.waveTouchCooldown = 280
  spark.waveImpact = 1
  spark.touch = 1
  wave.waveImpact = 1
  wave.touch = Math.max(wave.touch, 0.7)
}

function handleSparkTextCollision(a: StreamNoise, b: StreamNoise, textEraseActive: boolean) {
  if (!textEraseActive) return false

  const spark = a.kind === 'spark' && b.kind === 'text' ? a : b.kind === 'spark' && a.kind === 'text' ? b : null
  const text = spark === a ? b : spark === b ? a : null
  if (!spark || !text) return false

  text.gone = true
  spark.touch = 1
  spark.calm = Math.min(1, spark.calm + 0.08)
  return true
}

function areAllSparksSameColor(items: StreamNoise[]) {
  const sparks = items.filter((item) => item.kind === 'spark' && !item.gone)
  if (sparks.length !== STREAM_NOISE_COUNTS.spark) return false
  const firstColor = getSparkColorIndex(sparks[0])
  return sparks.every((spark) => getSparkColorIndex(spark) === firstColor)
}

function getSparkColorIndex(item: StreamNoise) {
  return item.hitCount % SPARK_COLORS.length
}

function limitNoiseSpeed(item: StreamNoise, maxSpeed: number) {
  const speed = Math.hypot(item.vx, item.vy)
  if (speed <= maxSpeed || speed === 0) return
  const scale = maxSpeed / speed
  item.vx *= scale
  item.vy *= scale
}

function getNoiseBounds(item: StreamNoise, width: number, height: number) {
  const visualRadius = item.size * (12 + width * 0.008)
  const minPx = STREAM_EDGE_PADDING * width + visualRadius
  const maxPx = width - minPx
  const minPy = STREAM_EDGE_PADDING * height + visualRadius
  const maxPy = height - minPy
  return {
    minPx,
    maxPx,
    minPy,
    maxPy,
    minX: minPx / width,
    maxX: maxPx / width,
    minY: minPy / height,
    maxY: maxPy / height,
  }
}

function reflectAxis(position: number, velocity: number, min: number, max: number) {
  if (max <= min) return { position: (min + max) / 2, velocity: 0 }
  let nextPosition = position
  let nextVelocity = velocity
  for (let i = 0; i < 3; i++) {
    if (nextPosition > max) {
      nextPosition = max - (nextPosition - max)
      nextVelocity = -Math.abs(nextVelocity)
    } else if (nextPosition < min) {
      nextPosition = min + (min - nextPosition)
      nextVelocity = Math.abs(nextVelocity)
    } else {
      break
    }
  }
  return {
    position: Math.min(max, Math.max(min, nextPosition)),
    velocity: nextVelocity,
  }
}

function drawPlayerWake(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  time: number,
  restRatio: number,
  phase: StreamPhase,
  forceMode: StreamForceMode,
) {
  if (phase === 'idle') return
  ctx.save()
  ctx.globalAlpha = phase === 'paused' ? 0.2 : forceMode === 'none' ? 0.32 : 0.42
  ctx.strokeStyle = forceMode === 'attract' ? '#8000ff' : forceMode === 'repel' ? '#00a88a' : '#fff7d7'
  ctx.lineWidth = Math.max(2, width * 0.0022)
  const wakeBack = Math.min(width * 0.34, 360)
  const wakeFront = Math.min(width * (0.26 + restRatio * 0.16), 330)
  for (let i = 0; i < 7; i++) {
    const lane = i - 3
    ctx.beginPath()
    ctx.moveTo(x - wakeBack - i * 20, y + Math.sin(time + i) * 10)
    ctx.bezierCurveTo(
      x - wakeBack * 0.38,
      y - height * 0.09 + lane * 12,
      x + wakeFront * 0.36,
      y + height * 0.09 - lane * 9,
      x + wakeFront,
      y + Math.sin(time * 0.7 + i) * (14 + restRatio * 24),
    )
    ctx.stroke()
  }
  ctx.restore()
}

function drawCalmingBridge(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  ix: number,
  iy: number,
  influence: number,
  calm: number,
  kind: NoiseKind,
  width: number,
) {
  ctx.save()
  ctx.globalAlpha = 0.08 + influence * 0.28
  ctx.strokeStyle = calm > 0.65 ? '#fffaf0' : '#f2cf83'
  ctx.lineWidth = Math.max(1, width * 0.0012) + influence * (kind === 'wave' ? 5 : 3)

  if (kind === 'bubble') {
    ctx.beginPath()
    ctx.arc(ix, iy, 18 + influence * 34, 0, Math.PI * 2)
    ctx.stroke()
  } else if (kind === 'text') {
    ctx.setLineDash([2, 9])
    ctx.beginPath()
    ctx.moveTo(px, py)
    ctx.quadraticCurveTo((px + ix) / 2, (py + iy) / 2 - 18 * influence, ix, iy)
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.moveTo(px, py)
    ctx.quadraticCurveTo((px + ix) / 2, (py + iy) / 2 - 24 * influence, ix, iy)
    ctx.stroke()
  }
  ctx.restore()
}

function drawWater(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, calm: number) {
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#dceceb')
  gradient.addColorStop(0.46, '#edf1e4')
  gradient.addColorStop(1, '#cbdedc')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  ctx.save()
  ctx.globalAlpha = 0.2 - calm * 0.08
  ctx.strokeStyle = '#6e9fa3'
  ctx.lineWidth = Math.max(1, width * 0.001)
  for (let i = 0; i < STREAM_WATER_LINES; i++) {
    const y = height * (0.08 + i * 0.078) + Math.sin(time * 0.22 + i) * 8
    ctx.beginPath()
    for (let x = -20; x <= width + 20; x += 52) {
      const wave = Math.sin(x * 0.006 + time * 0.25 + i) * (10 - calm * 6)
      if (x === -20) ctx.moveTo(x, y + wave)
      else ctx.lineTo(x, y + wave)
    }
    ctx.stroke()
  }
  ctx.restore()
}

function drawFlowGuides(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, settled: number) {
  ctx.save()
  ctx.globalAlpha = 0.12 + settled * 0.22
  ctx.strokeStyle = '#f2cf83'
  ctx.lineWidth = Math.max(1, width * 0.0024)
  for (let i = 0; i < 4; i++) {
    const offset = (i - 1.5) * height * 0.16
    ctx.beginPath()
    ctx.moveTo(width * -0.05, height * 0.5 + offset)
    ctx.bezierCurveTo(width * 0.28, height * (0.24 + i * 0.08), width * 0.58, height * (0.75 - i * 0.07), width * 1.05, height * 0.42 + offset * 0.2)
    ctx.stroke()
  }
  ctx.restore()

  ctx.save()
  ctx.globalAlpha = 0.18 + settled * 0.3
  ctx.fillStyle = '#fffaf0'
  for (let i = 0; i < STREAM_FLOW_PARTICLES; i++) {
    const x = ((time * 0.025 + i * 0.109) % 1.08) * width - width * 0.04
    const y = (0.16 + ((i * 0.337) % 0.7)) * height + Math.sin(time * 0.2 + i) * 9
    ctx.beginPath()
    ctx.ellipse(x, y, 2.6 + settled * 2, 1.2 + settled * 1.2, -0.15, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawSparkAlignmentEffect(
  ctx: CanvasRenderingContext2D,
  items: StreamNoise[],
  width: number,
  height: number,
  time: number,
) {
  const sparks = items
    .filter((item) => item.kind === 'spark' && !item.gone)
    .sort((a, b) => a.id - b.id)
  if (sparks.length !== STREAM_NOISE_COUNTS.spark) return

  const color = SPARK_COLORS[getSparkColorIndex(sparks[0])]
  const pulse = 0.5 + Math.sin(time * 3.4) * 0.5

  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(1, width * 0.0014)
  ctx.globalAlpha = 0.1 + pulse * 0.14
  ctx.beginPath()
  sparks.forEach((spark, index) => {
    const x = spark.x * width
    const y = spark.y * height
    if (index === 0) ctx.moveTo(x, y)
    else {
      const previous = sparks[index - 1]
      const px = previous.x * width
      const py = previous.y * height
      ctx.quadraticCurveTo((px + x) / 2, (py + y) / 2 + Math.sin(time + index) * 18, x, y)
    }
  })
  ctx.closePath()
  ctx.stroke()

  ctx.globalAlpha = 0.12 + pulse * 0.2
  for (const spark of sparks) {
    const x = spark.x * width
    const y = spark.y * height
    const size = spark.size * (8 + width * 0.006)
    ctx.beginPath()
    ctx.arc(x, y, size * (2.5 + pulse * 0.8), 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}

function drawNoiseItem(
  ctx: CanvasRenderingContext2D,
  item: StreamNoise,
  width: number,
  height: number,
  time: number,
  influence: number,
  sparksSameColor: boolean,
) {
  const x = item.x * width
  const y = item.y * height
  const calm = item.calm
  const noise = 1 - calm
  const size = item.size * (8 + width * 0.006)
  const transformed = calm > 0.78
  const heading = Math.atan2(item.vy, item.vx)
  ctx.save()
  ctx.globalAlpha = transformed ? 0.52 + Math.sin(time * 0.7 + item.phase) * 0.05 : 0.24 + noise * 0.62
  ctx.translate(x, y)

  if (item.burst > 0) {
    const progress = 1 - item.burst
    const alpha = item.burst
    ctx.globalAlpha = alpha * 0.42
    ctx.fillStyle = '#fff7d7'
    ctx.beginPath()
    ctx.arc(0, 0, size * (0.45 + progress * 2.4), 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = alpha * 0.82
    ctx.strokeStyle = '#f2cf83'
    ctx.lineWidth = Math.max(1.5, size * 0.12)
    for (let ring = 0; ring < 3; ring++) {
      ctx.beginPath()
      ctx.arc(0, 0, size * (0.9 + progress * (2.6 + ring * 1.1)), 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.globalAlpha = alpha * 0.58
    ctx.strokeStyle = '#6f9fa1'
    for (let i = 0; i < 10; i++) {
      const angle = item.phase + i * 0.628
      const inner = size * (0.7 + progress * 1.1)
      const outer = size * (1.7 + progress * 4.8)
      ctx.beginPath()
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner)
      ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer)
      ctx.stroke()
    }
    ctx.restore()
    return
  }

  drawSparkWaveImpact(ctx, item, size, time)

  if (influence > 0.04) {
    ctx.save()
    ctx.globalAlpha = 0.12 + influence * 0.36
    ctx.fillStyle = '#fff7d7'
    ctx.beginPath()
    ctx.arc(0, 0, size * (1.15 + influence * 1.4), 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  if (item.kind === 'spark') {
    const sparkColorIndex = getSparkColorIndex(item)
    if (sparksSameColor) {
      const pulse = 0.5 + Math.sin(time * 4.2 + item.phase) * 0.5
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      ctx.globalAlpha = 0.26 + pulse * 0.24
      ctx.strokeStyle = SPARK_COLORS[sparkColorIndex]
      ctx.lineWidth = Math.max(1.4, size * 0.1)
      ctx.beginPath()
      ctx.arc(0, 0, size * (1.45 + pulse * 0.48), 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha = 0.2 + pulse * 0.18
      ctx.fillStyle = SPARK_COLORS[sparkColorIndex]
      ctx.beginPath()
      ctx.arc(0, 0, size * (1.9 + pulse * 0.42), 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
    if (sparkColorIndex === SPARK_GOLD_INDEX) {
      ctx.shadowColor = '#ffe8a3'
      ctx.shadowBlur = size * 3.8
      ctx.globalAlpha *= 0.72
      ctx.fillStyle = '#fff0a8'
      ctx.beginPath()
      ctx.arc(0, 0, size * 1.72, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha /= 0.72
      ctx.shadowBlur = size * 2.2
    }
    ctx.fillStyle = SPARK_COLORS[sparkColorIndex]
    ctx.beginPath()
    ctx.arc(0, 0, size * (0.72 + calm * 0.18), 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    if (transformed) {
      ctx.strokeStyle = '#fffaf0'
      ctx.lineWidth = Math.max(1, size * 0.08)
      ctx.beginPath()
      ctx.moveTo(-size * 0.92, 0)
      ctx.lineTo(size * 0.92, 0)
      ctx.moveTo(0, -size * 0.92)
      ctx.lineTo(0, size * 0.92)
      ctx.stroke()
    }
  } else if (item.kind === 'text') {
    ctx.rotate(heading * 0.35)
    ctx.strokeStyle = '#596f72'
    ctx.lineWidth = Math.max(1, size * 0.12)
    ctx.beginPath()
    ctx.moveTo(-size * 0.7, -size * 0.18)
    ctx.lineTo(-size * 0.15, size * 0.24)
    ctx.lineTo(size * 0.54, -size * 0.08)
    ctx.stroke()
  } else if (item.kind === 'wave') {
    ctx.rotate(heading * 0.55)
    ctx.strokeStyle = transformed ? '#5f999b' : calm > 0.7 ? '#a9c9c7' : '#345e63'
    ctx.lineWidth = Math.max(1, size * 0.1)
    for (let line = 0; line < (transformed ? 2 : 1); line++) {
      ctx.beginPath()
      for (let i = 0; i < 7; i++) {
        const xx = -size + i * size * 0.36
        const yy = (line - 0.5) * size * 0.32 + Math.sin(i * 1.4 + time * (0.5 + noise * 7)) * size * (0.04 + noise * 0.2)
        if (i === 0) ctx.moveTo(xx, yy)
        else ctx.lineTo(xx, yy)
      }
      ctx.stroke()
    }
  } else if (item.kind === 'fish') {
    ctx.rotate(heading)
    ctx.fillStyle = transformed ? '#7fb7aa' : calm > 0.65 ? '#a7c9bd' : '#1f3437'
    ctx.beginPath()
    ctx.ellipse(size * 0.08, 0, size * (0.68 + calm * 0.2), size * 0.28, Math.sin(time + item.phase) * 0.08, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(-size * 0.62, 0)
    ctx.lineTo(-size * 1.02, -size * 0.22)
    ctx.lineTo(-size * 0.94, 0)
    ctx.lineTo(-size * 1.02, size * 0.22)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = transformed || calm > 0.65 ? '#f0c766' : '#f3d39a'
    ctx.beginPath()
    ctx.arc(size * 0.5, -size * 0.06, Math.max(1.2, size * 0.07), 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.strokeStyle = transformed ? '#6f9fa1' : calm > 0.6 ? '#f7fbf8' : '#80999b'
    if (transformed) ctx.fillStyle = `rgba(111, 159, 161, ${Math.max(0.08, 0.2 - item.hitCount * 0.025)})`
    ctx.lineWidth = Math.max(1, size * 0.12)
    ctx.beginPath()
    ctx.arc(0, 0, size * (0.35 + calm * 0.62 + item.hitCount * 0.08), 0, Math.PI * 2)
    if (transformed) ctx.fill()
    ctx.stroke()
    if (item.kind === 'bubble' && item.hitCount > 0) {
      ctx.globalAlpha = 0.22 + item.hitCount * 0.06
      ctx.strokeStyle = '#f2cf83'
      ctx.beginPath()
      ctx.arc(0, 0, size * (0.68 + item.hitCount * 0.18), 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  if (calm > 0.55) {
    ctx.globalAlpha = transformed ? 0.42 : (calm - 0.55) * 0.7
    ctx.fillStyle = '#fffaf0'
    ctx.beginPath()
    ctx.arc(size * 0.35, -size * 0.3, size * 0.12, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawSparkWaveImpact(
  ctx: CanvasRenderingContext2D,
  item: StreamNoise,
  size: number,
  time: number,
) {
  if (item.waveImpact <= 0) return

  const fade = item.waveImpact
  const spread = 1 - fade
  const color = item.kind === 'spark' ? SPARK_COLORS[getSparkColorIndex(item)] : '#78c4ca'

  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.globalAlpha = 0.16 + fade * 0.52
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(1.4, size * (0.08 + fade * 0.08))
  ctx.beginPath()
  ctx.arc(0, 0, size * (1.15 + spread * 2.8), 0, Math.PI * 2)
  ctx.stroke()

  ctx.globalAlpha = fade * 0.46
  ctx.strokeStyle = '#fff8d7'
  ctx.lineWidth = Math.max(1, size * 0.07)
  for (let i = 0; i < 6; i++) {
    const angle = item.phase + time * 0.8 + i * 1.047
    const inner = size * (0.62 + spread * 1.2)
    const outer = size * (1.45 + spread * 2.15)
    ctx.beginPath()
    ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner)
    ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer)
    ctx.stroke()
  }

  if (item.kind === 'wave') {
    ctx.globalAlpha = fade * 0.34
    ctx.strokeStyle = '#d8fbff'
    ctx.lineWidth = Math.max(1, size * 0.06)
    for (let band = -1; band <= 1; band++) {
      ctx.beginPath()
      for (let i = 0; i < 9; i++) {
        const x = -size * 1.2 + i * size * 0.3
        const y =
          band * size * 0.22 +
          Math.sin(i * 1.3 + time * 2.6) * size * 0.08 * fade
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
  }
  ctx.restore()
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  restRatio: number,
  phase: StreamPhase,
  forceMode: StreamForceMode,
  width: number,
) {
  ctx.save()
  if (restRatio > 0) {
    ctx.globalAlpha = 0.18 + restRatio * 0.26
    ctx.strokeStyle = '#f4d28a'
    ctx.lineWidth = 2
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.arc(x, y, 58 + restRatio * 126 + i * 34 + Math.sin(time + i) * 4, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
  if (forceMode !== 'none') {
    drawPlayerForceField(ctx, x, y, time, forceMode, width)
  }

  const bob = Math.sin(time * 1.1) * 4
  ctx.translate(x, y + bob)
  ctx.globalAlpha = phase === 'paused' ? 0.86 : 1
  ctx.fillStyle = '#f8fbf4'
  ctx.strokeStyle = '#2f7f8f'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.ellipse(0, 0, 22, 13, -0.18, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#f0c766'
  ctx.beginPath()
  ctx.arc(8, -3, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawPlayerForceField(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  forceMode: StreamForceMode,
  width: number,
) {
  const attract = forceMode === 'attract'
  const color = attract ? '#8000ff' : '#00a88a'
  const drift = (time * 28) % 42
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(1.5, width * 0.0018)
  for (let i = 0; i < 4; i++) {
    const base = attract ? 142 - i * 28 - drift : 50 + i * 32 + drift
    const radius = Math.max(28, base)
    ctx.globalAlpha = 0.26 - i * 0.035
    ctx.beginPath()
    ctx.arc(x, y, radius, time * 0.45 + i, time * 0.45 + i + Math.PI * 1.38)
    ctx.stroke()
  }

  ctx.fillStyle = color
  ctx.globalAlpha = 0.22
  for (let i = 0; i < 8; i++) {
    const angle = time * 0.55 + i * (Math.PI / 4)
    const radius = attract ? 96 - ((time * 18 + i * 9) % 34) : 68 + ((time * 18 + i * 9) % 42)
    ctx.beginPath()
    ctx.ellipse(
      x + Math.cos(angle) * radius,
      y + Math.sin(angle) * radius,
      attract ? 3 : 5,
      attract ? 5 : 3,
      angle,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }
  ctx.restore()
}

function startStreamAudio(previous: StreamAudio | null) {
  if (previous) return previous
  const AudioContextClass =
    window.AudioContext ?? (window as Window & typeof globalThis & { webkitAudioContext?: new () => AudioContext }).webkitAudioContext
  if (!AudioContextClass) return null
  const context = new AudioContextClass()
  const gain = context.createGain()
  const filter = context.createBiquadFilter()
  const hum = context.createOscillator()
  const noiseGain = context.createGain()
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const noiseSource = context.createBufferSource()
  noiseSource.buffer = buffer
  noiseSource.loop = true
  filter.type = 'lowpass'
  filter.frequency.value = 1200
  hum.type = 'sine'
  hum.frequency.value = 84
  gain.gain.value = 0.0001
  noiseGain.gain.value = 0.018
  hum.connect(gain)
  noiseSource.connect(filter)
  filter.connect(noiseGain)
  noiseGain.connect(gain)
  gain.connect(context.destination)
  hum.start()
  noiseSource.start()
  context.resume()
  return { context, filter, gain, hum, noiseGain, noiseSource }
}

function updateStreamAudio(audio: StreamAudio | null, settled: number, phase: StreamPhase) {
  if (!audio) return
  const now = audio.context.currentTime
  const activeGain = phase === 'paused' ? 0.018 : 0.045
  audio.gain.gain.linearRampToValueAtTime(phase === 'idle' ? 0.0001 : activeGain, now + 0.4)
  audio.noiseGain.gain.linearRampToValueAtTime((phase === 'paused' ? 0.01 : 0.024) * (1 - settled) + 0.004, now + 0.4)
  audio.filter.frequency.linearRampToValueAtTime(520 + (1 - settled) * 1200, now + 0.5)
  audio.hum.frequency.linearRampToValueAtTime(78 - settled * 12, now + 0.8)
}

function ActionCardPractice({ actionCard, onDrawCard }: PracticeStageProps) {
  return (
    <>
      <div className="action-ticket">
        <div className="action-ticket-top">
          <span>行动卡</span>
          <em>{actionCard.lane}</em>
        </div>
        <strong>{actionCard.title}</strong>
        <p>{actionCard.body}</p>
        <small>{actionCard.done}</small>
      </div>
      <button type="button" className="utility-action" onClick={onDrawCard}>
        <Shuffle size={18} />
        换一张卡
      </button>
      <p className="practice-note">这组卡不处理任务，只让身体、环境或感官动一点。抽到不合适就换。</p>
    </>
  )
}

type HarborTearKind = 'soft' | 'heavy' | 'tangle'
type HarborShardKind = 'open' | 'still' | 'deep'

type HarborTear = {
  id: number
  x: number
  y: number
  baseX: number
  speed: number
  sway: number
  phase: number
  label: string
  glow: number
  soften: number
  kind: HarborTearKind
  done: boolean
}

type HarborShard = {
  id: number
  x: number
  y: number
  homeX: number
  homeY: number
  charge: number
  need: number
  repaired: boolean
  phrase: string
  kind: HarborShardKind
  focus: number
}

type HarborBead = {
  id: number
  x: number
  y: number
  orbit: number
  targetId: number | null
}

type HarborRipple = {
  x: number
  y: number
  radius: number
  alpha: number
  warm: boolean
}

type HarborPuddle = {
  id: number
  x: number
  y: number
  life: number
  label: string
  value: number
}

type HarborGame = {
  tears: HarborTear[]
  shards: HarborShard[]
  beads: HarborBead[]
  puddles: HarborPuddle[]
  ripples: HarborRipple[]
  pointerX: number
  pointerY: number
  targetX: number
  targetY: number
  lastTargetX: number
  lastTargetY: number
  calm: number
  nextBeadId: number
  nextPuddleId: number
  time: number
  promptShardId: number | null
  finalWarmStartedAt: number | null
}

const HARBOR_TEAR_LABELS = ['委屈', '想念', '空', '沉', '累', '酸', '冷', '怕']
const HARBOR_SHARD_NEEDS = [2, 3, 3, 4, 3]
const HARBOR_BEAD_CAP = 17
const HARBOR_FINAL_WARM_SECONDS = 14
const HARBOR_FINAL_SCENE_SECONDS = HARBOR_FINAL_WARM_SECONDS / 3
const HARBOR_FINAL_IMAGE_DELAY_SECONDS = 0.9
const HARBOR_FINAL_IMAGE_FADE_SECONDS = 3.4
const HARBOR_FINAL_SCENE_SOURCES = [
  '/harbor-scenes/warm-window.png',
  '/harbor-scenes/morning-field.png',
  '/harbor-scenes/lantern-sea.png',
]
const HARBOR_TEAR_SPAWN_Y = [0.12, -0.04, -0.2, -0.36, -0.54, -0.74, -0.94, -1.14, -1.34, -1.56, -1.78, -2.0, -2.24, -2.48]

let harborFinalSceneImages: HTMLImageElement[] | null = null

function getHarborFinalSceneImages() {
  if (typeof Image === 'undefined') return []
  if (!harborFinalSceneImages) {
    harborFinalSceneImages = HARBOR_FINAL_SCENE_SOURCES.map((source) => {
      const image = new Image()
      image.src = source
      return image
    })
  }

  return harborFinalSceneImages
}

type SootheSequenceStep = 'harbor' | 'weave' | 'garden' | 'bridge' | 'hearth'
const SOOTHE_SEQUENCE_STEPS: Array<{ id: SootheSequenceStep; label: string }> = [
  { id: 'harbor', label: '接泪' },
  { id: 'weave', label: '回声' },
  { id: 'garden', label: '花园' },
  { id: 'bridge', label: '星桥' },
  { id: 'hearth', label: '暖炉' },
]

function SelfSoothePractice({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<SootheSequenceStep>('harbor')

  return (
    <div className="soothe-sequence">
      <div className="soothe-progress" aria-label="选择伤心自愈关卡">
        {SOOTHE_SEQUENCE_STEPS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === step ? 'active' : ''}
            onClick={() => setStep(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {step === 'harbor' && <HarborSoothePractice onComplete={() => setStep('weave')} />}
      {step === 'weave' && <EchoOrganizePractice onComplete={() => setStep('garden')} />}
      {step === 'garden' && <SoftGardenPractice />}
      {step === 'bridge' && <StarBridgePractice onComplete={() => setStep('hearth')} />}
      {step === 'hearth' && <WarmHearthPractice onComplete={onComplete} />}
    </div>
  )
}

function HarborSoothePractice({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const gameRef = useRef<HarborGame | null>(null)
  const lastFrameRef = useRef(0)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const activeCanvas = canvas
    gameRef.current = createHarborGame()
    getHarborFinalSceneImages()
    lastFrameRef.current = performance.now()

    const moveFromClientPoint = (clientX: number, clientY: number) => {
      const game = gameRef.current
      if (!game) return
      const rect = activeCanvas.getBoundingClientRect()
      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return
      game.targetX = clamp01((clientX - rect.left) / rect.width)
      game.targetY = clamp01((clientY - rect.top) / rect.height)
    }

    const handleNativeMove = (event: globalThis.MouseEvent | globalThis.PointerEvent) => {
      moveFromClientPoint(event.clientX, event.clientY)
    }

    window.addEventListener('mousemove', handleNativeMove, true)
    window.addEventListener('pointermove', handleNativeMove, true)
    window.addEventListener('click', handleNativeMove, true)

    const drawFrame = (now: number) => {
      const game = gameRef.current
      const ctx = activeCanvas.getContext('2d')
      if (!game || !ctx) return

      const { width, height, dpr } = resizeHarborCanvas(activeCanvas)
      const dt = Math.min(0.034, (now - lastFrameRef.current) / 1000)
      lastFrameRef.current = now
      updateHarborGame(game, dt)
      drawHarborGame(ctx, game, width, height, dpr)
      if (
        !completedRef.current
        && game.finalWarmStartedAt !== null
        && game.time - game.finalWarmStartedAt > HARBOR_FINAL_WARM_SECONDS
      ) {
        completedRef.current = true
        window.setTimeout(() => onCompleteRef.current(), 620)
      }

      animationRef.current = window.requestAnimationFrame(drawFrame)
    }

    animationRef.current = window.requestAnimationFrame(drawFrame)

    return () => {
      if (animationRef.current) window.cancelAnimationFrame(animationRef.current)
      window.removeEventListener('mousemove', handleNativeMove, true)
      window.removeEventListener('pointermove', handleNativeMove, true)
      window.removeEventListener('click', handleNativeMove, true)
    }
  }, [])

  function moveLantern(event: PointerEvent<HTMLCanvasElement> | MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    const game = gameRef.current
    if (!canvas || !game) return

    const rect = canvas.getBoundingClientRect()
    game.targetX = clamp01((event.clientX - rect.left) / rect.width)
    game.targetY = clamp01((event.clientY - rect.top) / rect.height)
  }

  return (
    <>
      <div className="harbor-game">
        <canvas
          ref={canvasRef}
          className="harbor-canvas"
          aria-label="移动暖灯接住泪滴，把暖珠带到裂片旁"
          onPointerDown={moveLantern}
          onPointerMove={moveLantern}
          onMouseDown={moveLantern}
          onMouseMove={moveLantern}
          onClick={moveLantern}
        />
      </div>
    </>
  )
}

type GardenSeed = {
  id: number
  x: number
  y: number
  water: number
  warm: number
  bloom: number
  phase: number
  tone: string
  pulse: number
  shed: number
}

type GardenDew = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  phase: number
  charge: number
  heldSlot: number | null
  returning: number
}

type GardenPetal = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  tone: string
  phase: number
}

type GardenMote = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  phase: number
  energy: number
  held: boolean
  tone: string
  counted: boolean
}

type GardenStone = {
  id: number
  x: number
  y: number
  soft: number
  phase: number
  open: boolean
  pulse: number
}

type SoftGardenGame = {
  pointer: {
    x: number
    y: number
    targetX: number
    targetY: number
    speed: number
  }
  seeds: GardenSeed[]
  dews: GardenDew[]
  motes: GardenMote[]
  stones: GardenStone[]
  petals: GardenPetal[]
  nextDewId: number
  nextMoteId: number
  collectedMotes: number
  donutReady: boolean
  donutMorph: number
  donutPulse: number
  time: number
  completedAt: number | null
}

type EchoSegment = {
  id: number
  pair: number
  x: number
  y: number
  vx: number
  vy: number
  phase: number
  length: number
  tone: string
  warm: number
  locked: boolean
}

function EchoOrganizePractice({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const completedRef = useRef(false)
  const lastFrameRef = useRef(0)
  const onCompleteRef = useRef(onComplete)
  const pointerRef = useRef({ x: 0.5, y: 0.52, targetX: 0.5, targetY: 0.52, speed: 0 })
  const segmentsRef = useRef<EchoSegment[]>(
    [
      { id: 0, pair: 0, x: 0.18, y: 0.28, vx: 0.018, vy: 0.012, phase: 0.2, length: 0.13, tone: '#f2a96e', warm: 0, locked: false },
      { id: 1, pair: 0, x: 0.78, y: 0.68, vx: -0.012, vy: -0.014, phase: 0.2, length: 0.13, tone: '#f2a96e', warm: 0, locked: false },
      { id: 2, pair: 1, x: 0.26, y: 0.72, vx: 0.014, vy: -0.01, phase: 1.4, length: 0.16, tone: '#a4b58a', warm: 0, locked: false },
      { id: 3, pair: 1, x: 0.74, y: 0.24, vx: -0.016, vy: 0.012, phase: 1.4, length: 0.16, tone: '#a4b58a', warm: 0, locked: false },
      { id: 4, pair: 2, x: 0.46, y: 0.18, vx: 0.01, vy: 0.016, phase: 2.6, length: 0.11, tone: '#d49aa2', warm: 0, locked: false },
      { id: 5, pair: 2, x: 0.56, y: 0.78, vx: -0.014, vy: -0.01, phase: 2.6, length: 0.11, tone: '#d49aa2', warm: 0, locked: false },
    ],
  )

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    lastFrameRef.current = performance.now()

    const render = (now: number) => {
      const dt = Math.min(0.034, (now - lastFrameRef.current) / 1000)
      lastFrameRef.current = now
      const { width, height, dpr } = resizeHarborCanvas(canvas)
      updateEchoSegments(segmentsRef.current, pointerRef.current, dt)
      drawEchoOrganize(ctx, segmentsRef.current, pointerRef.current, width, height, dpr, now / 1000)
      if (!completedRef.current && segmentsRef.current.every((segment) => segment.locked)) {
        completedRef.current = true
        window.setTimeout(() => onCompleteRef.current(), 900)
      }
      animationRef.current = window.requestAnimationFrame(render)
    }

    animationRef.current = window.requestAnimationFrame(render)
    return () => {
      if (animationRef.current) window.cancelAnimationFrame(animationRef.current)
    }
  }, [])

  function moveLight(event: PointerEvent<HTMLCanvasElement> | MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    pointerRef.current.targetX = clamp01((event.clientX - rect.left) / rect.width)
    pointerRef.current.targetY = clamp01((event.clientY - rect.top) / rect.height)
  }

  return (
    <div className="harbor-game soothe-canvas-game">
      <canvas
        ref={canvasRef}
        className="harbor-canvas"
        aria-label="移动暖光整理回声"
        onPointerDown={moveLight}
        onPointerMove={moveLight}
        onMouseDown={moveLight}
        onMouseMove={moveLight}
        onClick={moveLight}
      />
    </div>
  )
}

function updateEchoSegments(
  segments: EchoSegment[],
  pointer: { x: number; y: number; targetX: number; targetY: number; speed: number },
  dt: number,
) {
  const previousX = pointer.x
  const previousY = pointer.y
  pointer.x += (pointer.targetX - pointer.x) * Math.min(1, dt * 10)
  pointer.y += (pointer.targetY - pointer.y) * Math.min(1, dt * 10)
  pointer.speed += ((distance(pointer.x, pointer.y, previousX, previousY) / Math.max(dt, 0.001)) - pointer.speed) * Math.min(1, dt * 7)

  segments.forEach((segment) => {
    if (segment.locked) {
      segment.vx *= 0.88
      segment.vy *= 0.88
      return
    }

    const pushDistance = distance(pointer.x, pointer.y, segment.x, segment.y)
    if (pushDistance < 0.19) {
      const angle = Math.atan2(segment.y - pointer.y, segment.x - pointer.x)
      const force = (0.19 - pushDistance) * (pointer.speed > 0.8 ? 0.28 : 0.55)
      segment.vx += Math.cos(angle) * force * dt
      segment.vy += Math.sin(angle) * force * dt
    }

    segments.forEach((other) => {
      if (other.id <= segment.id || other.locked) return
      const pairDistance = distance(segment.x, segment.y, other.x, other.y)
      if (pairDistance > 0.24) return

      const samePair = segment.pair === other.pair
      const dx = other.x - segment.x
      const dy = other.y - segment.y
      const angle = Math.atan2(dy, dx)
      if (samePair) {
        const stable = pointer.speed < 0.55 ? 1 : 0.35
        const pull = (0.24 - pairDistance) * 0.26 * stable
        segment.vx += Math.cos(angle) * pull * dt
        segment.vy += Math.sin(angle) * pull * dt
        other.vx -= Math.cos(angle) * pull * dt
        other.vy -= Math.sin(angle) * pull * dt
        const warmth = dt * clamp01((0.2 - pairDistance) / 0.2) * stable * 0.75
        segment.warm = clamp01(segment.warm + warmth)
        other.warm = clamp01(other.warm + warmth)
        if (segment.warm > 0.98 && other.warm > 0.98 && pairDistance < 0.12) {
          const midX = (segment.x + other.x) / 2
          const midY = (segment.y + other.y) / 2
          segment.x = midX - 0.045
          other.x = midX + 0.045
          segment.y = midY
          other.y = midY
          segment.locked = true
          other.locked = true
        }
      } else {
        const repel = (0.24 - pairDistance) * 0.18
        segment.vx -= Math.cos(angle) * repel * dt
        segment.vy -= Math.sin(angle) * repel * dt
        other.vx += Math.cos(angle) * repel * dt
        other.vy += Math.sin(angle) * repel * dt
      }
    })

    segment.x += segment.vx * dt
    segment.y += segment.vy * dt
    segment.vx *= 0.985
    segment.vy *= 0.985
    if (segment.x < 0.1 || segment.x > 0.9) segment.vx *= -0.9
    if (segment.y < 0.16 || segment.y > 0.84) segment.vy *= -0.9
    segment.x = Math.max(0.1, Math.min(0.9, segment.x))
    segment.y = Math.max(0.16, Math.min(0.84, segment.y))
    segment.warm = clamp01(segment.warm - dt * 0.018)
  })
}

function drawEchoOrganize(
  ctx: CanvasRenderingContext2D,
  segments: EchoSegment[],
  pointer: { x: number; y: number; speed: number },
  width: number,
  height: number,
  dpr: number,
  time: number,
) {
  ctx.save()
  ctx.scale(dpr, dpr)
  const totalWarm = segments.reduce((sum, segment) => sum + segment.warm + (segment.locked ? 0.35 : 0), 0) / segments.length
  const background = ctx.createLinearGradient(0, 0, width, height)
  background.addColorStop(0, mixColor('#d8e2e5', '#ffe4c2', totalWarm))
  background.addColorStop(0.58, mixColor('#edf0ea', '#fff0d4', totalWarm))
  background.addColorStop(1, mixColor('#c9d5d5', '#d8baa1', totalWarm))
  ctx.fillStyle = background
  ctx.fillRect(0, 0, width, height)

  for (let i = 0; i < 24; i += 1) {
    const y = ((i * 39 + time * 12) % (height + 80)) - 40
    ctx.strokeStyle = `rgba(93, 119, 126, ${0.08 + totalWarm * 0.05})`
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let x = -20; x <= width + 20; x += 32) {
      const waveY = y + Math.sin(time * 0.8 + x * 0.03 + i) * 7
      if (x === -20) ctx.moveTo(x, waveY)
      else ctx.lineTo(x, waveY)
    }
    ctx.stroke()
  }

  segments.forEach((segment) => {
    const mate = segments.find((other) => other.pair === segment.pair && other.id !== segment.id)
    if (!mate || segment.id > mate.id) return
    const close = clamp01((0.24 - distance(segment.x, segment.y, mate.x, mate.y)) / 0.24)
    const startX = segment.x * width
    const startY = segment.y * height
    const endX = mate.x * width
    const endY = mate.y * height
    const controlX = width * 0.5
    const controlY = height * (0.44 + segment.pair * 0.06)
    ctx.strokeStyle = segment.locked ? `rgba(255, 216, 147, ${0.22 + close * 0.32})` : `rgba(255, 220, 168, ${close * 0.2})`
    ctx.lineWidth = segment.locked ? 3.2 : 2
    ctx.setLineDash(segment.locked ? [] : [2, 16])
    ctx.lineDashOffset = -time * 18
    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.quadraticCurveTo(controlX, controlY, endX, endY)
    ctx.stroke()
    ctx.setLineDash([])
    if (segment.locked) {
      for (let i = 1; i < 6; i += 1) {
        const t = i / 6
        const inv = 1 - t
        const px = inv * inv * startX + 2 * inv * t * controlX + t * t * endX
        const py = inv * inv * startY + 2 * inv * t * controlY + t * t * endY
        ctx.globalAlpha = 0.18 + Math.sin(time * 1.4 + i + segment.pair) * 0.04
        ctx.fillStyle = '#ffe1a2'
        ctx.beginPath()
        ctx.arc(px, py, 3 + (i % 2), 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }
  })

  segments.forEach((segment) => {
    drawEchoSegment(ctx, segment, width, height, time)
  })

  const speedGlow = clamp01(1 - pointer.speed / 0.8)
  ctx.globalAlpha = 0.16 + speedGlow * 0.12
  ctx.fillStyle = '#ffd38d'
  ctx.beginPath()
  ctx.arc(pointer.x * width, pointer.y * height, 82, 0, Math.PI * 2)
  ctx.fill()
  drawSootheHandLight(ctx, pointer.x * width, pointer.y * height, 58, '#ffd38d')
  ctx.restore()
}

function drawEchoSegment(ctx: CanvasRenderingContext2D, segment: EchoSegment, width: number, height: number, time: number) {
  const x = segment.x * width
  const y = segment.y * height
  const warm = segment.locked ? 1 : segment.warm
  const shardWidth = Math.max(46, segment.length * width * 0.58)
  const shardHeight = 32 + segment.pair * 4
  const shimmer = 0.5 + Math.sin(time * 1.2 + segment.phase) * 0.5
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate((segment.id % 2 === 0 ? -0.18 : 0.18) + Math.sin(time * 0.5 + segment.phase) * 0.04)
  ctx.shadowColor = segment.tone
  ctx.shadowBlur = warm * 22

  const shardFill = ctx.createLinearGradient(-shardWidth * 0.5, -shardHeight, shardWidth * 0.5, shardHeight)
  shardFill.addColorStop(0, mixColor('#eff7f5', '#fff2c8', warm))
  shardFill.addColorStop(0.38, mixColor('#b9c9ca', segment.tone, warm * 0.85))
  shardFill.addColorStop(1, mixColor('#647b80', '#c77d5a', warm))
  ctx.fillStyle = shardFill
  ctx.strokeStyle = segment.locked ? 'rgba(255, 241, 198, 0.92)' : 'rgba(255, 255, 255, 0.55)'
  ctx.lineWidth = 1.6 + warm
  ctx.beginPath()
  ctx.moveTo(-shardWidth * 0.48, -2)
  ctx.quadraticCurveTo(-shardWidth * 0.32, -shardHeight * 0.72, 0, -shardHeight * 0.54)
  ctx.quadraticCurveTo(shardWidth * 0.38, -shardHeight * 0.34, shardWidth * 0.5, 1)
  ctx.quadraticCurveTo(shardWidth * 0.26, shardHeight * 0.62, -shardWidth * 0.12, shardHeight * 0.5)
  ctx.quadraticCurveTo(-shardWidth * 0.46, shardHeight * 0.36, -shardWidth * 0.48, -2)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.shadowBlur = 0

  ctx.globalAlpha = 0.2 + warm * 0.35
  ctx.fillStyle = '#fff7d8'
  ctx.beginPath()
  ctx.ellipse(-shardWidth * 0.18, -shardHeight * 0.14, shardWidth * 0.16, shardHeight * 0.18, -0.45, 0, Math.PI * 2)
  ctx.fill()

  ctx.globalAlpha = 0.34 + warm * 0.38
  ctx.strokeStyle = '#fff2cf'
  ctx.lineWidth = 1.6
  ctx.lineCap = 'round'
  for (let i = 0; i < 3; i += 1) {
    const offset = (i - 1) * shardHeight * 0.24
    ctx.beginPath()
    ctx.moveTo(-shardWidth * 0.24, offset)
    ctx.quadraticCurveTo(0, offset - 6 - shimmer * 2, shardWidth * 0.24, offset - 1)
    ctx.stroke()
  }

  ctx.globalAlpha = 0.22 + warm * 0.3
  ctx.strokeStyle = segment.tone
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.arc(0, 0, 32 + warm * 12, -0.45, Math.PI * 1.15)
  ctx.stroke()
  if (segment.locked) {
    ctx.globalAlpha = 0.16
    ctx.fillStyle = segment.tone
    ctx.beginPath()
    ctx.ellipse(0, 0, 56, 42, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

type SoothePointer = {
  x: number
  y: number
  targetX: number
  targetY: number
  speed: number
}

type BridgeSlot = {
  id: number
  x: number
  y: number
  phase: number
}

type BridgeStar = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  slot: number | null
  warm: number
  phase: number
  tone: string
}

type StarBridgeGame = {
  pointer: SoothePointer
  slots: BridgeSlot[]
  stars: BridgeStar[]
  time: number
  completedAt: number | null
}

function StarBridgePractice({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const lastFrameRef = useRef(0)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  const gameRef = useRef<StarBridgeGame>(createStarBridgeGame())

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    lastFrameRef.current = performance.now()

    const render = (now: number) => {
      const dt = Math.min(0.034, (now - lastFrameRef.current) / 1000)
      lastFrameRef.current = now
      const { width, height, dpr } = resizeHarborCanvas(canvas)
      updateStarBridge(gameRef.current, dt)
      drawStarBridge(ctx, gameRef.current, width, height, dpr)
      if (
        !completedRef.current
        && gameRef.current.completedAt !== null
        && gameRef.current.time - gameRef.current.completedAt > 1.35
      ) {
        completedRef.current = true
        window.setTimeout(() => onCompleteRef.current(), 420)
      }
      animationRef.current = window.requestAnimationFrame(render)
    }

    animationRef.current = window.requestAnimationFrame(render)
    return () => {
      if (animationRef.current) window.cancelAnimationFrame(animationRef.current)
    }
  }, [])

  function moveLight(event: PointerEvent<HTMLCanvasElement> | MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const pointer = gameRef.current.pointer
    pointer.targetX = clamp01((event.clientX - rect.left) / rect.width)
    pointer.targetY = clamp01((event.clientY - rect.top) / rect.height)
  }

  return (
    <div className="harbor-game soothe-canvas-game">
      <canvas
        ref={canvasRef}
        className="harbor-canvas"
        aria-label="移动暖光搭起星桥"
        onPointerDown={moveLight}
        onPointerMove={moveLight}
        onMouseDown={moveLight}
        onMouseMove={moveLight}
        onClick={moveLight}
      />
    </div>
  )
}

function createStarBridgeGame(): StarBridgeGame {
  const slots = Array.from({ length: 11 }, (_, index) => {
    const t = index / 10
    return {
      id: index,
      x: 0.13 + t * 0.74,
      y: 0.67 - Math.sin(t * Math.PI) * 0.3,
      phase: index * 0.41,
    }
  })
  const tones = ['#ffe09a', '#ffd0a7', '#f1b0a3', '#b7cf9a', '#9fc9ca', '#d2b1d6']
  return {
    pointer: { x: 0.5, y: 0.68, targetX: 0.5, targetY: 0.68, speed: 0 },
    slots,
    stars: Array.from({ length: slots.length }, (_, index) => ({
      id: index,
      x: 0.12 + ((index * 0.187) % 0.78),
      y: 0.2 + ((index * 0.317) % 0.56),
      vx: Math.sin(index * 1.2) * 0.018,
      vy: Math.cos(index * 1.7) * 0.016,
      slot: null,
      warm: 0,
      phase: index * 0.66,
      tone: tones[index % tones.length],
    })),
    time: 0,
    completedAt: null,
  }
}

function updateStarBridge(game: StarBridgeGame, dt: number) {
  game.time += dt
  const { pointer } = game
  const prevX = pointer.x
  const prevY = pointer.y
  pointer.x += (pointer.targetX - pointer.x) * Math.min(1, dt * 12)
  pointer.y += (pointer.targetY - pointer.y) * Math.min(1, dt * 12)
  pointer.speed = Math.hypot(pointer.x - prevX, pointer.y - prevY) / Math.max(dt, 0.001)

  game.stars.forEach((star) => {
    if (star.slot !== null) {
      const slot = game.slots[star.slot]
      star.x += (slot.x - star.x) * Math.min(1, dt * 7)
      star.y += (slot.y - star.y) * Math.min(1, dt * 7)
      star.warm = clamp01(star.warm + dt * 0.75)
      return
    }

    const close = distance(pointer.x, pointer.y, star.x, star.y)
    if (close < 0.18) {
      const angle = Math.atan2(pointer.y - star.y, pointer.x - star.x)
      const pull = (0.18 - close) * (pointer.speed < 1.1 ? 0.7 : 0.34)
      star.vx += Math.cos(angle) * pull * dt
      star.vy += Math.sin(angle) * pull * dt
      star.warm = clamp01(star.warm + dt * 0.45)
    } else {
      star.warm = clamp01(star.warm - dt * 0.06)
    }

    const openSlot = game.slots
      .filter((slot) => !game.stars.some((other) => other.slot === slot.id))
      .sort((a, b) => distance(star.x, star.y, a.x, a.y) - distance(star.x, star.y, b.x, b.y))[0]
    if (openSlot && star.warm > 0.38 && distance(star.x, star.y, openSlot.x, openSlot.y) < 0.085) {
      star.slot = openSlot.id
      star.vx = 0
      star.vy = 0
      star.warm = 1
      return
    }

    star.x += star.vx * dt + Math.sin(game.time * 0.6 + star.phase) * dt * 0.01
    star.y += star.vy * dt + Math.cos(game.time * 0.5 + star.phase) * dt * 0.008
    star.vx *= 0.988
    star.vy *= 0.988
    if (star.x < 0.07 || star.x > 0.93) star.vx *= -0.8
    if (star.y < 0.14 || star.y > 0.86) star.vy *= -0.8
    star.x = Math.max(0.07, Math.min(0.93, star.x))
    star.y = Math.max(0.14, Math.min(0.86, star.y))
  })

  if (game.completedAt === null && game.stars.every((star) => star.slot !== null)) {
    game.completedAt = game.time
  }
}

function drawStarBridge(ctx: CanvasRenderingContext2D, game: StarBridgeGame, width: number, height: number, dpr: number) {
  ctx.save()
  ctx.scale(dpr, dpr)
  const settled = game.stars.filter((star) => star.slot !== null).length / game.stars.length
  const completeGlow = game.completedAt === null ? 0 : smoothStep(clamp01((game.time - game.completedAt) / 1.2))
  const background = ctx.createLinearGradient(0, 0, 0, height)
  background.addColorStop(0, mixColor('#cadce2', '#ffdfaa', Math.max(settled, completeGlow)))
  background.addColorStop(0.62, mixColor('#e9eeea', '#fff1cb', Math.max(settled, completeGlow)))
  background.addColorStop(1, mixColor('#a8bfb9', '#d1b46f', Math.max(settled, completeGlow)))
  ctx.fillStyle = background
  ctx.fillRect(0, 0, width, height)

  ctx.lineCap = 'round'
  ctx.strokeStyle = `rgba(255, 224, 154, ${0.2 + settled * 0.36})`
  ctx.lineWidth = 8 + completeGlow * 5
  ctx.setLineDash([8, 18])
  ctx.lineDashOffset = -game.time * 18
  ctx.beginPath()
  game.slots.forEach((slot, index) => {
    const x = slot.x * width
    const y = slot.y * height
    if (index === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()
  ctx.setLineDash([])

  if (completeGlow > 0) {
    const centerX = width * 0.5
    const centerY = height * 0.52
    const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * (0.22 + completeGlow * 0.24))
    glow.addColorStop(0, `rgba(255, 243, 194, ${0.34 * completeGlow})`)
    glow.addColorStop(0.42, `rgba(255, 210, 132, ${0.18 * completeGlow})`)
    glow.addColorStop(1, 'rgba(255, 210, 132, 0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, width, height)

    ctx.globalAlpha = 0.24 * completeGlow
    ctx.strokeStyle = '#fff3bf'
    ctx.lineWidth = 2
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath()
      game.slots.forEach((slot, index) => {
        const x = slot.x * width
        const y = slot.y * height + Math.sin(game.time * 1.1 + i + slot.phase) * (2 + i)
        if (index === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }

  game.slots.forEach((slot) => {
    const filled = game.stars.some((star) => star.slot === slot.id)
    const x = slot.x * width
    const y = slot.y * height
    ctx.globalAlpha = filled ? 0.42 : 0.2
    ctx.strokeStyle = filled ? '#fff0bd' : '#d8f1f5'
    ctx.lineWidth = filled ? 4 : 2
    ctx.beginPath()
    ctx.arc(x, y, filled ? 22 : 15, 0, Math.PI * 2)
    ctx.stroke()
  })

  game.stars.forEach((star) => {
    const x = star.x * width
    const y = star.y * height
    const r = 9 + star.warm * 7
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(game.time * 0.3 + star.phase)
    ctx.globalAlpha = 0.14 + star.warm * 0.24
    ctx.fillStyle = star.tone
    ctx.beginPath()
    ctx.arc(0, 0, r * 3.4, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 0.72 + star.warm * 0.22
    ctx.fillStyle = mixColor('#d8f1f5', star.tone, star.warm)
    ctx.beginPath()
    for (let i = 0; i < 10; i += 1) {
      const angle = (Math.PI * 2 * i) / 10
      const radius = i % 2 === 0 ? r : r * 0.45
      const px = Math.cos(angle) * radius
      const py = Math.sin(angle) * radius
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  })

  drawSootheHandLight(ctx, game.pointer.x * width, game.pointer.y * height, 74, '#ffe1a0')
  ctx.restore()
}

type HearthCoal = {
  id: number
  x: number
  y: number
  heat: number
  phase: number
  pulse: number
}

type HearthFrost = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  melt: number
  phase: number
  size: number
  toughness: number
  chill: number
}

type HearthParticle = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  tone: string
  kind: 'ember' | 'steam' | 'flare'
}

type WarmHearthGame = {
  pointer: SoothePointer
  coals: HearthCoal[]
  frosts: HearthFrost[]
  particles: HearthParticle[]
  nextParticleId: number
  charge: number
  time: number
  completedAt: number | null
}

function WarmHearthPractice({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const lastFrameRef = useRef(0)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  const gameRef = useRef<WarmHearthGame>(createWarmHearthGame())

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    lastFrameRef.current = performance.now()

    const render = (now: number) => {
      const dt = Math.min(0.034, (now - lastFrameRef.current) / 1000)
      lastFrameRef.current = now
      const { width, height, dpr } = resizeHarborCanvas(canvas)
      updateWarmHearth(gameRef.current, dt)
      drawWarmHearth(ctx, gameRef.current, width, height, dpr)
      if (
        !completedRef.current
        && gameRef.current.completedAt !== null
        && gameRef.current.time - gameRef.current.completedAt > 2.4
      ) {
        completedRef.current = true
        window.setTimeout(() => onCompleteRef.current(), 520)
      }
      animationRef.current = window.requestAnimationFrame(render)
    }

    animationRef.current = window.requestAnimationFrame(render)
    return () => {
      if (animationRef.current) window.cancelAnimationFrame(animationRef.current)
    }
  }, [])

  function moveLight(event: PointerEvent<HTMLCanvasElement> | MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const pointer = gameRef.current.pointer
    pointer.targetX = clamp01((event.clientX - rect.left) / rect.width)
    pointer.targetY = clamp01((event.clientY - rect.top) / rect.height)
  }

  return (
    <div className="harbor-game soothe-canvas-game">
      <canvas
        ref={canvasRef}
        className="harbor-canvas"
        aria-label="移动暖光守住暖炉"
        onPointerDown={moveLight}
        onPointerMove={moveLight}
        onMouseDown={moveLight}
        onMouseMove={moveLight}
        onClick={moveLight}
      />
    </div>
  )
}

function createWarmHearthGame(): WarmHearthGame {
  return {
    pointer: { x: 0.5, y: 0.62, targetX: 0.5, targetY: 0.62, speed: 0 },
    coals: [
      { id: 0, x: 0.24, y: 0.76, heat: 0.36, phase: 0.2, pulse: 0 },
      { id: 1, x: 0.37, y: 0.82, heat: 0.48, phase: 1.1, pulse: 0 },
      { id: 2, x: 0.5, y: 0.78, heat: 0.42, phase: 2.0, pulse: 0 },
      { id: 3, x: 0.63, y: 0.83, heat: 0.44, phase: 2.8, pulse: 0 },
      { id: 4, x: 0.76, y: 0.77, heat: 0.34, phase: 3.6, pulse: 0 },
    ],
    frosts: Array.from({ length: 22 }, (_, index) => ({
      id: index,
      x: 0.07 + ((index * 0.211) % 0.86),
      y: 0.13 + ((index * 0.173) % 0.52),
      vx: Math.sin(index * 1.6) * (0.012 + (index % 3) * 0.003),
      vy: Math.cos(index * 1.1) * (0.01 + (index % 4) * 0.002),
      melt: 0,
      phase: index * 0.54,
      size: 0.78 + (index % 5) * 0.12,
      toughness: 0.9 + (index % 4) * 0.18,
      chill: 0.35 + (index % 6) * 0.08,
    })),
    particles: [],
    nextParticleId: 0,
    charge: 0.12,
    time: 0,
    completedAt: null,
  }
}

function updateWarmHearth(game: WarmHearthGame, dt: number) {
  game.time += dt
  const pointer = game.pointer
  const prevX = pointer.x
  const prevY = pointer.y
  pointer.x += (pointer.targetX - pointer.x) * Math.min(1, dt * 12)
  pointer.y += (pointer.targetY - pointer.y) * Math.min(1, dt * 12)
  pointer.speed = Math.hypot(pointer.x - prevX, pointer.y - prevY) / Math.max(dt, 0.001)
  const steadyLight = clamp01(1 - pointer.speed / 1.18)
  const completed = game.completedAt !== null

  const averageHeat = game.coals.reduce((sum, coal) => sum + coal.heat, 0) / game.coals.length
  const coldPressure = game.frosts.reduce((sum, frost) => sum + (1 - frost.melt) * frost.chill, 0) / game.frosts.length
  game.charge = clamp01(game.charge - dt * (0.055 + coldPressure * 0.035) + (completed ? dt * 0.28 : 0))
  game.coals.forEach((coal) => {
    const near = clamp01((0.15 - distance(pointer.x, pointer.y, coal.x, coal.y)) / 0.15)
    const heatGain = near * steadyLight * dt * 0.82
    coal.heat = clamp01(coal.heat - dt * (completed ? 0 : 0.034 + coldPressure * 0.014) + heatGain)
    coal.pulse = Math.max(0, Math.max(coal.pulse - dt * 1.7, heatGain * 4.5))
    if (near > 0.02 && steadyLight > 0.18) {
      game.charge = Math.min(0.42 + averageHeat * 0.64, game.charge + near * steadyLight * dt * 0.7)
      if (heatGain > 0.004 && game.particles.length < 90 && Math.random() < 0.48) {
        addHearthParticles(game, coal.x, coal.y - 0.035, 1, 'ember', '#ffb35f')
      }
    }
  })

  game.frosts.forEach((frost) => {
    if (frost.melt >= 1) return
    const near = clamp01((0.145 + frost.size * 0.025 - distance(pointer.x, pointer.y, frost.x, frost.y)) / (0.145 + frost.size * 0.025))
    const coalSupport = clamp01((averageHeat - 0.42) / 0.42)
    if (near > 0 && game.charge > 0.24 && steadyLight > 0.16) {
      const melt = dt * near * steadyLight * coalSupport * (0.28 + game.charge * 0.7) / frost.toughness
      frost.melt = clamp01(frost.melt + melt)
      game.charge = Math.max(0.04, game.charge - melt * (0.22 + frost.toughness * 0.05))
      if (melt > 0.0018 && game.particles.length < 90 && Math.random() < 0.62) {
        addHearthParticles(game, frost.x, frost.y, 1, frost.melt > 0.72 ? 'flare' : 'steam', '#ffd28e')
      }
    } else if (!completed && frost.melt > 0 && frost.melt < 0.98) {
      frost.melt = clamp01(frost.melt - dt * coldPressure * 0.012 * (1 - coalSupport * 0.65))
    }
    const driftScale = 1 + coldPressure * 0.5 - frost.melt * 0.35
    frost.x += frost.vx * driftScale * dt + Math.sin(game.time * 0.6 + frost.phase) * dt * 0.008
    frost.y += frost.vy * driftScale * dt
    frost.vx *= 0.992
    frost.vy *= 0.992
    if (frost.x < 0.06 || frost.x > 0.94) frost.vx *= -0.85
    if (frost.y < 0.12 || frost.y > 0.68) frost.vy *= -0.85
    frost.x = Math.max(0.06, Math.min(0.94, frost.x))
    frost.y = Math.max(0.12, Math.min(0.68, frost.y))
  })

  game.particles = game.particles
    .map((particle) => ({
      ...particle,
      x: particle.x + particle.vx * dt + Math.sin(game.time * 1.3 + particle.id) * dt * 0.008,
      y: particle.y + particle.vy * dt,
      vy: particle.vy - (particle.kind === 'ember' ? 0.018 : particle.kind === 'flare' ? 0.011 : 0.004) * dt,
      life: particle.life - dt,
      size: particle.size + (particle.kind === 'steam' ? dt * 10 : dt * 2.2),
    }))
    .filter((particle) => particle.life > 0)

  const allMelted = game.frosts.every((frost) => frost.melt >= 0.98)
  const stableHearth = game.coals.every((coal) => coal.heat > 0.62) && game.charge > 0.44
  if (game.completedAt === null && allMelted && stableHearth) {
    game.completedAt = game.time
    addHearthParticles(game, 0.5, 0.72, 34, 'flare', '#ffd18b')
  }
}

function addHearthParticles(
  game: WarmHearthGame,
  x: number,
  y: number,
  count: number,
  kind: HearthParticle['kind'],
  tone: string,
) {
  for (let i = 0; i < count; i += 1) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * (kind === 'steam' ? 0.9 : 1.35)
    const speed = kind === 'steam' ? 0.045 + Math.random() * 0.035 : kind === 'flare' ? 0.09 + Math.random() * 0.07 : 0.07 + Math.random() * 0.06
    const life = kind === 'steam' ? 1.2 + Math.random() * 0.55 : 0.55 + Math.random() * 0.42
    game.particles.push({
      id: game.nextParticleId,
      x: x + (Math.random() - 0.5) * 0.035,
      y: y + (Math.random() - 0.5) * 0.025,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: life,
      size: kind === 'steam' ? 10 + Math.random() * 12 : kind === 'flare' ? 5 + Math.random() * 6 : 2.4 + Math.random() * 3.5,
      tone,
      kind,
    })
    game.nextParticleId += 1
  }
  if (game.particles.length > 110) game.particles.splice(0, game.particles.length - 110)
}

function drawWarmHearth(ctx: CanvasRenderingContext2D, game: WarmHearthGame, width: number, height: number, dpr: number) {
  ctx.save()
  ctx.scale(dpr, dpr)
  const melt = game.frosts.reduce((sum, frost) => sum + frost.melt, 0) / game.frosts.length
  const averageHeat = game.coals.reduce((sum, coal) => sum + coal.heat, 0) / game.coals.length
  const completeGlow = game.completedAt === null ? 0 : smoothStep(clamp01((game.time - game.completedAt) / 1.8))
  const background = ctx.createLinearGradient(0, 0, 0, height)
  background.addColorStop(0, mixColor('#cbdfe5', '#ffdba7', Math.max(melt, completeGlow)))
  background.addColorStop(0.52, mixColor('#e6eeee', '#fff0ca', Math.max(melt, completeGlow)))
  background.addColorStop(1, mixColor('#9db3ae', '#b97c51', Math.max(averageHeat, completeGlow)))
  ctx.fillStyle = background
  ctx.fillRect(0, 0, width, height)

  drawWarmHearthRoom(ctx, game, width, height, melt, averageHeat, completeGlow)
  drawWarmHearthInteraction(ctx, game, width, height)

  game.coals.forEach((coal) => {
    const x = coal.x * width
    const y = coal.y * height
    drawHoneycombCoal(ctx, x, y, coal, game.time)
  })
  drawHearthFlames(ctx, game, width, height, averageHeat)

  game.frosts.forEach((frost) => {
    const x = frost.x * width
    const y = frost.y * height
    const cold = 1 - frost.melt
    if (cold <= 0.02) {
      ctx.globalAlpha = 0.14 + completeGlow * 0.1
      ctx.fillStyle = frost.id % 2 ? '#ffce88' : '#fff0bc'
      ctx.beginPath()
      ctx.arc(x, y, 14 + Math.sin(game.time + frost.phase) * 3, 0, Math.PI * 2)
      ctx.fill()
      return
    }
    drawHearthFrostShard(ctx, frost, x, y, game.time)
  })

  drawHearthParticles(ctx, game, width, height)
  ctx.globalAlpha = 1
  drawWarmHearthMeter(ctx, game, width, height, averageHeat, melt)
  drawSootheHandLight(ctx, game.pointer.x * width, game.pointer.y * height, 70 + game.charge * 34, mixColor('#ffe1a0', '#ffbb63', game.charge))
  ctx.save()
  ctx.globalAlpha = 0.36 + game.charge * 0.32
  ctx.strokeStyle = '#ffd890'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.arc(game.pointer.x * width, game.pointer.y * height, 34 + game.charge * 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * game.charge)
  ctx.stroke()
  ctx.restore()
  if (completeGlow > 0) drawWarmHearthCompletion(ctx, game, width, height, completeGlow)
  ctx.restore()
}

function drawHoneycombCoal(ctx: CanvasRenderingContext2D, x: number, y: number, coal: HearthCoal, time: number) {
  const pulse = 0.5 + Math.sin(time * 3.1 + coal.phase) * 0.5
  const bodyW = 64
  const bodyH = 46
  const topH = 27
  const holeLayout = [
    [0, 0],
    [-15, -7],
    [15, -7],
    [-17, 8],
    [17, 8],
    [0, -15],
    [0, 16],
  ]

  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(Math.sin(time * 0.55 + coal.phase) * 0.08)

  ctx.globalAlpha = 0.16 + coal.heat * 0.34 + coal.pulse * 0.18
  const coalGlow = ctx.createRadialGradient(0, 5, 0, 0, 5, 76 * (0.42 + coal.heat))
  coalGlow.addColorStop(0, '#ffd38d')
  coalGlow.addColorStop(0.34, 'rgba(255, 138, 70, 0.52)')
  coalGlow.addColorStop(1, 'rgba(255, 138, 70, 0)')
  ctx.fillStyle = coalGlow
  ctx.beginPath()
  ctx.arc(0, 5, 76 * (0.42 + coal.heat), 0, Math.PI * 2)
  ctx.fill()

  ctx.globalAlpha = 0.9
  const sideFill = ctx.createLinearGradient(-bodyW * 0.5, -6, bodyW * 0.5, bodyH)
  sideFill.addColorStop(0, mixColor('#535d58', '#b56b42', coal.heat * 0.65))
  sideFill.addColorStop(0.42, mixColor('#252c2b', '#7c3b31', coal.heat))
  sideFill.addColorStop(1, mixColor('#171c1d', '#3d2020', coal.heat * 0.75))
  ctx.fillStyle = sideFill
  ctx.beginPath()
  ctx.moveTo(-bodyW * 0.5, 0)
  ctx.bezierCurveTo(-bodyW * 0.46, bodyH * 0.56, -bodyW * 0.25, bodyH * 0.82, 0, bodyH * 0.84)
  ctx.bezierCurveTo(bodyW * 0.25, bodyH * 0.82, bodyW * 0.46, bodyH * 0.56, bodyW * 0.5, 0)
  ctx.closePath()
  ctx.fill()

  const topFill = ctx.createRadialGradient(-10, -8, 2, 0, 0, bodyW * 0.62)
  topFill.addColorStop(0, mixColor('#69736d', '#ffc276', coal.heat * 0.45))
  topFill.addColorStop(0.48, mixColor('#303837', '#c26039', coal.heat * 0.7))
  topFill.addColorStop(1, mixColor('#161b1c', '#4b2423', coal.heat))
  ctx.fillStyle = topFill
  ctx.strokeStyle = `rgba(255, 224, 165, ${0.18 + coal.heat * 0.28})`
  ctx.lineWidth = 1.3
  ctx.beginPath()
  ctx.ellipse(0, 0, bodyW * 0.52, topH, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  holeLayout.forEach(([hx, hy], index) => {
    const holeHeat = clamp01(coal.heat + Math.sin(time * 2.2 + coal.phase + index) * 0.08 + coal.pulse * 0.18)
    const holeR = index === 0 ? 7.1 : 5.8
    const holeGlow = ctx.createRadialGradient(hx - 1, hy - 1, 0, hx, hy, holeR * (1.8 + holeHeat))
    holeGlow.addColorStop(0, `rgba(255, 237, 176, ${0.48 + holeHeat * 0.34})`)
    holeGlow.addColorStop(0.45, `rgba(255, 138, 64, ${0.28 + holeHeat * 0.38})`)
    holeGlow.addColorStop(1, 'rgba(255, 110, 48, 0)')
    ctx.globalAlpha = 0.5 + holeHeat * 0.45
    ctx.fillStyle = holeGlow
    ctx.beginPath()
    ctx.ellipse(hx, hy, holeR * 1.7, holeR * 1.35, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.globalAlpha = 0.96
    const holeFill = ctx.createRadialGradient(hx - 1, hy - 1, 1, hx, hy, holeR)
    holeFill.addColorStop(0, mixColor('#ffe7a3', '#fff0bc', holeHeat))
    holeFill.addColorStop(0.42, mixColor('#b24d32', '#ff8a45', holeHeat))
    holeFill.addColorStop(1, '#15191a')
    ctx.fillStyle = holeFill
    ctx.beginPath()
    ctx.ellipse(hx, hy, holeR, holeR * 0.78, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.globalAlpha = 0.34
    ctx.strokeStyle = '#0d1112'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.ellipse(hx, hy, holeR + 1.4, holeR * 0.78 + 1.1, 0, 0, Math.PI * 2)
    ctx.stroke()
  })

  ctx.globalAlpha = 0.26 + coal.heat * 0.24
  ctx.strokeStyle = '#fff0bc'
  ctx.lineWidth = 1.2 + pulse * 0.45
  ctx.beginPath()
  ctx.ellipse(-8, -9 - pulse * 1.5, 19 + pulse * 3, 6, -0.2, 0, Math.PI)
  ctx.stroke()
  ctx.restore()
}

function drawHearthFlames(ctx: CanvasRenderingContext2D, game: WarmHearthGame, width: number, height: number, averageHeat: number) {
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  game.coals.forEach((coal) => {
    if (coal.heat < 0.22) return
    const x = coal.x * width
    const y = coal.y * height - 12
    const flameCount = 2 + Math.floor(coal.heat * 3)
    for (let i = 0; i < flameCount; i += 1) {
      const sway = Math.sin(game.time * (2.2 + i * 0.25) + coal.phase + i) * (8 + i * 2)
      const flameHeight = (28 + coal.heat * 46 + coal.pulse * 18) * (0.72 + i * 0.12)
      const flameWidth = 12 + coal.heat * 18
      const baseX = x + (i - flameCount / 2 + 0.5) * 12
      const grad = ctx.createLinearGradient(baseX, y, baseX + sway, y - flameHeight)
      grad.addColorStop(0, `rgba(255, 91, 45, ${0.04 + coal.heat * 0.18})`)
      grad.addColorStop(0.46, `rgba(255, 168, 82, ${0.18 + coal.heat * 0.36})`)
      grad.addColorStop(1, `rgba(255, 245, 179, ${0.1 + coal.heat * 0.22})`)
      ctx.globalAlpha = 0.28 + coal.heat * 0.48
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.moveTo(baseX - flameWidth * 0.7, y + 4)
      ctx.bezierCurveTo(baseX - flameWidth, y - flameHeight * 0.38, baseX + sway - flameWidth * 0.35, y - flameHeight * 0.7, baseX + sway, y - flameHeight)
      ctx.bezierCurveTo(baseX + sway + flameWidth * 0.55, y - flameHeight * 0.54, baseX + flameWidth, y - flameHeight * 0.2, baseX + flameWidth * 0.65, y + 5)
      ctx.closePath()
      ctx.fill()
    }
  })

  const heat = ctx.createRadialGradient(width * 0.5, height * 0.78, 20, width * 0.5, height * 0.78, width * 0.42)
  heat.addColorStop(0, `rgba(255, 164, 82, ${0.12 + averageHeat * 0.16})`)
  heat.addColorStop(0.55, `rgba(255, 207, 133, ${0.06 + averageHeat * 0.08})`)
  heat.addColorStop(1, 'rgba(255, 207, 133, 0)')
  ctx.globalAlpha = 1
  ctx.fillStyle = heat
  ctx.fillRect(0, 0, width, height)
  ctx.restore()
}

function drawWarmHearthInteraction(ctx: CanvasRenderingContext2D, game: WarmHearthGame, width: number, height: number) {
  const pointer = game.pointer
  const targets = [
    ...game.coals.map((coal) => ({ x: coal.x, y: coal.y, strength: coal.heat, kind: 'coal' as const })),
    ...game.frosts
      .filter((frost) => frost.melt < 0.98)
      .map((frost) => ({ x: frost.x, y: frost.y, strength: 1 - frost.melt, kind: 'frost' as const })),
  ]
    .map((target) => ({ ...target, d: distance(pointer.x, pointer.y, target.x, target.y) }))
    .sort((a, b) => a.d - b.d)

  const target = targets[0]
  if (!target || target.d > 0.18 + game.charge * 0.05) return

  const influence = clamp01((0.2 - target.d) / 0.2) * clamp01(0.35 + game.charge)
  const fromX = pointer.x * width
  const fromY = pointer.y * height
  const toX = target.x * width
  const toY = target.y * height
  const midX = (fromX + toX) / 2
  const midY = (fromY + toY) / 2 - height * 0.035

  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.globalAlpha = 0.16 + influence * 0.36
  ctx.strokeStyle = target.kind === 'coal' ? '#ffb15f' : '#ffe1a0'
  ctx.lineWidth = 4 + influence * 7
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(fromX, fromY)
  ctx.quadraticCurveTo(midX, midY, toX, toY)
  ctx.stroke()

  ctx.globalAlpha = 0.18 + influence * 0.38
  ctx.strokeStyle = target.kind === 'coal' ? '#ffe0a5' : '#ffb66f'
  ctx.lineWidth = 1.5
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath()
    ctx.arc(toX, toY, 24 + i * 10 + Math.sin(game.time * 4 + i) * 2, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}

function drawHearthFrostShard(ctx: CanvasRenderingContext2D, frost: HearthFrost, x: number, y: number, time: number) {
  const cold = 1 - frost.melt
  const radius = (16 + cold * 15) * frost.size
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(time * 0.08 + frost.phase)
  ctx.globalAlpha = 0.38 + cold * 0.48
  const iceFill = ctx.createLinearGradient(-radius, -radius, radius, radius)
  iceFill.addColorStop(0, `rgba(248, 255, 255, ${0.55 + cold * 0.26})`)
  iceFill.addColorStop(0.38, mixColor('#ffd28e', '#cceff6', cold))
  iceFill.addColorStop(1, `rgba(91, 130, 142, ${0.2 + cold * 0.3})`)
  ctx.fillStyle = iceFill
  ctx.strokeStyle = `rgba(246, 255, 255, ${0.36 + cold * 0.34})`
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(0, -radius)
  ctx.lineTo(radius * 0.54, -radius * 0.18)
  ctx.lineTo(radius * 0.38, radius * 0.7)
  ctx.lineTo(-radius * 0.18, radius * 0.52)
  ctx.lineTo(-radius * 0.66, radius * 0.06)
  ctx.lineTo(-radius * 0.36, -radius * 0.56)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.globalAlpha = 0.22 + cold * 0.34
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(-radius * 0.3, -radius * 0.18)
  ctx.lineTo(radius * 0.24, radius * 0.18)
  ctx.moveTo(radius * 0.08, -radius * 0.48)
  ctx.lineTo(-radius * 0.04, radius * 0.44)
  ctx.stroke()

  if (frost.melt > 0.12) {
    ctx.globalAlpha = 0.16 + frost.melt * 0.24
    ctx.fillStyle = '#ffbd76'
    ctx.beginPath()
    ctx.ellipse(0, 2, radius * 0.42 * frost.melt, radius * 0.22 * frost.melt, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawHearthParticles(ctx: CanvasRenderingContext2D, game: WarmHearthGame, width: number, height: number) {
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  game.particles.forEach((particle) => {
    const life = clamp01(particle.life / particle.maxLife)
    const x = particle.x * width
    const y = particle.y * height
    if (particle.kind === 'steam') {
      ctx.globalAlpha = life * 0.22
      const steam = ctx.createRadialGradient(x, y, 0, x, y, particle.size)
      steam.addColorStop(0, 'rgba(255, 244, 220, 0.42)')
      steam.addColorStop(0.44, 'rgba(216, 244, 250, 0.18)')
      steam.addColorStop(1, 'rgba(216, 244, 250, 0)')
      ctx.fillStyle = steam
      ctx.beginPath()
      ctx.ellipse(x, y, particle.size * 1.2, particle.size * 0.65, Math.sin(game.time + particle.id), 0, Math.PI * 2)
      ctx.fill()
      return
    }

    ctx.globalAlpha = life * (particle.kind === 'flare' ? 0.78 : 0.62)
    const ember = ctx.createRadialGradient(x, y, 0, x, y, particle.size * 2.6)
    ember.addColorStop(0, '#fff1b8')
    ember.addColorStop(0.36, particle.tone)
    ember.addColorStop(1, 'rgba(255, 124, 58, 0)')
    ctx.fillStyle = ember
    ctx.beginPath()
    ctx.arc(x, y, particle.size * 2.6, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.restore()
}

function drawWarmHearthRoom(
  ctx: CanvasRenderingContext2D,
  game: WarmHearthGame,
  width: number,
  height: number,
  melt: number,
  averageHeat: number,
  completeGlow: number,
) {
  ctx.save()
  const centerX = width * 0.5
  const hearthY = height * 0.82
  const archTop = height * 0.19
  const archW = width * 0.7
  const archH = height * 0.76

  for (let i = 0; i < 26; i += 1) {
    const drift = (game.time * (0.018 + i * 0.0008) + i * 0.057) % 1
    const x = width * ((i * 0.137 + Math.sin(i) * 0.03 + drift * 0.08) % 1)
    const y = height * (0.06 + ((i * 0.173) % 0.72))
    ctx.globalAlpha = (0.08 + (1 - melt) * 0.1) * (1 - completeGlow * 0.5)
    ctx.fillStyle = i % 3 === 0 ? '#d9f4fa' : '#f7e4c3'
    ctx.beginPath()
    ctx.ellipse(x, y, 11 + (i % 4) * 4, 2.5, Math.sin(i) * 0.8, 0, Math.PI * 2)
    ctx.fill()
  }

  const roomGlow = ctx.createRadialGradient(centerX, hearthY, 20, centerX, hearthY, Math.max(width, height) * 0.62)
  roomGlow.addColorStop(0, `rgba(255, 188, 103, ${0.22 + averageHeat * 0.22 + completeGlow * 0.18})`)
  roomGlow.addColorStop(0.42, `rgba(255, 221, 157, ${0.08 + averageHeat * 0.08})`)
  roomGlow.addColorStop(1, 'rgba(255, 221, 157, 0)')
  ctx.fillStyle = roomGlow
  ctx.fillRect(0, 0, width, height)

  ctx.globalAlpha = 0.28 + averageHeat * 0.18
  const archFill = ctx.createLinearGradient(0, archTop, 0, height)
  archFill.addColorStop(0, 'rgba(244, 238, 215, 0.34)')
  archFill.addColorStop(0.58, 'rgba(126, 112, 97, 0.16)')
  archFill.addColorStop(1, 'rgba(70, 55, 48, 0.2)')
  ctx.fillStyle = archFill
  ctx.beginPath()
  ctx.moveTo(centerX - archW * 0.5, height)
  ctx.lineTo(centerX - archW * 0.5, hearthY)
  ctx.bezierCurveTo(centerX - archW * 0.48, archTop, centerX + archW * 0.48, archTop, centerX + archW * 0.5, hearthY)
  ctx.lineTo(centerX + archW * 0.5, height)
  ctx.closePath()
  ctx.fill()

  ctx.globalAlpha = 0.18 + averageHeat * 0.12
  ctx.strokeStyle = 'rgba(80, 68, 60, 0.58)'
  ctx.lineWidth = 1
  for (let row = 0; row < 8; row += 1) {
    const y = archTop + 36 + row * 42
    const rowInset = Math.max(0, Math.abs(y - hearthY) * 0.2)
    ctx.beginPath()
    ctx.moveTo(centerX - archW * 0.44 + rowInset, y)
    ctx.lineTo(centerX + archW * 0.44 - rowInset, y + Math.sin(game.time * 0.2 + row) * 1.5)
    ctx.stroke()
    for (let col = 0; col < 8; col += 1) {
      const brickX = centerX - archW * 0.36 + col * (archW * 0.1) + (row % 2) * archW * 0.045
      if (brickX < centerX - archW * 0.42 + rowInset || brickX > centerX + archW * 0.42 - rowInset) continue
      ctx.beginPath()
      ctx.moveTo(brickX, y - 18)
      ctx.lineTo(brickX + Math.sin(col + row) * 2, y + 14)
      ctx.stroke()
    }
  }

  ctx.globalAlpha = 0.38
  ctx.strokeStyle = 'rgba(255, 236, 193, 0.62)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(centerX - archW * 0.45, height)
  ctx.lineTo(centerX - archW * 0.45, hearthY)
  ctx.bezierCurveTo(centerX - archW * 0.42, archTop + 22, centerX + archW * 0.42, archTop + 22, centerX + archW * 0.45, hearthY)
  ctx.lineTo(centerX + archW * 0.45, height)
  ctx.stroke()

  const basin = ctx.createLinearGradient(0, hearthY - archH * 0.1, 0, height)
  basin.addColorStop(0, 'rgba(83, 74, 67, 0.42)')
  basin.addColorStop(0.5, 'rgba(48, 43, 40, 0.42)')
  basin.addColorStop(1, 'rgba(34, 31, 31, 0.22)')
  ctx.globalAlpha = 0.84
  ctx.fillStyle = basin
  ctx.beginPath()
  ctx.ellipse(centerX, hearthY, width * 0.36, height * 0.105, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.globalAlpha = 0.34 + averageHeat * 0.18
  ctx.strokeStyle = 'rgba(30, 25, 23, 0.72)'
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  for (let i = 0; i < 7; i += 1) {
    const x = centerX - width * 0.24 + i * width * 0.08
    ctx.beginPath()
    ctx.moveTo(x, hearthY - height * 0.065)
    ctx.quadraticCurveTo(centerX, hearthY - height * 0.02, width - x, hearthY - height * 0.065)
    ctx.stroke()
  }

  const vignette = ctx.createRadialGradient(centerX, height * 0.54, Math.min(width, height) * 0.2, centerX, height * 0.55, Math.max(width, height) * 0.66)
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vignette.addColorStop(1, `rgba(25, 31, 32, ${0.22 - completeGlow * 0.1})`)
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, width, height)
  ctx.restore()
}

function drawWarmHearthMeter(
  ctx: CanvasRenderingContext2D,
  game: WarmHearthGame,
  width: number,
  height: number,
  averageHeat: number,
  melt: number,
) {
  ctx.save()
  const x = width * 0.08
  const y = height * 0.16
  ctx.globalAlpha = 0.42
  ctx.strokeStyle = 'rgba(255, 241, 203, 0.75)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(x, y, 36, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * averageHeat)
  ctx.stroke()
  ctx.globalAlpha = 0.28
  ctx.strokeStyle = 'rgba(217, 244, 250, 0.7)'
  ctx.beginPath()
  ctx.arc(x, y, 48, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * melt)
  ctx.stroke()
  ctx.globalAlpha = 0.22 + game.charge * 0.38
  ctx.fillStyle = '#ffbd70'
  ctx.beginPath()
  ctx.arc(x, y, 18 + game.charge * 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawWarmHearthCompletion(ctx: CanvasRenderingContext2D, game: WarmHearthGame, width: number, height: number, glow: number) {
  ctx.save()
  const centerX = width * 0.5
  const centerY = height * 0.58
  const pulse = 0.5 + Math.sin(game.time * 2.2) * 0.5
  const warm = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * (0.34 + glow * 0.28))
  warm.addColorStop(0, `rgba(255, 244, 197, ${0.38 * glow})`)
  warm.addColorStop(0.42, `rgba(255, 174, 95, ${0.2 * glow})`)
  warm.addColorStop(1, 'rgba(255, 174, 95, 0)')
  ctx.fillStyle = warm
  ctx.fillRect(0, 0, width, height)

  ctx.globalAlpha = 0.18 * glow
  ctx.strokeStyle = '#ffe6ac'
  ctx.lineWidth = 4
  for (let i = 0; i < 4; i += 1) {
    const r = 90 + (i * 42) + pulse * 10 + glow * 40
    ctx.beginPath()
    ctx.arc(centerX, centerY, r, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}

function SoftGardenPractice() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const lastFrameRef = useRef(0)
  const gameRef = useRef<SoftGardenGame>(createSoftGardenGame())

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    lastFrameRef.current = performance.now()

    const render = (now: number) => {
      const dt = Math.min(0.034, (now - lastFrameRef.current) / 1000)
      lastFrameRef.current = now
      const { width, height, dpr } = resizeHarborCanvas(canvas)
      updateSoftGarden(gameRef.current, dt)
      drawSoftGarden(ctx, gameRef.current, width, height, dpr)
      animationRef.current = window.requestAnimationFrame(render)
    }

    animationRef.current = window.requestAnimationFrame(render)
    return () => {
      if (animationRef.current) window.cancelAnimationFrame(animationRef.current)
    }
  }, [])

  function moveLight(event: PointerEvent<HTMLCanvasElement> | MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const pointer = gameRef.current.pointer
    pointer.targetX = clamp01((event.clientX - rect.left) / rect.width)
    pointer.targetY = clamp01((event.clientY - rect.top) / rect.height)
  }

  return (
    <div className="harbor-game soothe-canvas-game">
      <canvas
        ref={canvasRef}
        className="harbor-canvas"
        aria-label="移动暖光让花园慢慢亮起"
        onPointerDown={moveLight}
        onPointerMove={moveLight}
        onMouseDown={moveLight}
        onMouseMove={moveLight}
        onClick={moveLight}
      />
    </div>
  )
}

function createSoftGardenGame(): SoftGardenGame {
  const seedPositions = [
    [0.15, 0.69],
    [0.26, 0.49],
    [0.38, 0.74],
    [0.47, 0.42],
    [0.58, 0.66],
    [0.69, 0.5],
    [0.82, 0.72],
    [0.17, 0.38],
    [0.82, 0.36],
  ]
  const tones = ['#f3a86f', '#ffd58e', '#d89083', '#f6c0a8', '#f4b275', '#eed48a', '#d98774', '#f8d6a3', '#f0aa83']
  return {
    pointer: { x: 0.5, y: 0.52, targetX: 0.5, targetY: 0.52, speed: 0 },
    seeds: seedPositions.map(([x, y], index) => ({
      id: index,
      x,
      y,
      water: 0,
      warm: 0,
      bloom: 0,
      phase: index * 0.71,
      tone: tones[index],
      pulse: 0,
      shed: index * 0.33,
    })),
    dews: Array.from({ length: 22 }, (_, index) => ({
      id: index,
      x: 0.08 + ((index * 0.173) % 0.84),
      y: 0.1 + ((index * 0.29) % 0.42),
      vx: Math.sin(index * 1.91) * 0.018,
      vy: 0.015 + (index % 5) * 0.004,
      phase: index * 0.57,
      charge: 1,
      heldSlot: null,
      returning: 0,
    })),
    motes: [],
    stones: [
      { id: 0, x: 0.23, y: 0.62, soft: 0, phase: 0.2, open: false, pulse: 0 },
      { id: 1, x: 0.36, y: 0.4, soft: 0, phase: 1.1, open: false, pulse: 0 },
      { id: 2, x: 0.55, y: 0.78, soft: 0, phase: 2.3, open: false, pulse: 0 },
      { id: 3, x: 0.72, y: 0.58, soft: 0, phase: 3.4, open: false, pulse: 0 },
      { id: 4, x: 0.86, y: 0.46, soft: 0, phase: 4.1, open: false, pulse: 0 },
    ],
    petals: [],
    nextDewId: 22,
    nextMoteId: 0,
    collectedMotes: 0,
    donutReady: false,
    donutMorph: 0,
    donutPulse: 0,
    time: 0,
    completedAt: null,
  }
}

function updateSoftGarden(game: SoftGardenGame, dt: number) {
  game.time += dt
  const { pointer } = game
  const previousX = pointer.x
  const previousY = pointer.y
  const follow = Math.min(1, dt * 13)
  pointer.x += (pointer.targetX - pointer.x) * follow
  pointer.y += (pointer.targetY - pointer.y) * follow
  pointer.speed = Math.hypot(pointer.x - previousX, pointer.y - previousY) / Math.max(dt, 0.001)
  const slowLight = clamp01(1 - pointer.speed / 1.05)
  game.donutPulse = Math.max(0, game.donutPulse - dt * 1.25)
  if (game.donutReady) game.donutMorph = clamp01(game.donutMorph + dt / 1.65)

  game.stones.forEach((stone) => {
    if (stone.open) {
      stone.pulse = Math.max(0, stone.pulse - dt * 1.4)
      return
    }
    const near = clamp01((0.14 - distance(pointer.x, pointer.y, stone.x, stone.y)) / 0.14)
    if (near > 0 && slowLight > 0.22) {
      stone.soft = clamp01(stone.soft + dt * near * (0.24 + slowLight * 0.72))
      stone.pulse = 1
      if (stone.soft >= 1) {
        stone.open = true
        stone.pulse = 1
        addGardenDews(game, stone.x, stone.y, 3)
        addGardenMotes(game, stone.x, stone.y, 5, '#ffd890')
        addGardenPetals(game, stone.x, stone.y, 8, '#deb68a')
      }
    } else {
      stone.pulse = Math.max(0, stone.pulse - dt * 1.7)
    }
  })

  const heldSlots = new Set<number>()
  game.dews.forEach((dew) => {
    if (dew.heldSlot !== null) heldSlots.add(dew.heldSlot)
  })

  game.dews.forEach((dew) => {
    if (dew.returning > 0) {
      dew.returning = Math.max(0, dew.returning - dt)
      dew.y -= dt * (0.1 + dew.returning * 0.04)
      dew.x += Math.sin(game.time * 1.4 + dew.phase) * dt * 0.02
      dew.charge = clamp01(dew.charge + dt * 0.75)
      if (dew.y < -0.04 || dew.charge >= 1) {
        dew.x = 0.07 + ((dew.id * 0.191 + game.time * 0.031) % 0.86)
        dew.y = -0.04 - (dew.id % 4) * 0.03
        dew.vx = Math.sin(game.time + dew.id) * 0.018
        dew.vy = 0.016 + (dew.id % 5) * 0.004
        dew.charge = 1
        dew.returning = 0
      }
      return
    }

    if (dew.heldSlot === null && dew.charge > 0.1) {
      const close = distance(pointer.x, pointer.y, dew.x, dew.y)
      if (close < 0.13 && heldSlots.size < 4) {
        for (let slot = 0; slot < 4; slot += 1) {
          if (!heldSlots.has(slot)) {
            dew.heldSlot = slot
            heldSlots.add(slot)
            break
          }
        }
      }
    }

    if (dew.heldSlot !== null) {
      const angle = game.time * (1.45 + dew.heldSlot * 0.15) + dew.phase
      const orbit = 0.052 + dew.heldSlot * 0.014
      const targetX = pointer.x + Math.cos(angle) * orbit
      const targetY = pointer.y + Math.sin(angle) * orbit
      dew.x += (targetX - dew.x) * Math.min(1, dt * 9)
      dew.y += (targetY - dew.y) * Math.min(1, dt * 9)

      const thirsty = game.seeds
        .filter((seed) => seed.water < 1 || seed.bloom < 1)
        .sort((a, b) => distance(dew.x, dew.y, a.x, a.y) - distance(dew.x, dew.y, b.x, b.y))[0]
      if (thirsty && distance(dew.x, dew.y, thirsty.x, thirsty.y) < 0.095) {
        const pour = Math.min(dew.charge, dt * 1.25)
        dew.charge -= pour
        thirsty.water = clamp01(thirsty.water + pour * 0.95)
        thirsty.pulse = 1
        if (dew.charge <= 0.08) {
          dew.heldSlot = null
          dew.returning = 1
          dew.charge = 0.05
          addGardenPetals(game, thirsty.x, thirsty.y, 3, thirsty.tone)
        }
      }
      return
    }

    dew.x += dew.vx * dt + Math.sin(game.time * 0.8 + dew.phase) * dt * 0.006
    dew.y += dew.vy * dt
    if (dew.x < 0.04 || dew.x > 0.96) dew.vx *= -1
    if (dew.y > 0.78) {
      dew.y = -0.04 - (dew.id % 5) * 0.025
      dew.x = 0.07 + ((dew.id * 0.173 + game.time * 0.025) % 0.86)
    }
  })

  game.seeds.forEach((seed) => {
    const light = clamp01((0.17 - distance(pointer.x, pointer.y, seed.x, seed.y)) / 0.17)
    const stableLight = light * slowLight
    if (seed.water > 0.18) seed.warm = clamp01(seed.warm + dt * (stableLight * 0.72 + 0.025 * seed.water))
    if (seed.water > 0.72 && seed.warm > 0.48) {
      const before = seed.bloom
      seed.bloom = clamp01(seed.bloom + dt * (0.18 + stableLight * 0.58 + seed.water * 0.08))
      if (before < 0.55 && seed.bloom >= 0.55) {
        addGardenPetals(game, seed.x, seed.y, 8, seed.tone)
      }
      if (before < 1 && seed.bloom >= 1) {
        addGardenPetals(game, seed.x, seed.y, 14, seed.tone)
      }
    }
    if (seed.bloom > 0.72) {
      seed.shed += dt
      if (seed.shed > 11 + seed.id * 0.55) {
        seed.shed = 0
        addGardenMotes(game, seed.x, seed.y - 0.07, 1, seed.tone)
      }
    }
    seed.pulse = Math.max(0, seed.pulse - dt * 1.8)
  })

  updateGardenMotes(game, dt)

  game.seeds.forEach((seed) => {
    if (seed.bloom > 0.8) {
      game.seeds.forEach((other) => {
        if (other.id !== seed.id && other.bloom > 0.8 && distance(seed.x, seed.y, other.x, other.y) < 0.28) {
          seed.warm = clamp01(seed.warm + dt * 0.018)
        }
      })
    }
  })

  game.petals = game.petals
    .map((petal) => ({
      ...petal,
      x: petal.x + petal.vx * dt,
      y: petal.y + petal.vy * dt,
      vy: petal.vy + dt * 0.012,
      life: petal.life - dt,
    }))
    .filter((petal) => petal.life > 0)

  const completed = game.seeds.every((seed) => seed.bloom >= 1) && game.stones.every((stone) => stone.open)
  if (completed && game.completedAt === null) game.completedAt = game.time
}

function addGardenDews(game: SoftGardenGame, x: number, y: number, count: number) {
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + game.time * 0.4
    game.dews.push({
      id: game.nextDewId,
      x: clamp01(x + Math.cos(angle) * 0.035),
      y: clamp01(y + Math.sin(angle) * 0.035),
      vx: Math.cos(angle) * 0.035,
      vy: Math.sin(angle) * 0.025 - 0.01,
      phase: game.time + i * 0.43,
      charge: 1,
      heldSlot: null,
      returning: 0,
    })
    game.nextDewId += 1
  }
  if (game.dews.length > 34) game.dews.splice(0, game.dews.length - 34)
}

function addGardenMotes(game: SoftGardenGame, x: number, y: number, count: number, tone: string) {
  if (game.donutReady) return
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + game.time
    game.motes.push({
      id: game.nextMoteId,
      x,
      y,
      vx: Math.cos(angle) * (0.025 + (i % 3) * 0.006),
      vy: Math.sin(angle) * (0.02 + (i % 2) * 0.006) - 0.01,
      phase: game.time + i * 0.53,
      energy: 1,
      held: false,
      tone,
      counted: false,
    })
    game.nextMoteId += 1
  }
  if (game.motes.length > 70) game.motes.splice(0, game.motes.length - 70)
}

function updateGardenMotes(game: SoftGardenGame, dt: number) {
  const { pointer } = game
  game.motes.forEach((mote) => {
    if (!mote.held && distance(pointer.x, pointer.y, mote.x, mote.y) < 0.13) {
      mote.held = true
      if (!mote.counted) {
        mote.counted = true
        game.collectedMotes += 1
        if (game.collectedMotes >= 50 && !game.donutReady) {
          game.donutReady = true
          game.donutMorph = 0
          game.donutPulse = 1
          game.motes.forEach((item) => {
            item.held = false
            item.energy = Math.min(item.energy, 0.28)
          })
        }
      }
    }

    if (mote.held) {
      const angle = game.time * 1.8 + mote.phase
      const radius = 0.075 + (mote.id % 5) * 0.008
      mote.x += (pointer.x + Math.cos(angle) * radius - mote.x) * Math.min(1, dt * 8)
      mote.y += (pointer.y + Math.sin(angle) * radius - mote.y) * Math.min(1, dt * 8)
    } else {
      const target = game.seeds
        .filter((seed) => seed.bloom < 1 && seed.water > 0.25)
        .sort((a, b) => distance(mote.x, mote.y, a.x, a.y) - distance(mote.x, mote.y, b.x, b.y))[0]
      if (target && distance(mote.x, mote.y, target.x, target.y) < 0.26) {
        const angle = Math.atan2(target.y - mote.y, target.x - mote.x)
        mote.vx += Math.cos(angle) * dt * 0.03
        mote.vy += Math.sin(angle) * dt * 0.03
      }
      mote.x += mote.vx * dt + Math.sin(game.time * 0.7 + mote.phase) * dt * 0.012
      mote.y += mote.vy * dt
      mote.vx *= 0.994
      mote.vy *= 0.994
    }

    if (mote.held) mote.energy = Math.max(0.18, mote.energy - dt * 0.045)
  })

  game.motes = game.motes.filter((mote) => (
    mote.energy > 0.05
    && mote.x > -0.08
    && mote.x < 1.08
    && mote.y > -0.12
    && mote.y < 1.04
  ))
}

function addGardenPetals(game: SoftGardenGame, x: number, y: number, count: number, tone: string) {
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + game.time * 0.3
    game.petals.push({
      x,
      y,
      vx: Math.cos(angle) * (0.035 + (i % 3) * 0.011),
      vy: Math.sin(angle) * (0.026 + (i % 4) * 0.008) - 0.016,
      life: 1.2 + (i % 5) * 0.18,
      tone,
      phase: game.time + i * 0.37,
    })
  }
  if (game.petals.length > 90) game.petals.splice(0, game.petals.length - 90)
}

function drawSoftGarden(ctx: CanvasRenderingContext2D, game: SoftGardenGame, width: number, height: number, dpr: number) {
  ctx.save()
  ctx.scale(dpr, dpr)
  const { seeds, dews, motes, stones, pointer, time } = game
  const bloom = seeds.reduce((sum, seed) => sum + seed.bloom, 0) / seeds.length
  const water = seeds.reduce((sum, seed) => sum + seed.water, 0) / seeds.length
  const background = ctx.createLinearGradient(0, 0, 0, height)
  background.addColorStop(0, mixColor('#cbdad9', '#ffe4bc', bloom))
  background.addColorStop(0.58, mixColor('#e5ebe3', '#fff0d6', bloom))
  background.addColorStop(1, mixColor('#9db9aa', '#d8c986', bloom))
  ctx.fillStyle = background
  ctx.fillRect(0, 0, width, height)

  drawGardenMist(ctx, width, height, time, bloom)
  drawGardenGround(ctx, width, height, bloom, water)
  drawGardenRoots(ctx, seeds, width, height, time)

  for (let i = 0; i < 26; i += 1) {
    const x = ((i * 83 + time * (10 + bloom * 6)) % (width + 120)) - 60
    const baseY = height * (0.55 + (i % 7) * 0.055)
    ctx.strokeStyle = `rgba(112, 137, 112, ${0.12 + bloom * 0.18})`
    ctx.lineWidth = 2 + bloom * 2
    ctx.beginPath()
    ctx.moveTo(x, height)
    ctx.quadraticCurveTo(x + Math.sin(time + i) * 16, baseY, x + Math.cos(time * 0.7 + i) * 20, baseY - 52 - bloom * 18)
    ctx.stroke()
  }

  dews.forEach((dew) => {
    drawGardenDew(ctx, dew, pointer, width, height, time)
  })

  stones.forEach((stone) => {
    drawGardenStone(ctx, stone, width, height, time)
  })

  seeds.forEach((seed) => {
    drawGardenSeed(ctx, seed, width, height, time)
  })

  if (!game.donutReady || game.donutMorph < 1) {
    motes.forEach((mote) => {
      drawGardenMote(ctx, mote, width, height, time)
    })
  }

  game.petals.forEach((petal) => {
    ctx.save()
    ctx.globalAlpha = clamp01(petal.life / 1.5) * 0.72
    ctx.translate(petal.x * width, petal.y * height)
    ctx.rotate(Math.sin(time * 1.2 + petal.phase) * 0.7)
    ctx.fillStyle = petal.tone
    ctx.beginPath()
    ctx.ellipse(0, 0, 6, 3.5, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  })

  if (game.completedAt !== null) {
    drawGardenCompletionGlow(ctx, width, height, time - game.completedAt)
  }
  drawGardenPointer(ctx, game, width, height)
  ctx.restore()
}

function drawGardenMist(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, bloom: number) {
  ctx.save()
  for (let i = 0; i < 7; i += 1) {
    const x = ((i * 181 + time * (18 + i)) % (width + 240)) - 120
    const y = height * (0.16 + (i % 3) * 0.11)
    const mist = ctx.createRadialGradient(x, y, 0, x, y, width * 0.22)
    mist.addColorStop(0, `rgba(255, 244, 220, ${0.09 + bloom * 0.07})`)
    mist.addColorStop(1, 'rgba(255, 244, 220, 0)')
    ctx.fillStyle = mist
    ctx.fillRect(0, 0, width, height)
  }
  ctx.restore()
}

function drawGardenGround(ctx: CanvasRenderingContext2D, width: number, height: number, bloom: number, water: number) {
  const ground = ctx.createLinearGradient(0, height * 0.58, 0, height)
  ground.addColorStop(0, `rgba(119, 142, 113, ${0.18 + water * 0.12})`)
  ground.addColorStop(1, mixColor('#6f8776', '#b8a767', bloom))
  ctx.fillStyle = ground
  ctx.beginPath()
  ctx.moveTo(0, height * 0.67)
  ctx.bezierCurveTo(width * 0.23, height * 0.55, width * 0.38, height * 0.78, width * 0.58, height * 0.63)
  ctx.bezierCurveTo(width * 0.76, height * 0.5, width * 0.88, height * 0.7, width, height * 0.58)
  ctx.lineTo(width, height)
  ctx.lineTo(0, height)
  ctx.closePath()
  ctx.fill()
}

function drawGardenRoots(ctx: CanvasRenderingContext2D, seeds: GardenSeed[], width: number, height: number, time: number) {
  ctx.save()
  seeds.forEach((seed) => {
    seeds.forEach((other) => {
      if (seed.id >= other.id || distance(seed.x, seed.y, other.x, other.y) > 0.31) return
      const strength = Math.min(seed.bloom, other.bloom)
      if (strength <= 0.08) return
      ctx.globalAlpha = 0.12 + strength * 0.34
      ctx.strokeStyle = '#ffe0a0'
      ctx.lineWidth = 2 + strength * 4
      ctx.setLineDash(strength < 0.75 ? [4, 10] : [])
      ctx.lineDashOffset = -time * 16
      ctx.beginPath()
      ctx.moveTo(seed.x * width, seed.y * height)
      ctx.quadraticCurveTo(
        ((seed.x + other.x) / 2) * width,
        ((seed.y + other.y) / 2 + 0.08) * height,
        other.x * width,
        other.y * height,
      )
      ctx.stroke()
    })
  })
  ctx.setLineDash([])
  ctx.restore()
}

function drawGardenDew(
  ctx: CanvasRenderingContext2D,
  dew: GardenDew,
  pointer: SoftGardenGame['pointer'],
  width: number,
  height: number,
  time: number,
) {
  const x = dew.x * width
  const y = dew.y * height
  const radius = 8 + dew.charge * 6
  ctx.save()
  if (dew.heldSlot !== null) {
    ctx.globalAlpha = 0.2 + dew.charge * 0.28
    ctx.strokeStyle = '#fff3cc'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(pointer.x * width, pointer.y * height)
    ctx.quadraticCurveTo((pointer.x * width + x) / 2, (pointer.y * height + y) / 2 - 18, x, y)
    ctx.stroke()
  }
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.4)
  glow.addColorStop(0, `rgba(214, 246, 255, ${0.42 * dew.charge})`)
  glow.addColorStop(1, 'rgba(214, 246, 255, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(x, y, radius * 2.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 0.55 + dew.charge * 0.42
  ctx.fillStyle = '#d7f6ff'
  ctx.beginPath()
  ctx.ellipse(x, y, radius * 0.76, radius * 1.08, Math.sin(time + dew.phase) * 0.18, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 0.8
  ctx.fillStyle = '#fff8df'
  ctx.beginPath()
  ctx.arc(x - radius * 0.2, y - radius * 0.32, Math.max(2, radius * 0.2), 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawGardenStone(ctx: CanvasRenderingContext2D, stone: GardenStone, width: number, height: number, time: number) {
  const x = stone.x * width
  const y = stone.y * height
  const soft = stone.open ? 1 : stone.soft
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(Math.sin(time * 0.4 + stone.phase) * 0.08)
  if (!stone.open) {
    ctx.globalAlpha = 0.18 + stone.pulse * 0.22
    ctx.strokeStyle = '#ffe2a8'
    ctx.lineWidth = 3 + soft * 5
    ctx.beginPath()
    ctx.arc(0, 0, 30 + stone.pulse * 16, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.globalAlpha = stone.open ? 0.42 : 0.78
  ctx.fillStyle = mixColor('#60716b', '#d9b17d', soft)
  ctx.beginPath()
  ctx.ellipse(0, 0, 22 - soft * 7, 15 - soft * 5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = stone.open ? 'rgba(255, 222, 162, 0.5)' : `rgba(255, 230, 188, ${0.16 + soft * 0.44})`
  ctx.lineWidth = 2 + soft * 2
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath()
    ctx.moveTo(-12 + i * 7, -7 + i * 2)
    ctx.quadraticCurveTo(-4 + i * 2, -1 + soft * 4, 10 - i * 4, 7 - i * 2)
    ctx.stroke()
  }
  if (stone.open) {
    ctx.globalAlpha = 0.24
    ctx.fillStyle = '#fff0be'
    ctx.beginPath()
    ctx.arc(0, 0, 34 + Math.sin(time * 1.2 + stone.phase) * 3, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawGardenMote(ctx: CanvasRenderingContext2D, mote: GardenMote, width: number, height: number, time: number) {
  const x = mote.x * width
  const y = mote.y * height
  const radius = 5 + mote.energy * 5
  ctx.save()
  ctx.globalAlpha = 0.16 + mote.energy * 0.16
  ctx.fillStyle = '#ffd98a'
  ctx.beginPath()
  ctx.arc(x, y, radius * 3.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 0.58 + mote.energy * 0.34
  ctx.fillStyle = mote.held ? '#fff1b7' : mixColor('#ffd071', mote.tone, 0.45)
  ctx.beginPath()
  ctx.ellipse(x, y, radius, radius * 0.72, Math.sin(time + mote.phase) * 0.7, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 0.72
  ctx.fillStyle = '#fff8dc'
  ctx.beginPath()
  ctx.arc(x - radius * 0.18, y - radius * 0.18, Math.max(1.5, radius * 0.24), 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function easeInOutCubic(value: number) {
  const t = clamp01(value)
  return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2
}

function drawGardenPointer(ctx: CanvasRenderingContext2D, game: SoftGardenGame, width: number, height: number) {
  const x = game.pointer.x * width
  const y = game.pointer.y * height
  const progress = clamp01(game.collectedMotes / 50)
  if (!game.donutReady) {
    drawSootheHandLight(ctx, x, y, 78, '#ffe0a1')
    ctx.save()
    ctx.globalAlpha = 0.24 + progress * 0.32
    ctx.strokeStyle = '#ffd071'
    ctx.lineWidth = 5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(x, y, 27, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress)
    ctx.stroke()
    ctx.restore()
    return
  }

  const morph = easeInOutCubic(game.donutMorph)
  const seedFade = 1 - morph
  const pulse = (0.72 + morph * 0.28) * (1 + game.donutPulse * 0.22)
  ctx.save()
  if (seedFade > 0.02) {
    const ringRadius = 78 + morph * 29
    const moteCount = 38
    for (let i = 0; i < moteCount; i += 1) {
      const angle = (Math.PI * 2 * i) / moteCount + game.time * (0.55 - morph * 0.5)
      const settle = 1 - Math.abs(((i % 9) - 4) / 4) * 0.1
      const dotRadius = (5.5 + (i % 4) * 1.1) * (0.9 + morph * 0.35)
      ctx.globalAlpha = seedFade * 0.72
      ctx.fillStyle = i % 3 === 0 ? '#fff4c8' : i % 3 === 1 ? '#ffd37d' : '#d8f1f5'
      ctx.beginPath()
      ctx.ellipse(
        x + Math.cos(angle) * ringRadius * settle,
        y + Math.sin(angle) * ringRadius * settle,
        dotRadius,
        dotRadius * 0.72,
        angle,
        0,
        Math.PI * 2,
      )
      ctx.fill()
    }
  }

  ctx.globalAlpha = (0.04 + morph * 0.09)
  ctx.fillStyle = '#ffd890'
  ctx.beginPath()
  ctx.arc(x, y, 124 * pulse, 0, Math.PI * 2)
  ctx.fill()

  const outer = 108 * pulse
  const hole = 42 * pulse
  const icingOuter = 91 * pulse
  const icingInner = 53 * pulse
  const lift = 10 * pulse

  ctx.globalAlpha = (0.18 + morph * 0.02) * morph
  ctx.fillStyle = '#704128'
  ctx.beginPath()
  ctx.ellipse(x + 7 * pulse, y + outer * 0.62, outer * 0.82, outer * 0.22, 0, 0, Math.PI * 2)
  ctx.fill()

  const sidePath = createWavyRingPath(x, y + lift, outer, hole, 0.2, 1.1 * pulse, 0.9 * pulse)
  ctx.globalAlpha = 0.9 * morph
  ctx.fillStyle = '#9a5a2f'
  ctx.fill(sidePath, 'evenodd')

  ctx.shadowColor = 'rgba(106, 65, 38, 0.38)'
  ctx.shadowBlur = 14 + game.donutPulse * 16
  ctx.shadowOffsetY = 5 * pulse
  const breadPath = createWavyRingPath(x, y, outer, hole, 0.1, 1.4 * pulse, 1 * pulse)
  const bread = ctx.createRadialGradient(x - outer * 0.25, y - outer * 0.34, hole * 0.35, x, y + outer * 0.18, outer * 1.08)
  bread.addColorStop(0, '#f5c785')
  bread.addColorStop(0.42, '#df9952')
  bread.addColorStop(0.78, '#b97037')
  bread.addColorStop(1, '#744222')
  ctx.globalAlpha = morph
  ctx.fillStyle = bread
  ctx.fill(breadPath, 'evenodd')
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  ctx.globalAlpha = 0.2 * morph
  ctx.strokeStyle = '#743f22'
  ctx.lineWidth = 8 * pulse
  ctx.beginPath()
  ctx.arc(x, y + 3 * pulse, hole + 4 * pulse, 0, Math.PI * 2)
  ctx.stroke()

  ctx.globalAlpha = 0.38 * morph
  ctx.strokeStyle = '#fff0b8'
  ctx.lineWidth = 8 * pulse
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(x - outer * 0.08, y - outer * 0.12, outer * 0.68, Math.PI * 1.08, Math.PI * 1.62)
  ctx.stroke()

  const icingPath = createWavyRingPath(x, y - 2 * pulse, icingOuter, icingInner, 1.7, 3.2 * pulse, 2.4 * pulse)
  const icing = ctx.createRadialGradient(x - icingOuter * 0.23, y - icingOuter * 0.35, 0, x, y + icingOuter * 0.14, icingOuter)
  icing.addColorStop(0, '#fff0bd')
  icing.addColorStop(0.48, '#ffd177')
  icing.addColorStop(0.78, '#eca84f')
  icing.addColorStop(1, '#c9833e')
  ctx.globalAlpha = 0.97 * morph
  ctx.fillStyle = icing
  ctx.fill(icingPath, 'evenodd')

  ctx.globalAlpha = 0.5 * morph
  ctx.strokeStyle = '#fff7d7'
  ctx.lineWidth = 6 * pulse
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(x - icingOuter * 0.13, y - icingOuter * 0.12, icingOuter * 0.55, Math.PI * 1.03, Math.PI * 1.42)
  ctx.stroke()
  ctx.shadowBlur = 0

  const sprinkleColors = ['#fff6d8', '#e86f66', '#75a771', '#cf70b6', '#5aa8bf', '#6e79c9']
  for (let i = 0; i < 36; i += 1) {
    const angle = (Math.PI * 2 * i) / 36 + Math.sin(i * 1.37) * 0.05
    const radius = icingInner + (icingOuter - icingInner) * (0.24 + ((i * 17) % 57) / 100)
    ctx.save()
    ctx.translate(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius)
    ctx.rotate(angle + Math.PI * 0.5 + Math.sin(i * 2.1) * 1.2)
    ctx.globalAlpha = (0.2 + morph * 0.68)
    ctx.fillStyle = sprinkleColors[i % sprinkleColors.length]
    ctx.beginPath()
    ctx.roundRect(-5.5 * pulse, -1.6 * pulse, 11 * pulse, 3.2 * pulse, 1.6 * pulse)
    ctx.fill()
    ctx.restore()
  }

  ctx.globalAlpha = 0.46 * morph
  ctx.strokeStyle = '#744222'
  ctx.lineWidth = 9 * pulse
  ctx.beginPath()
  ctx.arc(x, y + 2 * pulse, hole + 2 * pulse, 0, Math.PI * 2)
  ctx.stroke()

  const holeShade = ctx.createRadialGradient(x - hole * 0.24, y - hole * 0.28, hole * 0.12, x, y + hole * 0.18, hole * 1.12)
  holeShade.addColorStop(0, 'rgba(255, 232, 174, 0.2)')
  holeShade.addColorStop(0.46, 'rgba(131, 77, 42, 0.25)')
  holeShade.addColorStop(1, 'rgba(45, 31, 22, 0.48)')
  ctx.globalAlpha = morph
  ctx.fillStyle = holeShade
  ctx.beginPath()
  ctx.arc(x, y, hole, 0, Math.PI * 2)
  ctx.fill()

  ctx.globalAlpha = 0.76 * morph
  ctx.fillStyle = '#fff0bd'
  ctx.beginPath()
  ctx.arc(x - hole * 0.22, y - hole * 0.2, 6 * pulse, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function createWavyRingPath(
  x: number,
  y: number,
  outerRadius: number,
  innerRadius: number,
  phase: number,
  outerWave: number,
  innerWave: number,
) {
  const path = new Path2D()
  const steps = 96
  for (let i = 0; i <= steps; i += 1) {
    const angle = (Math.PI * 2 * i) / steps
    const wave = Math.sin(angle * 5 + phase) * outerWave + Math.sin(angle * 9 - phase * 0.7) * outerWave * 0.42
    const radius = outerRadius + wave
    const px = x + Math.cos(angle) * radius
    const py = y + Math.sin(angle) * radius
    if (i === 0) path.moveTo(px, py)
    else path.lineTo(px, py)
  }
  path.closePath()
  for (let i = steps; i >= 0; i -= 1) {
    const angle = (Math.PI * 2 * i) / steps
    const wave = Math.sin(angle * 4 - phase * 1.2) * innerWave + Math.sin(angle * 7 + phase) * innerWave * 0.34
    const radius = innerRadius + wave
    const px = x + Math.cos(angle) * radius
    const py = y + Math.sin(angle) * radius
    if (i === steps) path.moveTo(px, py)
    else path.lineTo(px, py)
  }
  path.closePath()
  return path
}

function drawGardenSeed(ctx: CanvasRenderingContext2D, seed: GardenSeed, width: number, height: number, time: number) {
  const x = seed.x * width
  const y = seed.y * height
  const water = seed.water
  const warm = seed.warm
  const bloom = seed.bloom
  ctx.save()
  ctx.globalAlpha = 0.25 + water * 0.35
  ctx.strokeStyle = mixColor('#6a7f7b', '#d7f6ff', water)
  ctx.lineWidth = 4 + seed.pulse * 5
  ctx.beginPath()
  ctx.arc(x, y, 24 + seed.pulse * 16, Math.PI * 0.12, Math.PI * 1.88)
  ctx.stroke()

  if (water > 0.14) {
    ctx.globalAlpha = 0.28 + warm * 0.42
    ctx.strokeStyle = '#e7b76f'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(x, y + 18)
    ctx.bezierCurveTo(x - 7, y - 4, x + 5, y - 34 * clamp01(warm + bloom * 0.4), x, y - 44 * clamp01(warm + bloom))
    ctx.stroke()
    ctx.fillStyle = '#93aa78'
    ctx.beginPath()
    ctx.ellipse(x - 11, y - 17, 11 * warm, 5 * warm, -0.4, 0, Math.PI * 2)
    ctx.ellipse(x + 12, y - 24, 11 * warm, 5 * warm, 0.35, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.globalAlpha = 1
  ctx.fillStyle = mixColor('#65756f', seed.tone, warm)
  ctx.shadowColor = seed.tone
  ctx.shadowBlur = warm * 12
  ctx.beginPath()
  ctx.arc(x, y, 10 + water * 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  if (bloom > 0.05) {
    const flowerX = x
    const flowerY = y - 42 * clamp01(warm + bloom)
    const petalCount = 6
    for (let i = 0; i < petalCount; i += 1) {
      const angle = (Math.PI * 2 * i) / petalCount + Math.sin(time * 0.55 + seed.phase) * 0.08
      ctx.globalAlpha = clamp01(bloom * 1.35)
      ctx.fillStyle = i % 2 ? seed.tone : '#ffe3af'
      ctx.beginPath()
      ctx.ellipse(
        flowerX + Math.cos(angle) * (11 + bloom * 10),
        flowerY + Math.sin(angle) * (10 + bloom * 9),
        5 + bloom * 7,
        3 + bloom * 5,
        angle,
        0,
        Math.PI * 2,
      )
      ctx.fill()
    }
    ctx.globalAlpha = 0.94
    ctx.fillStyle = '#fff5c6'
    ctx.beginPath()
    ctx.arc(flowerX, flowerY, 5 + bloom * 5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawGardenCompletionGlow(ctx: CanvasRenderingContext2D, width: number, height: number, elapsed: number) {
  const glow = clamp01(elapsed / 4)
  ctx.save()
  const wash = ctx.createLinearGradient(0, 0, 0, height)
  wash.addColorStop(0, `rgba(255, 231, 174, ${0.12 + glow * 0.12})`)
  wash.addColorStop(0.62, `rgba(255, 244, 214, ${0.05 + glow * 0.1})`)
  wash.addColorStop(1, 'rgba(255, 231, 174, 0)')
  ctx.fillStyle = wash
  ctx.fillRect(0, 0, width, height)

  ctx.globalAlpha = 0.1 + Math.sin(elapsed * 0.8) * 0.025
  ctx.fillStyle = '#ffe5a8'
  ctx.beginPath()
  ctx.arc(width * 0.5, height * 0.42, width * (0.22 + glow * 0.2), 0, Math.PI * 2)
  ctx.fill()
  for (let i = 0; i < 16; i += 1) {
    const x = ((i * 97 + elapsed * 18) % (width + 80)) - 40
    const y = height * (0.18 + (i % 5) * 0.13) + Math.sin(elapsed * 0.8 + i) * 10
    ctx.globalAlpha = 0.14 + glow * 0.18
    ctx.fillStyle = i % 2 ? '#fff3c8' : '#ffd58c'
    ctx.beginPath()
    ctx.ellipse(x, y, 8 + (i % 3) * 3, 3 + (i % 2) * 2, elapsed * 0.2 + i, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawSootheHandLight(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
  ctx.save()
  ctx.globalAlpha = 0.2
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 0.78
  ctx.fillStyle = '#c87762'
  ctx.beginPath()
  ctx.arc(x, y, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function createHarborGame(): HarborGame {
  return {
    tears: HARBOR_TEAR_SPAWN_Y.map((y, id) => createHarborTear(id, y)),
    shards: [
      { id: 0, x: 0.18, y: 0.38, homeX: 0.18, homeY: 0.38, charge: 0, need: HARBOR_SHARD_NEEDS[0], repaired: false, phrase: '先接住', kind: 'open', focus: 0 },
      { id: 1, x: 0.82, y: 0.4, homeX: 0.82, homeY: 0.4, charge: 0, need: HARBOR_SHARD_NEEDS[1], repaired: false, phrase: '慢一点', kind: 'still', focus: 0 },
      { id: 2, x: 0.25, y: 0.76, homeX: 0.25, homeY: 0.76, charge: 0, need: HARBOR_SHARD_NEEDS[2], repaired: false, phrase: '少怪自己', kind: 'deep', focus: 0 },
      { id: 3, x: 0.56, y: 0.8, homeX: 0.56, homeY: 0.8, charge: 0, need: HARBOR_SHARD_NEEDS[3], repaired: false, phrase: '留在这里', kind: 'still', focus: 0 },
      { id: 4, x: 0.84, y: 0.7, homeX: 0.84, homeY: 0.7, charge: 0, need: HARBOR_SHARD_NEEDS[4], repaired: false, phrase: '会亮回来', kind: 'deep', focus: 0 },
    ],
    beads: [],
    puddles: [],
    ripples: [],
    pointerX: 0.5,
    pointerY: 0.54,
    targetX: 0.5,
    targetY: 0.54,
    lastTargetX: 0.5,
    lastTargetY: 0.54,
    calm: 0.2,
    nextBeadId: 0,
    nextPuddleId: 0,
    time: 0,
    promptShardId: 0,
    finalWarmStartedAt: null,
  }
}

function createHarborTear(id: number, y = Math.random()): HarborTear {
  const lanes = [0.16, 0.3, 0.44, 0.58, 0.72, 0.86, 0.22, 0.38, 0.52, 0.66, 0.8, 0.12]
  const x = lanes[id % lanes.length]
  const kind: HarborTearKind = id % 5 === 1 ? 'heavy' : id % 5 === 3 ? 'tangle' : 'soft'
  return {
    id,
    x,
    baseX: x,
    y,
    speed: kind === 'heavy' ? 0.022 + Math.random() * 0.01 : 0.028 + Math.random() * 0.014,
    sway: kind === 'tangle' ? 0.026 + Math.random() * 0.02 : 0.014 + Math.random() * 0.02,
    phase: Math.random() * Math.PI * 2,
    label: HARBOR_TEAR_LABELS[id % HARBOR_TEAR_LABELS.length],
    glow: 0,
    soften: 0,
    kind,
    done: false,
  }
}

function addHarborBead(game: HarborGame, x: number, y: number, orbitOffset = 0) {
  game.beads.push({
    id: game.nextBeadId,
    x,
    y,
    orbit: game.nextBeadId * 1.7 + orbitOffset,
    targetId: null,
  })
  game.nextBeadId += 1
}

function getHarborTearValue(tear: HarborTear) {
  return tear.kind === 'heavy' ? 2 : 1
}

function pullNextHarborTearIntoView(game: HarborGame) {
  const hasVisibleTear = game.tears.some((tear) => !tear.done && tear.y > -0.08 && tear.y < 1.04)
  if (hasVisibleTear) return

  const nextTear = game.tears
    .filter((tear) => !tear.done && tear.y <= -0.08)
    .sort((a, b) => b.y - a.y)[0]

  if (!nextTear) return
  nextTear.y = Math.max(nextTear.y, -0.045)
}

function getHarborShardPromptDistance(shard: HarborShard) {
  if (shard.kind === 'deep') return 0.5
  if (shard.kind === 'still') return 0.45
  return 0.42
}

function getHarborShardOpenDistance(shard: HarborShard) {
  if (shard.kind === 'deep') return 0.38
  if (shard.kind === 'still') return 0.34
  return 0.32
}

function getHarborShardAbsorbDistance(shard: HarborShard) {
  if (shard.kind === 'deep') return 0.078
  if (shard.kind === 'still') return 0.064
  return 0.055
}

function canHarborShardReceive(shard: HarborShard, game: HarborGame) {
  if (shard.repaired) return false
  return shard.kind !== 'still' || game.calm > 0.52
}

function getHarborShardFocusDistance(shard: HarborShard) {
  if (shard.kind === 'deep') return 0.27
  if (shard.kind === 'still') return 0.24
  return 0.23
}

function updateHarborGame(game: HarborGame, dt: number) {
  game.time += dt
  const targetMotion = distance(game.targetX, game.targetY, game.lastTargetX, game.lastTargetY)
  game.lastTargetX = game.targetX
  game.lastTargetY = game.targetY
  const calmTarget = targetMotion < 0.0028 ? 1 : targetMotion > 0.018 ? 0 : 0.45
  game.calm += (calmTarget - game.calm) * Math.min(1, dt * 2.4)

  const follow = Math.min(1, dt * 11)
  game.pointerX += (game.targetX - game.pointerX) * follow
  game.pointerY += (game.targetY - game.pointerY) * follow

  const repairedCount = game.shards.filter((shard) => shard.repaired).length
  const warmth = repairedCount / game.shards.length
  const catchRadius = 0.076 + game.calm * 0.052
  game.promptShardId = null
  pullNextHarborTearIntoView(game)
  if (repairedCount === game.shards.length && game.finalWarmStartedAt === null) {
    game.finalWarmStartedAt = game.time
  }

  game.tears.forEach((tear) => {
    if (tear.done) return
    tear.y += tear.speed * (1 - warmth * 0.35) * dt
    const naturalX = tear.baseX + Math.sin(game.time * 1.4 + tear.phase) * tear.sway
    const pullDistance = distance(naturalX, tear.y, game.pointerX, game.pointerY)
    const influenceRadius = tear.kind === 'heavy' ? 0.34 : tear.kind === 'tangle' ? 0.3 : 0.32
    const pull = clamp01((influenceRadius - pullDistance) / influenceRadius) * (0.36 + game.calm * 0.38)
    tear.x += (naturalX + (game.pointerX - naturalX) * pull - tear.x) * Math.min(1, dt * 8)
    const softenGain = tear.kind === 'tangle' ? 0.85 + game.calm * 1.6 : tear.kind === 'heavy' ? 1.05 : 3
    const softenLoss = tear.kind === 'soft' ? 1.2 : 0.22
    tear.soften = clamp01(tear.soften + (pull > 0.08 ? dt * pull * softenGain : -dt * softenLoss))
    tear.glow += (Math.max(pull, tear.soften) - tear.glow) * Math.min(1, dt * 7)
    const visibleX = tear.x
    const distanceToLantern = distance(visibleX, tear.y, game.pointerX, game.pointerY)
    const requiredSoftness = tear.kind === 'soft' ? 0.05 : tear.kind === 'heavy' ? 0.42 : 0.34
    const activeCatchRadius = catchRadius + (tear.kind === 'heavy' ? 0.012 : 0)

    if (distanceToLantern < activeCatchRadius && tear.soften >= requiredSoftness && game.beads.length < HARBOR_BEAD_CAP) {
      const beadCount = getHarborTearValue(tear)
      for (let i = 0; i < beadCount; i += 1) {
        addHarborBead(game, visibleX + (i - 0.5) * 0.012, tear.y, i * 0.55)
      }
      game.ripples.push({ x: visibleX, y: tear.y, radius: tear.kind === 'heavy' ? 0.04 : 0.02, alpha: 0.9, warm: tear.kind !== 'soft' })
      tear.done = true
    } else if (tear.y > 1.08) {
      game.ripples.push({ x: visibleX, y: 0.96, radius: 0.025, alpha: 0.45, warm: false })
      if (game.puddles.length < HARBOR_TEAR_SPAWN_Y.length) {
        game.puddles.push({
          id: game.nextPuddleId,
          x: clamp01(visibleX),
          y: 0.92 + Math.random() * 0.04,
          life: 1,
          label: tear.label,
          value: getHarborTearValue(tear),
        })
        game.nextPuddleId += 1
      }
      tear.done = true
    }
  })

  game.puddles.forEach((puddle, index) => {
    if (distance(game.pointerX, game.pointerY, puddle.x, puddle.y) < 0.11 + game.calm * 0.05 && game.beads.length < HARBOR_BEAD_CAP) {
      for (let i = 0; i < puddle.value; i += 1) {
        addHarborBead(game, puddle.x + (i - 0.5) * 0.014, puddle.y, i * 0.5)
      }
      game.ripples.push({ x: puddle.x, y: puddle.y, radius: 0.04, alpha: 0.8, warm: true })
      game.puddles.splice(index, 1)
    }
  })

  const nearestShard = game.shards
    .filter((shard) => !shard.repaired)
    .map((shard) => ({ shard, distance: distance(game.pointerX, game.pointerY, shard.x, shard.y) }))
    .sort((a, b) => a.distance - b.distance)[0]
  if (nearestShard && game.beads.length > 0 && nearestShard.distance < getHarborShardPromptDistance(nearestShard.shard)) {
    game.promptShardId = nearestShard.shard.id
  }
  const openShard = nearestShard && nearestShard.distance < getHarborShardOpenDistance(nearestShard.shard) ? nearestShard.shard : null
  const receivingShard = openShard && canHarborShardReceive(openShard, game) ? openShard : null
  game.shards.forEach((shard) => {
    if (shard.repaired) {
      shard.focus = 1
      return
    }
    const inFocusZone = receivingShard?.id === shard.id && distance(game.pointerX, game.pointerY, shard.x, shard.y) < getHarborShardFocusDistance(shard)
    const focusSpeed = shard.kind === 'deep' ? 1.12 : shard.kind === 'still' ? 1.42 : 1.35
    shard.focus = clamp01(shard.focus + (inFocusZone ? dt * focusSpeed * (0.65 + game.calm * 0.75) : -dt * 0.7))
  })

  for (let index = game.beads.length - 1; index >= 0; index -= 1) {
    const bead = game.beads[index]
    if (receivingShard && receivingShard.focus > 0.16) bead.targetId = receivingShard.id

    const possibleTarget = bead.targetId === null ? null : game.shards.find((shard) => shard.id === bead.targetId && !shard.repaired)
    const targetShard = possibleTarget && canHarborShardReceive(possibleTarget, game) && possibleTarget.focus > 0.16 ? possibleTarget : null
    const angle = game.time * 2.4 + bead.orbit
    const orbitX = game.pointerX + Math.cos(angle) * (0.045 + (index % 3) * 0.012)
    const orbitY = game.pointerY + Math.sin(angle) * (0.033 + (index % 2) * 0.01)
    const targetX = targetShard ? targetShard.x : orbitX
    const targetY = targetShard ? targetShard.y : orbitY
    const beadFollow = Math.min(1, dt * (targetShard ? (targetShard.kind === 'deep' ? 13 : 11) : 8.5))
    bead.x += (targetX - bead.x) * beadFollow
    bead.y += (targetY - bead.y) * beadFollow

    if (targetShard && targetShard.focus >= 0.78 && distance(bead.x, bead.y, targetShard.x, targetShard.y) < getHarborShardAbsorbDistance(targetShard)) {
      targetShard.charge = Math.min(targetShard.need, targetShard.charge + 1)
      targetShard.focus = targetShard.charge >= targetShard.need ? 1 : 0.36
      game.ripples.push({ x: targetShard.x, y: targetShard.y, radius: targetShard.kind === 'deep' ? 0.05 : 0.035, alpha: 0.95, warm: true })
      game.beads.splice(index, 1)
      if (targetShard.charge >= targetShard.need) {
        targetShard.repaired = true
        game.ripples.push({ x: targetShard.x, y: targetShard.y, radius: 0.08, alpha: 1, warm: true })
      }
    }
  }

  game.shards.forEach((shard) => {
    if (shard.repaired) {
      shard.x += (0.5 - shard.x) * Math.min(1, dt * 1.3)
      shard.y += (0.52 - shard.y) * Math.min(1, dt * 1.3)
    } else {
      shard.x = shard.homeX + Math.sin(game.time * 0.55 + shard.id) * 0.006
      shard.y = shard.homeY + Math.cos(game.time * 0.5 + shard.id * 1.7) * 0.007
    }
  })

  game.ripples.forEach((ripple) => {
    ripple.radius += dt * (ripple.warm ? 0.18 : 0.1)
    ripple.alpha -= dt * (ripple.warm ? 0.72 : 0.55)
  })
  game.ripples = game.ripples.filter((ripple) => ripple.alpha > 0)
}

function drawHarborGame(ctx: CanvasRenderingContext2D, game: HarborGame, width: number, height: number, dpr: number) {
  ctx.save()
  ctx.scale(dpr, dpr)
  const repairedCount = game.shards.filter((shard) => shard.repaired).length
  const warmth = repairedCount / game.shards.length

  const background = ctx.createLinearGradient(0, 0, width, height)
  background.addColorStop(0, mixColor('#d9e4e6', '#ffe8c4', warmth))
  background.addColorStop(0.56, mixColor('#edf0ea', '#fff3dc', warmth))
  background.addColorStop(1, mixColor('#cbd5d6', '#f4c8b1', warmth))
  ctx.fillStyle = background
  ctx.fillRect(0, 0, width, height)

  drawHarborAtmosphere(ctx, game, width, height, warmth)
  drawHarborShelter(ctx, game, width, height, warmth)
  drawHarborBasin(ctx, game, width, height, warmth)
  drawHarborRain(ctx, game, width, height, warmth)
  drawHarborHeart(ctx, game, width, height, warmth)
  drawHarborRepairedStreams(ctx, game, width, height)
  game.ripples.forEach((ripple) => drawHarborRipple(ctx, ripple, width, height))
  game.puddles.forEach((puddle) => drawHarborPuddle(ctx, puddle, game.time, width, height))
  game.tears.forEach((tear) => {
    if (!tear.done) drawHarborTear(ctx, tear, width, height)
  })
  drawHarborFlowHint(ctx, game, width, height)
  game.shards.forEach((shard) => drawHarborShard(ctx, shard, width, height, game.promptShardId, game.time, game.calm))
  game.beads.forEach((bead) => drawHarborBead(ctx, bead, width, height))
  drawHarborFinalWarmth(ctx, game, width, height)
  drawHarborLantern(ctx, game, width, height)
  drawHarborForegroundVeil(ctx, game, width, height, warmth)
  ctx.restore()
}

function drawHarborFinalWarmth(ctx: CanvasRenderingContext2D, game: HarborGame, width: number, height: number) {
  if (game.finalWarmStartedAt === null) return

  const elapsed = game.time - game.finalWarmStartedAt
  const progress = clamp01(elapsed / HARBOR_FINAL_WARM_SECONDS)
  const x = width * 0.5
  const y = height * 0.52
  const pulse = 0.5 + Math.sin(game.time * 1.8) * 0.5
  const sceneProgress = (elapsed % HARBOR_FINAL_SCENE_SECONDS) / HARBOR_FINAL_SCENE_SECONDS
  const sceneIndex = Math.min(2, Math.floor(elapsed / HARBOR_FINAL_SCENE_SECONDS))
  const imageReveal = smoothStep(clamp01((elapsed - HARBOR_FINAL_IMAGE_DELAY_SECONDS) / HARBOR_FINAL_IMAGE_FADE_SECONDS))
  const sceneDrawn = imageReveal > 0.01
    ? drawHarborGeneratedFinalScene(ctx, game, width, height, sceneIndex, sceneProgress, imageReveal)
    : false

  ctx.save()
  const fallbackReveal = smoothStep(clamp01((elapsed - 0.35) / 2.4))
  if (!sceneDrawn && sceneIndex === 0) drawHarborWarmWindowScene(ctx, game, width, height, sceneProgress * fallbackReveal)
  if (!sceneDrawn && sceneIndex === 1) drawHarborMorningFieldScene(ctx, game, width, height, sceneProgress * fallbackReveal)
  if (!sceneDrawn && sceneIndex === 2) drawHarborLanternSeaScene(ctx, game, width, height, sceneProgress * fallbackReveal)

  const wash = ctx.createRadialGradient(x, y, 20, x, y, Math.max(width, height) * (0.68 + progress * 0.22))
  wash.addColorStop(0, `rgba(255, 226, 160, ${0.3 + progress * 0.18 - imageReveal * 0.12})`)
  wash.addColorStop(0.42, `rgba(255, 213, 150, ${0.16 + progress * 0.12 - imageReveal * 0.06})`)
  wash.addColorStop(0.72, `rgba(255, 244, 224, ${0.08 * (1 - imageReveal)})`)
  wash.addColorStop(1, 'rgba(255, 246, 224, 0)')
  ctx.fillStyle = wash
  ctx.fillRect(0, 0, width, height)

  if (imageReveal < 0.98) {
    const bridgeGlow = ctx.createRadialGradient(x, y, 0, x, y, Math.max(width, height) * (0.18 + imageReveal * 0.34))
    bridgeGlow.addColorStop(0, `rgba(255, 246, 208, ${0.42 * (1 - imageReveal * 0.45)})`)
    bridgeGlow.addColorStop(0.46, `rgba(255, 211, 146, ${0.22 * (1 - imageReveal * 0.35)})`)
    bridgeGlow.addColorStop(1, 'rgba(255, 211, 146, 0)')
    ctx.fillStyle = bridgeGlow
    ctx.fillRect(0, 0, width, height)
  }

  for (let i = 0; i < 5; i += 1) {
    const ringProgress = (progress + i * 0.18 + pulse * 0.04) % 1
    ctx.globalAlpha = (1 - ringProgress) * 0.22
    ctx.strokeStyle = '#ffd893'
    ctx.lineWidth = 4 + i
    ctx.beginPath()
    ctx.arc(x, y, 48 + ringProgress * Math.min(width, height) * 0.42, 0, Math.PI * 2)
    ctx.stroke()
  }

  for (let i = 0; i < 38; i += 1) {
    const seed = i * 97.13
    const drift = (game.time * 0.035 + i * 0.071) % 1
    const angle = seed + drift * Math.PI * 2
    const radius = 35 + ((i * 41) % 260) * (0.45 + progress * 0.45)
    const moteX = x + Math.cos(angle) * radius
    const moteY = y + Math.sin(angle) * radius - drift * 46
    ctx.globalAlpha = 0.1 + (1 - Math.abs(drift - 0.5) * 2) * 0.32
    ctx.fillStyle = i % 3 === 0 ? '#fff5cf' : '#ffd08a'
    ctx.beginPath()
    ctx.arc(moteX, moteY, 2 + (i % 4), 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.globalAlpha = 0.22 + progress * 0.24
  ctx.fillStyle = '#fff0b7'
  ctx.beginPath()
  ctx.arc(x, y, 74 + progress * 36 + pulse * 7, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawHarborGeneratedFinalScene(
  ctx: CanvasRenderingContext2D,
  game: HarborGame,
  width: number,
  height: number,
  sceneIndex: number,
  sceneProgress: number,
  reveal: number,
) {
  const images = getHarborFinalSceneImages()
  const current = images[sceneIndex]
  if (!current?.complete || current.naturalWidth === 0) return false

  const transition = smoothStep(clamp01((sceneProgress - 0.66) / 0.34))
  drawHarborSceneImageCover(ctx, current, width, height, sceneProgress, sceneIndex, reveal)

  const next = images[sceneIndex + 1]
  if (next?.complete && next.naturalWidth > 0 && transition > 0) {
    drawHarborSceneImageCover(ctx, next, width, height, 0, sceneIndex + 1, reveal * transition)
  }

  ctx.save()
  ctx.globalAlpha = 0.24 * reveal
  const softVeil = ctx.createLinearGradient(0, 0, 0, height)
  softVeil.addColorStop(0, 'rgba(255, 246, 224, 0.18)')
  softVeil.addColorStop(0.55, 'rgba(255, 222, 177, 0.08)')
  softVeil.addColorStop(1, 'rgba(62, 74, 78, 0.16)')
  ctx.fillStyle = softVeil
  ctx.fillRect(0, 0, width, height)

  const drift = Math.sin(game.time * 0.24 + sceneIndex) * width * 0.012
  ctx.globalAlpha = 0.16 * reveal
  ctx.fillStyle = '#fff2c7'
  ctx.beginPath()
  ctx.ellipse(width * 0.5 + drift, height * 0.52, width * 0.28, height * 0.2, -0.08, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  return true
}

function drawHarborSceneImageCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  sceneProgress: number,
  sceneIndex: number,
  alpha: number,
) {
  const imageRatio = image.naturalWidth / image.naturalHeight
  const canvasRatio = width / height
  let sourceWidth = image.naturalWidth
  let sourceHeight = image.naturalHeight
  let sourceX = 0
  let sourceY = 0

  if (imageRatio > canvasRatio) {
    sourceWidth = image.naturalHeight * canvasRatio
    sourceX = (image.naturalWidth - sourceWidth) * 0.5
  } else {
    sourceHeight = image.naturalWidth / canvasRatio
    sourceY = (image.naturalHeight - sourceHeight) * 0.5
  }

  const panX = Math.sin(sceneProgress * Math.PI * 0.8 + sceneIndex) * sourceWidth * 0.018
  const panY = (sceneProgress - 0.5) * sourceHeight * 0.022
  const zoom = 1.035 + sceneProgress * 0.025
  const zoomedWidth = sourceWidth / zoom
  const zoomedHeight = sourceHeight / zoom
  const zoomX = sourceX + (sourceWidth - zoomedWidth) * 0.5 + panX
  const zoomY = sourceY + (sourceHeight - zoomedHeight) * 0.5 + panY

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.drawImage(
    image,
    Math.max(0, Math.min(image.naturalWidth - zoomedWidth, zoomX)),
    Math.max(0, Math.min(image.naturalHeight - zoomedHeight, zoomY)),
    zoomedWidth,
    zoomedHeight,
    0,
    0,
    width,
    height,
  )
  ctx.restore()
}

function drawHarborWarmWindowScene(
  ctx: CanvasRenderingContext2D,
  game: HarborGame,
  width: number,
  height: number,
  sceneProgress: number,
) {
  ctx.save()
  ctx.globalAlpha = 0.18 + sceneProgress * 0.2
  const glow = ctx.createLinearGradient(0, 0, width, height)
  glow.addColorStop(0, '#fff0c2')
  glow.addColorStop(0.48, '#f7c996')
  glow.addColorStop(1, '#d9c6b2')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, width, height)

  const windowX = width * 0.18
  const windowY = height * 0.12
  const windowW = width * 0.34
  const windowH = height * 0.46
  ctx.globalAlpha = 0.22 + sceneProgress * 0.28
  ctx.fillStyle = '#fff5d0'
  ctx.fillRect(windowX, windowY, windowW, windowH)
  ctx.strokeStyle = 'rgba(137, 94, 72, 0.25)'
  ctx.lineWidth = 4
  ctx.strokeRect(windowX, windowY, windowW, windowH)
  ctx.beginPath()
  ctx.moveTo(windowX + windowW * 0.5, windowY)
  ctx.lineTo(windowX + windowW * 0.5, windowY + windowH)
  ctx.moveTo(windowX, windowY + windowH * 0.5)
  ctx.lineTo(windowX + windowW, windowY + windowH * 0.5)
  ctx.stroke()

  for (let i = 0; i < 14; i += 1) {
    const drift = (game.time * 0.08 + i * 0.13) % 1
    ctx.globalAlpha = 0.12 + drift * 0.18
    ctx.fillStyle = i % 2 ? '#ffd79a' : '#fff3c8'
    ctx.beginPath()
    ctx.ellipse(width * (0.58 + i * 0.027), height * (0.2 + drift * 0.58), 18 + i % 4, 4, -0.45, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawHarborMorningFieldScene(
  ctx: CanvasRenderingContext2D,
  game: HarborGame,
  width: number,
  height: number,
  sceneProgress: number,
) {
  ctx.save()
  ctx.globalAlpha = 0.2 + sceneProgress * 0.24
  const sky = ctx.createLinearGradient(0, 0, 0, height)
  sky.addColorStop(0, '#fce0b6')
  sky.addColorStop(0.5, '#fdebd0')
  sky.addColorStop(1, '#cfd9bd')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, width, height)

  const sunX = width * (0.72 - sceneProgress * 0.12)
  const sunY = height * (0.36 - sceneProgress * 0.1)
  ctx.fillStyle = '#ffd17b'
  ctx.beginPath()
  ctx.arc(sunX, sunY, 48 + sceneProgress * 18, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = 'rgba(122, 149, 102, 0.42)'
  for (let i = 0; i < 7; i += 1) {
    const y = height * (0.72 + i * 0.025)
    ctx.beginPath()
    ctx.moveTo(0, y)
    for (let x = 0; x <= width + 20; x += 40) {
      ctx.lineTo(x, y + Math.sin(game.time * 0.7 + x * 0.015 + i) * 10)
    }
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.fill()
  }

  for (let i = 0; i < 22; i += 1) {
    const sway = Math.sin(game.time * 0.9 + i) * 7
    const x = ((i * 59 + sceneProgress * 30) % (width + 80)) - 40
    const y = height * (0.66 + (i % 7) * 0.035)
    ctx.globalAlpha = 0.24
    ctx.strokeStyle = '#f5d39c'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x, y + 28)
    ctx.quadraticCurveTo(x + sway, y + 10, x + sway * 0.7, y)
    ctx.stroke()
  }
  ctx.restore()
}

function drawHarborLanternSeaScene(
  ctx: CanvasRenderingContext2D,
  game: HarborGame,
  width: number,
  height: number,
  sceneProgress: number,
) {
  ctx.save()
  ctx.globalAlpha = 0.2 + sceneProgress * 0.26
  const sea = ctx.createLinearGradient(0, 0, 0, height)
  sea.addColorStop(0, '#e9d7be')
  sea.addColorStop(0.55, '#d4c3b2')
  sea.addColorStop(1, '#9fb0ad')
  ctx.fillStyle = sea
  ctx.fillRect(0, 0, width, height)

  ctx.strokeStyle = 'rgba(255, 236, 196, 0.3)'
  ctx.lineWidth = 2
  for (let i = 0; i < 9; i += 1) {
    const y = height * (0.36 + i * 0.065)
    ctx.beginPath()
    for (let x = -20; x <= width + 20; x += 34) {
      const waveY = y + Math.sin(game.time * 0.6 + x * 0.02 + i) * 6
      if (x === -20) ctx.moveTo(x, waveY)
      else ctx.lineTo(x, waveY)
    }
    ctx.stroke()
  }

  for (let i = 0; i < 18; i += 1) {
    const drift = (game.time * 0.028 + i * 0.089) % 1
    const x = width * ((i * 0.173 + drift * 0.08) % 1)
    const y = height * (0.72 - drift * 0.5 + (i % 3) * 0.04)
    const size = 11 + (i % 5) * 2
    ctx.globalAlpha = 0.2 + (1 - Math.abs(drift - 0.45) * 1.7) * 0.28
    ctx.fillStyle = '#ffd793'
    ctx.beginPath()
    ctx.roundRect(x - size, y - size * 0.65, size * 2, size * 1.3, 6)
    ctx.fill()
    ctx.fillStyle = '#fff6cf'
    ctx.beginPath()
    ctx.arc(x, y - 1, size * 0.34, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawHarborFlowHint(ctx: CanvasRenderingContext2D, game: HarborGame, width: number, height: number) {
  if (game.promptShardId === null || game.beads.length === 0) return
  const shard = game.shards.find((candidate) => candidate.id === game.promptShardId && !candidate.repaired)
  if (!shard) return

  const fromX = game.pointerX * width
  const fromY = game.pointerY * height
  const toX = shard.x * width
  const toY = shard.y * height
  const shimmer = 0.5 + Math.sin(game.time * 5) * 0.5
  const receiving = canHarborShardReceive(shard, game)

  ctx.save()
  ctx.globalAlpha = receiving ? 0.28 + shimmer * 0.18 : 0.12 + game.calm * 0.16
  ctx.strokeStyle = receiving ? 'rgba(255, 214, 148, 0.78)' : 'rgba(111, 135, 142, 0.55)'
  ctx.lineWidth = Math.max(2, width * 0.005)
  ctx.setLineDash(receiving ? [6, 12] : [2, 14])
  ctx.lineDashOffset = -game.time * (receiving ? 30 : 12)
  ctx.beginPath()
  ctx.moveTo(fromX, fromY)
  ctx.quadraticCurveTo((fromX + toX) / 2, Math.min(fromY, toY) - height * 0.08, toX, toY)
  ctx.stroke()
  ctx.restore()
}

function drawHarborRepairedStreams(ctx: CanvasRenderingContext2D, game: HarborGame, width: number, height: number) {
  const repaired = game.shards.filter((shard) => shard.repaired)
  if (repaired.length === 0) return

  ctx.save()
  repaired.forEach((shard) => {
    const fromX = shard.x * width
    const fromY = shard.y * height
    const toX = width * 0.5
    const toY = height * 0.52
    const pulse = 0.5 + Math.sin(game.time * 3.4 + shard.id) * 0.5
    ctx.globalAlpha = 0.12 + pulse * 0.13
    ctx.strokeStyle = 'rgba(255, 203, 128, 0.82)'
    ctx.lineWidth = 5 + pulse * 3
    ctx.beginPath()
    ctx.moveTo(fromX, fromY)
    ctx.quadraticCurveTo((fromX + toX) / 2, (fromY + toY) / 2 - height * 0.1, toX, toY)
    ctx.stroke()
  })
  ctx.restore()
}

function drawHarborAtmosphere(ctx: CanvasRenderingContext2D, game: HarborGame, width: number, height: number, warmth: number) {
  ctx.save()
  const horizon = height * (0.44 + Math.sin(game.time * 0.12) * 0.015)
  const water = ctx.createLinearGradient(0, horizon, 0, height)
  water.addColorStop(0, `rgba(148, 174, 177, ${0.2 - warmth * 0.08})`)
  water.addColorStop(0.46, `rgba(123, 151, 154, ${0.18 - warmth * 0.06})`)
  water.addColorStop(1, `rgba(74, 96, 103, ${0.24 - warmth * 0.08})`)
  ctx.fillStyle = water
  ctx.beginPath()
  ctx.moveTo(0, horizon)
  for (let x = 0; x <= width + 24; x += 42) {
    const y = horizon + Math.sin(game.time * 0.28 + x * 0.012) * 14 + Math.cos(game.time * 0.18 + x * 0.021) * 8
    if (x === 0) ctx.lineTo(x, y)
    else ctx.quadraticCurveTo(x - 21, y - 8, x, y)
  }
  ctx.lineTo(width, height)
  ctx.lineTo(0, height)
  ctx.closePath()
  ctx.fill()

  for (let band = 0; band < 7; band += 1) {
    const y = height * (0.54 + band * 0.06)
    ctx.globalAlpha = 0.09 + warmth * 0.04
    ctx.strokeStyle = band % 2 ? '#fff0c4' : '#d9eef0'
    ctx.lineWidth = 1.4
    ctx.beginPath()
    for (let x = -40; x <= width + 40; x += 28) {
      const waveY = y + Math.sin(game.time * (0.35 + band * 0.03) + x * 0.018 + band) * (4 + band)
      if (x === -40) ctx.moveTo(x, waveY)
      else ctx.lineTo(x, waveY)
    }
    ctx.stroke()
  }

  for (let i = 0; i < 8; i += 1) {
    const drift = (game.time * 0.016 + i * 0.13) % 1
    const x = width * ((i * 0.171 + drift * 0.08) % 1)
    const y = height * (0.12 + (i % 4) * 0.1)
    const mist = ctx.createRadialGradient(x, y, 0, x, y, width * (0.16 + (i % 3) * 0.03))
    mist.addColorStop(0, `rgba(255, 246, 225, ${0.08 + warmth * 0.07})`)
    mist.addColorStop(1, 'rgba(255, 246, 225, 0)')
    ctx.fillStyle = mist
    ctx.fillRect(0, 0, width, height)
  }

  const vignette = ctx.createRadialGradient(width * 0.5, height * 0.48, Math.min(width, height) * 0.2, width * 0.5, height * 0.5, Math.max(width, height) * 0.62)
  vignette.addColorStop(0, 'rgba(255, 255, 255, 0)')
  vignette.addColorStop(1, `rgba(54, 70, 76, ${0.12 - warmth * 0.07})`)
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, width, height)
  ctx.restore()
}

function drawHarborShelter(ctx: CanvasRenderingContext2D, game: HarborGame, width: number, height: number, warmth: number) {
  ctx.save()
  const pulse = 0.5 + Math.sin(game.time * 0.9) * 0.5
  const lampX = width * (0.2 + Math.sin(game.time * 0.13) * 0.014)
  const lampY = height * 0.18

  const windowGlow = ctx.createRadialGradient(lampX, lampY, 0, lampX, lampY, Math.max(width, height) * 0.46)
  windowGlow.addColorStop(0, `rgba(255, 229, 172, ${0.26 + warmth * 0.18})`)
  windowGlow.addColorStop(0.32, `rgba(255, 214, 158, ${0.12 + warmth * 0.1})`)
  windowGlow.addColorStop(1, 'rgba(255, 214, 158, 0)')
  ctx.fillStyle = windowGlow
  ctx.fillRect(0, 0, width, height)

  ctx.globalAlpha = 0.18 + warmth * 0.12
  ctx.strokeStyle = '#fff1cf'
  ctx.lineWidth = 1.2
  for (let i = 0; i < 9; i += 1) {
    const angle = -0.68 + i * 0.13 + Math.sin(game.time * 0.2 + i) * 0.018
    ctx.beginPath()
    ctx.moveTo(lampX, lampY)
    ctx.lineTo(lampX + Math.cos(angle) * width * 0.92, lampY + Math.sin(angle) * height * 0.9)
    ctx.stroke()
  }

  const shoreY = height * 0.76
  const shore = ctx.createLinearGradient(0, shoreY - height * 0.08, 0, height)
  shore.addColorStop(0, `rgba(109, 123, 122, ${0.09 - warmth * 0.02})`)
  shore.addColorStop(1, `rgba(80, 78, 72, ${0.22 - warmth * 0.08})`)
  ctx.globalAlpha = 1
  ctx.fillStyle = shore
  ctx.beginPath()
  ctx.moveTo(0, shoreY)
  for (let x = 0; x <= width + 36; x += 36) {
    const y = shoreY + Math.sin(game.time * 0.17 + x * 0.022) * 10 + Math.cos(x * 0.013) * 18
    if (x === 0) ctx.lineTo(x, y)
    else ctx.quadraticCurveTo(x - 18, y - 12, x, y)
  }
  ctx.lineTo(width, height)
  ctx.lineTo(0, height)
  ctx.closePath()
  ctx.fill()

  for (let i = 0; i < 18; i += 1) {
    const drift = (game.time * 0.025 + i * 0.071) % 1
    const moteX = width * ((i * 0.173 + drift * 0.16) % 1)
    const moteY = height * (0.08 + ((i * 0.19) % 0.58))
    ctx.globalAlpha = 0.08 + pulse * 0.05 + warmth * 0.04
    ctx.fillStyle = i % 3 === 0 ? '#fff4ca' : '#cce8e9'
    ctx.beginPath()
    ctx.arc(moteX, moteY, 1.4 + (i % 4) * 0.7, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

function drawHarborBasin(ctx: CanvasRenderingContext2D, game: HarborGame, width: number, height: number, warmth: number) {
  ctx.save()
  const cx = width * 0.5
  const cy = height * 0.77
  const basinWidth = width * 0.74
  const basinHeight = height * 0.24
  const glow = 0.5 + Math.sin(game.time * 1.1) * 0.5

  const basinShadow = ctx.createRadialGradient(cx, cy + basinHeight * 0.32, basinWidth * 0.08, cx, cy + basinHeight * 0.33, basinWidth * 0.54)
  basinShadow.addColorStop(0, `rgba(255, 226, 170, ${0.1 + warmth * 0.12})`)
  basinShadow.addColorStop(0.46, `rgba(82, 104, 110, ${0.18 - warmth * 0.08})`)
  basinShadow.addColorStop(1, 'rgba(42, 54, 58, 0)')
  ctx.fillStyle = basinShadow
  ctx.beginPath()
  ctx.ellipse(cx, cy + basinHeight * 0.28, basinWidth * 0.55, basinHeight * 0.58, 0, 0, Math.PI * 2)
  ctx.fill()

  const bowl = ctx.createLinearGradient(cx, cy - basinHeight * 0.5, cx, cy + basinHeight * 0.65)
  bowl.addColorStop(0, `rgba(244, 252, 247, ${0.25 + warmth * 0.12})`)
  bowl.addColorStop(0.42, `rgba(170, 191, 190, ${0.22 - warmth * 0.02})`)
  bowl.addColorStop(1, `rgba(82, 94, 95, ${0.28 - warmth * 0.1})`)
  ctx.fillStyle = bowl
  ctx.beginPath()
  ctx.moveTo(cx - basinWidth * 0.48, cy - basinHeight * 0.15)
  ctx.bezierCurveTo(cx - basinWidth * 0.43, cy + basinHeight * 0.34, cx - basinWidth * 0.22, cy + basinHeight * 0.64, cx, cy + basinHeight * 0.66)
  ctx.bezierCurveTo(cx + basinWidth * 0.22, cy + basinHeight * 0.64, cx + basinWidth * 0.43, cy + basinHeight * 0.34, cx + basinWidth * 0.48, cy - basinHeight * 0.15)
  ctx.bezierCurveTo(cx + basinWidth * 0.3, cy + basinHeight * 0.04, cx - basinWidth * 0.3, cy + basinHeight * 0.04, cx - basinWidth * 0.48, cy - basinHeight * 0.15)
  ctx.closePath()
  ctx.fill()

  const rim = ctx.createLinearGradient(cx - basinWidth * 0.42, cy - basinHeight * 0.18, cx + basinWidth * 0.42, cy + basinHeight * 0.02)
  rim.addColorStop(0, 'rgba(232, 249, 248, 0.42)')
  rim.addColorStop(0.42, `rgba(255, 228, 168, ${0.28 + warmth * 0.28})`)
  rim.addColorStop(1, 'rgba(121, 149, 150, 0.24)')
  ctx.fillStyle = rim
  ctx.strokeStyle = `rgba(255, 246, 218, ${0.34 + warmth * 0.2})`
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.ellipse(cx, cy - basinHeight * 0.12, basinWidth * 0.48, basinHeight * 0.17, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.globalAlpha = 0.2 + warmth * 0.16
  ctx.strokeStyle = '#fff2c5'
  ctx.lineWidth = 2
  for (let i = 0; i < 5; i += 1) {
    const radiusX = basinWidth * (0.12 + i * 0.067)
    const radiusY = basinHeight * (0.035 + i * 0.016)
    ctx.beginPath()
    ctx.ellipse(cx + Math.sin(game.time * 0.6 + i) * 4, cy - basinHeight * 0.1 + i * 4, radiusX, radiusY, 0, 0, Math.PI * 2)
    ctx.stroke()
  }

  const lanternX = game.pointerX * width
  const lanternY = game.pointerY * height
  ctx.globalAlpha = 0.1 + glow * 0.06
  ctx.strokeStyle = '#ffd18b'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(lanternX, lanternY)
  ctx.quadraticCurveTo(cx, Math.min(lanternY, cy) - height * 0.1, cx, cy - basinHeight * 0.1)
  ctx.stroke()
  ctx.restore()
}

function drawHarborRain(ctx: CanvasRenderingContext2D, game: HarborGame, width: number, height: number, warmth: number) {
  ctx.save()
  const count = Math.round(54 - warmth * 30)
  for (let i = 0; i < count; i++) {
    const x = ((i * 83 + game.time * 16) % (width + 90)) - 45
    const y = (i * 47 + game.time * 72) % (height + 120)
    const alpha = 0.08 + ((i % 5) / 5) * 0.12 - warmth * 0.06
    ctx.globalAlpha = Math.max(0.03, alpha)
    ctx.strokeStyle = i % 4 === 0 ? '#f5dfca' : '#5f777b'
    ctx.lineWidth = i % 4 === 0 ? 1.4 : 0.8
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + 11 + (i % 3) * 3, y + 34 + (i % 4) * 7)
    ctx.stroke()
  }

  const splashCount = Math.round(22 - warmth * 12)
  for (let i = 0; i < splashCount; i += 1) {
    const t = (game.time * 0.34 + i * 0.113) % 1
    const x = width * ((i * 0.127 + Math.sin(i * 4.1) * 0.02 + t * 0.03) % 1)
    const y = height * (0.56 + (i % 7) * 0.055)
    const radius = 5 + t * (16 + (i % 3) * 5)
    ctx.globalAlpha = (1 - t) * (0.1 + warmth * 0.04)
    ctx.strokeStyle = i % 2 ? '#f7e1c8' : '#c9e0e2'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.ellipse(x, y, radius, radius * 0.32, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}

function drawHarborHeart(ctx: CanvasRenderingContext2D, game: HarborGame, width: number, height: number, warmth: number) {
  const x = width * 0.5
  const y = height * 0.52
  ctx.save()
  const pulse = Math.sin(game.time * 1.7) * 0.5 + 0.5
  ctx.globalAlpha = 0.08 + warmth * 0.2
  ctx.fillStyle = '#ffd98f'
  ctx.beginPath()
  ctx.arc(x, y, 118 + warmth * 48 + pulse * 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 0.16 + warmth * 0.24
  ctx.strokeStyle = '#ffe1a0'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.arc(x, y, 66 + warmth * 28 + pulse * 5, 0, Math.PI * 2)
  ctx.stroke()

  const glass = ctx.createRadialGradient(x - 12, y - 18, 4, x, y, 45 + warmth * 10)
  glass.addColorStop(0, '#fff6d6')
  glass.addColorStop(0.28, mixColor('#d8eef0', '#ffd99c', warmth))
  glass.addColorStop(0.72, mixColor('#8fa5aa', '#ee9b5d', warmth))
  glass.addColorStop(1, mixColor('#536c73', '#9b5a3d', warmth))
  ctx.globalAlpha = 0.96
  ctx.fillStyle = glass
  ctx.beginPath()
  ctx.ellipse(x, y + 2, 34 + warmth * 10, 38 + warmth * 9, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = `rgba(255, 245, 214, ${0.38 + warmth * 0.42})`
  ctx.lineWidth = 2.4
  ctx.stroke()

  ctx.globalAlpha = 0.22 + warmth * 0.36
  ctx.fillStyle = '#fff0b7'
  ctx.beginPath()
  ctx.ellipse(x, y + 10, 18 + warmth * 16, 11 + warmth * 6, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#fff7d7'
  ctx.globalAlpha = 0.62 + warmth * 0.3
  ctx.beginPath()
  ctx.ellipse(x - 11, y - 14, 8 + warmth * 4, 14 + warmth * 4, -0.55, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawHarborTear(ctx: CanvasRenderingContext2D, tear: HarborTear, width: number, height: number) {
  const x = tear.x * width
  const y = tear.y * height
  const sizeScale = tear.kind === 'heavy' ? 1.28 : tear.kind === 'tangle' ? 1.16 : 1.14
  const scale = tear.kind === 'heavy' ? 1.1 : tear.kind === 'tangle' ? 1.02 : 1
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(sizeScale, sizeScale)
  if (tear.glow > 0.05) {
    ctx.globalAlpha = tear.glow * 0.62
    const warmGlow = ctx.createRadialGradient(0, 4, 0, 0, 4, 48 + tear.soften * 10)
    warmGlow.addColorStop(0, '#fff1bd')
    warmGlow.addColorStop(0.42, '#ffd98f')
    warmGlow.addColorStop(1, 'rgba(255, 217, 143, 0)')
    ctx.fillStyle = warmGlow
    ctx.beginPath()
    ctx.arc(0, 4, 30 + tear.glow * 22 + tear.soften * 12, 0, Math.PI * 2)
    ctx.fill()
  }
  if (tear.kind !== 'soft') {
    ctx.globalAlpha = 0.22 + tear.soften * 0.36
    ctx.strokeStyle = tear.kind === 'heavy' ? '#ead4c7' : '#f5cdb5'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(0, 4, 25 + tear.soften * 9, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  const tearFill = ctx.createLinearGradient(-16 * scale, -20 * scale, 16 * scale, 24 * scale)
  tearFill.addColorStop(0, mixColor('#d9f0f3', '#fff0c0', tear.glow))
  tearFill.addColorStop(0.35, mixColor('#82a4ad', '#f7c883', tear.glow))
  tearFill.addColorStop(1, mixColor('#3f626c', '#c87554', tear.glow))
  ctx.fillStyle = tearFill
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.58 + tear.glow * 0.32})`
  ctx.lineWidth = 1 + tear.glow
  if (tear.kind === 'tangle') {
    ctx.save()
    ctx.rotate(Math.sin(tear.phase) * 0.16)
    ctx.beginPath()
    ctx.arc(-7 * scale, 1 * scale, 12 * scale + tear.soften * 2, 0, Math.PI * 2)
    ctx.arc(8 * scale, -2 * scale, 13 * scale + tear.soften * 2, 0, Math.PI * 2)
    ctx.arc(0, 11 * scale, 11 * scale + tear.soften * 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  } else {
    ctx.beginPath()
    ctx.moveTo(0, -17 * scale)
    ctx.bezierCurveTo(15 * scale, 0, 11 * scale, 20 * scale, 0, 22 * scale)
    ctx.bezierCurveTo(-11 * scale, 20 * scale, -15 * scale, 0, 0, -17 * scale)
    ctx.fill()
    ctx.stroke()
  }
  ctx.globalAlpha = 0.62 + tear.glow * 0.26
  ctx.fillStyle = 'rgba(255, 255, 255, 0.72)'
  ctx.beginPath()
  ctx.ellipse(-5 * scale, -6 * scale, 4.5 * scale, 9 * scale, -0.45, 0, Math.PI * 2)
  ctx.fill()

  if (tear.kind === 'heavy') {
    ctx.globalAlpha = 0.45 + tear.soften * 0.3
    ctx.strokeStyle = 'rgba(255, 244, 219, 0.78)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(0, 3, 11 + tear.soften * 5, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.shadowColor = 'transparent'
  ctx.font = '850 13px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const labelGlow = Math.max(tear.glow, tear.soften)

  const innerShade = ctx.createRadialGradient(0, 5, 2, 0, 5, 18 * scale)
  innerShade.addColorStop(0, tear.kind === 'heavy' ? 'rgba(73, 54, 56, 0.38)' : 'rgba(38, 70, 78, 0.34)')
  innerShade.addColorStop(0.58, tear.kind === 'heavy' ? 'rgba(73, 54, 56, 0.18)' : 'rgba(38, 70, 78, 0.14)')
  innerShade.addColorStop(1, 'rgba(38, 70, 78, 0)')
  ctx.globalAlpha = 0.78 + labelGlow * 0.12
  ctx.fillStyle = innerShade
  ctx.beginPath()
  if (tear.kind === 'tangle') {
    ctx.ellipse(0, 4, 18 * scale, 14 * scale, 0, 0, Math.PI * 2)
  } else {
    ctx.moveTo(0, -7 * scale)
    ctx.bezierCurveTo(10 * scale, 0, 8 * scale, 15 * scale, 0, 16 * scale)
    ctx.bezierCurveTo(-8 * scale, 15 * scale, -10 * scale, 0, 0, -7 * scale)
  }
  ctx.fill()

  ctx.globalAlpha = 0.95
  ctx.lineWidth = 3.2
  ctx.strokeStyle = tear.kind === 'heavy' ? 'rgba(62, 45, 48, 0.78)' : 'rgba(28, 56, 64, 0.78)'
  ctx.strokeText(tear.label, 0, 4)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.98)'
  ctx.fillText(tear.label, 0, 4)
  ctx.restore()
}

function drawHarborShard(
  ctx: CanvasRenderingContext2D,
  shard: HarborShard,
  width: number,
  height: number,
  promptShardId: number | null,
  time: number,
  calm: number,
) {
  const x = shard.x * width
  const y = shard.y * height
  const warm = shard.charge / shard.need
  ctx.save()
  ctx.translate(x, y)
  const prompted = !shard.repaired && shard.id === promptShardId
  const stillOpen = shard.kind !== 'still' || calm > 0.52
  if (!shard.repaired && shard.kind === 'deep') {
    ctx.globalAlpha = 0.24 + warm * 0.22
    ctx.fillStyle = '#526c73'
    ctx.beginPath()
    ctx.ellipse(0, 13, 46, 18 + warm * 8, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }
  if (!shard.repaired && shard.kind === 'still') {
    for (let i = 0; i < 3; i += 1) {
      ctx.globalAlpha = (stillOpen ? 0.2 : 0.12) + calm * 0.18
      ctx.strokeStyle = stillOpen ? '#ffd38a' : '#6c858c'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(0, 0, 42 + i * 9 + Math.sin(time * 1.4 + i) * 2, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }
  if (!shard.repaired && shard.focus > 0.04) {
    ctx.globalAlpha = 0.48 + shard.focus * 0.36
    ctx.strokeStyle = '#ffd28a'
    ctx.lineWidth = 5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(0, 0, shard.kind === 'deep' ? 58 : 48, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * shard.focus)
    ctx.stroke()
    ctx.lineCap = 'butt'
    ctx.globalAlpha = 1
  }
  if (prompted) {
    ctx.globalAlpha = stillOpen ? 0.32 + Math.sin(time * 4.2) * 0.08 : 0.18 + calm * 0.1
    ctx.fillStyle = stillOpen ? '#ffd58a' : '#94aab0'
    ctx.beginPath()
    ctx.arc(0, 0, shard.kind === 'deep' ? 64 : 54, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }
  ctx.rotate((shard.id - 2) * 0.18)
  ctx.globalAlpha = 0.22
  ctx.fillStyle = '#43565d'
  ctx.beginPath()
  ctx.ellipse(4, 18, 36, 12, 0.12, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  const shardFill = ctx.createLinearGradient(-28, -34, 28, 32)
  shardFill.addColorStop(0, shard.repaired ? '#fff0bd' : mixColor('#b5c7ca', '#ffd18b', warm))
  shardFill.addColorStop(0.5, shard.repaired ? '#ffd18b' : mixColor(shard.kind === 'deep' ? '#6f858a' : '#84989d', '#e3a66f', warm))
  shardFill.addColorStop(1, shard.repaired ? '#bd7751' : mixColor('#4d646b', '#a9654d', warm))
  ctx.fillStyle = shardFill
  ctx.strokeStyle = shard.repaired ? 'rgba(255, 235, 175, 0.95)' : 'rgba(79, 96, 101, 0.5)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, -34)
  ctx.lineTo(29, -7)
  ctx.lineTo(20, 27)
  ctx.lineTo(-20, 29)
  ctx.lineTo(-30, -6)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.globalAlpha = 0.2 + warm * 0.32
  ctx.strokeStyle = '#fff8d8'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(-16, -12)
  ctx.quadraticCurveTo(-3, -22, 17, -9)
  ctx.stroke()
  ctx.globalAlpha = 1
  ctx.strokeStyle = `rgba(255, 246, 214, ${0.18 + warm * 0.7})`
  ctx.lineWidth = 3
  for (let i = 0; i < shard.need; i++) {
    const angle = -Math.PI / 2 + i * (Math.PI * 2 / shard.need)
    const sx = Math.cos(angle) * 28
    const sy = Math.sin(angle) * 28
    ctx.beginPath()
    ctx.arc(sx, sy, 4, 0, Math.PI * 2)
    ctx.strokeStyle = i < shard.charge ? `rgba(255, 246, 214, ${0.35 + warm * 0.6})` : 'rgba(255, 255, 255, 0.28)'
    ctx.stroke()
  }
  for (let i = 0; i < shard.charge; i++) {
    ctx.beginPath()
    ctx.arc(-15 + i * 15, 2, 4, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.fillStyle = shard.repaired ? '#7b5239' : 'rgba(255, 255, 255, 0.72)'
  ctx.font = '800 12px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(shard.repaired ? shard.phrase : `${shard.charge}/${shard.need}`, 0, 4)
  ctx.restore()
}

function drawHarborPuddle(ctx: CanvasRenderingContext2D, puddle: HarborPuddle, time: number, width: number, height: number) {
  const x = puddle.x * width
  const y = puddle.y * height
  ctx.save()
  ctx.globalAlpha = Math.max(0, Math.min(0.72, puddle.life * 0.72))
  ctx.translate(x, y + Math.sin(time * 1.5 + puddle.id) * 2)
  const puddleFill = ctx.createRadialGradient(0, 0, 0, 0, 0, 34)
  puddleFill.addColorStop(0, 'rgba(186, 215, 219, 0.34)')
  puddleFill.addColorStop(1, 'rgba(68, 91, 99, 0.44)')
  ctx.fillStyle = puddleFill
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.ellipse(0, 0, 31, 10, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.56)'
  ctx.font = '700 11px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(puddle.label, 0, 0)
  ctx.restore()
}

function drawHarborBead(ctx: CanvasRenderingContext2D, bead: HarborBead, width: number, height: number) {
  const x = bead.x * width
  const y = bead.y * height
  ctx.save()
  ctx.shadowColor = '#ffcf7a'
  ctx.shadowBlur = 18
  const beadFill = ctx.createRadialGradient(x - 3, y - 4, 1, x, y, 9)
  beadFill.addColorStop(0, '#fff7cf')
  beadFill.addColorStop(0.4, '#ffd26f')
  beadFill.addColorStop(1, '#d37c4d')
  ctx.fillStyle = beadFill
  ctx.beginPath()
  ctx.arc(x, y, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.globalAlpha = 0.75
  ctx.fillStyle = '#fff9dd'
  ctx.beginPath()
  ctx.arc(x - 3, y - 3, 2.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawHarborLantern(ctx: CanvasRenderingContext2D, game: HarborGame, width: number, height: number) {
  const x = game.pointerX * width
  const y = game.pointerY * height
  ctx.save()
  ctx.globalAlpha = 0.14 + game.calm * 0.16
  ctx.fillStyle = '#ffd58a'
  ctx.beginPath()
  ctx.arc(x, y, 62 + game.calm * 42, 0, Math.PI * 2)
  ctx.fill()
  const halo = ctx.createRadialGradient(x, y, 0, x, y, 42 + game.calm * 24)
  halo.addColorStop(0, '#fff4bf')
  halo.addColorStop(0.58, '#ffd58a')
  halo.addColorStop(1, 'rgba(255, 213, 138, 0)')
  ctx.globalAlpha = 0.28 + game.calm * 0.34
  ctx.fillStyle = halo
  ctx.beginPath()
  ctx.arc(x, y, 42 + game.calm * 24, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 0.45 + game.calm * 0.25
  ctx.fillStyle = '#fff0b8'
  ctx.beginPath()
  ctx.arc(x, y, 28 + game.calm * 12 + Math.sin(game.time * 4) * 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
  const core = ctx.createRadialGradient(x - 3, y - 4, 1, x, y, 14)
  core.addColorStop(0, '#fff6d4')
  core.addColorStop(0.45, '#df9471')
  core.addColorStop(1, '#9d554f')
  ctx.fillStyle = core
  ctx.beginPath()
  ctx.arc(x, y, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 0.58
  ctx.strokeStyle = 'rgba(255, 247, 214, 0.72)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(x - 8, y - 12)
  ctx.quadraticCurveTo(x, y - 21 - game.calm * 4, x + 8, y - 12)
  ctx.stroke()
  ctx.globalAlpha = 0.24 + game.calm * 0.16
  ctx.fillStyle = '#fff6d3'
  ctx.beginPath()
  ctx.ellipse(x - 4, y - 5, 4, 6, -0.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawHarborRipple(ctx: CanvasRenderingContext2D, ripple: HarborRipple, width: number, height: number) {
  ctx.save()
  ctx.globalAlpha = Math.max(0, ripple.alpha)
  ctx.strokeStyle = ripple.warm ? '#ffd58a' : '#8aa2a7'
  ctx.lineWidth = ripple.warm ? 3 : 2
  ctx.beginPath()
  ctx.arc(ripple.x * width, ripple.y * height, ripple.radius * Math.min(width, height), 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function drawHarborForegroundVeil(ctx: CanvasRenderingContext2D, game: HarborGame, width: number, height: number, warmth: number) {
  ctx.save()
  const bottom = ctx.createLinearGradient(0, height * 0.62, 0, height)
  bottom.addColorStop(0, 'rgba(255, 255, 255, 0)')
  bottom.addColorStop(0.7, `rgba(255, 234, 194, ${0.08 + warmth * 0.1})`)
  bottom.addColorStop(1, `rgba(75, 76, 70, ${0.1 - warmth * 0.05})`)
  ctx.fillStyle = bottom
  ctx.fillRect(0, height * 0.62, width, height * 0.38)

  ctx.globalAlpha = 0.18 + warmth * 0.08
  ctx.strokeStyle = '#fff1c7'
  ctx.lineWidth = 1.2
  for (let i = 0; i < 6; i += 1) {
    const y = height * (0.88 + i * 0.022)
    ctx.beginPath()
    for (let x = -30; x <= width + 30; x += 30) {
      const waveY = y + Math.sin(game.time * 0.45 + x * 0.02 + i) * 3
      if (x === -30) ctx.moveTo(x, waveY)
      else ctx.lineTo(x, waveY)
    }
    ctx.stroke()
  }

  ctx.globalAlpha = 0.12
  ctx.strokeStyle = '#41565d'
  ctx.lineWidth = Math.max(8, width * 0.012)
  ctx.beginPath()
  ctx.moveTo(width * 0.05, height * 0.98)
  ctx.quadraticCurveTo(width * 0.5, height * 0.9, width * 0.95, height * 0.98)
  ctx.stroke()
  ctx.restore()
}

function resizeHarborCanvas(canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect()
  const width = Math.max(1, Math.round(rect.width))
  const height = Math.max(1, Math.round(rect.height))
  const dpr = Math.min(window.devicePixelRatio || 1, 1.35)
  const targetWidth = Math.round(width * dpr)
  const targetHeight = Math.round(height * dpr)
  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth
    canvas.height = targetHeight
  }
  return { width, height, dpr }
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

function smoothStep(value: number) {
  const t = clamp01(value)
  return t * t * (3 - 2 * t)
}

function distance(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(ax - bx, ay - by)
}

function mixColor(from: string, to: string, amount: number) {
  const a = hexToRgb(from)
  const b = hexToRgb(to)
  const t = clamp01(amount)
  return `rgb(${Math.round(a.r + (b.r - a.r) * t)}, ${Math.round(a.g + (b.g - a.g) * t)}, ${Math.round(a.b + (b.b - a.b) * t)})`
}

function hexToRgb(hex: string) {
  const value = hex.replace('#', '')
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  }
}

function RestPathPractice({ restChecks, onToggleRest }: PracticeStageProps) {
  const items = ['眼睛离开屏幕 20 秒', '肩颈慢慢转一圈', '看自然画面或窗外', '手腕和手指放松']
  return (
    <>
      <div className="nature-window" aria-hidden="true">
        <span className="sunline" />
        <span className="hill hill-one" />
        <span className="hill hill-two" />
        <span className="water-line" />
      </div>
      <div className="check-grid">
        {items.map((item) => (
          <button
            type="button"
            key={item}
            className={restChecks.includes(item) ? 'checked' : ''}
            onClick={() => onToggleRest(item)}
          >
            <CheckCircle2 size={18} />
            {item}
          </button>
        ))}
      </div>
    </>
  )
}

function CooldownPractice({ coolingActions, onToggleCooling }: PracticeStageProps) {
  const items = ['做一次慢呼气', '放松肩膀', '把回复延迟 10 分钟', '下巴松开']
  const heat = Math.max(18, 92 - coolingActions.length * 18)
  return (
    <>
      <div className="cooldown-board">
        <div
          className="heat-meter"
          aria-label={`当前热度 ${heat}`}
          style={{ '--heat-level': `${heat}%` } as React.CSSProperties}
        >
          <span />
        </div>
        <div className="cooldown-copy">
          <strong>{heat <= 38 ? '温度已经降下来了' : '先把热度往下调'}</strong>
          <span>慢呼气、松肩颈、延迟回复。这里不做发泄动作。</span>
        </div>
      </div>
      <div className="check-grid">
        {items.map((item) => (
          <button
            type="button"
            key={item}
            className={coolingActions.includes(item) ? 'checked' : ''}
            onClick={() => onToggleCooling(item)}
          >
            <CheckCircle2 size={18} />
            {item}
          </button>
        ))}
      </div>
    </>
  )
}

function BreathingPractice({ breathMode, onBreathMode }: PracticeStageProps) {
  return (
    <>
      <BreathModeSwitch mode={breathMode} onMode={onBreathMode} />
      <div className="breath-space">
        <div className="breath-orb" aria-hidden="true">
          <span />
        </div>
        <div className="breath-copy">
          {breathMode === 'count' ? (
            <>
              <strong>吸 1 2 3 4</strong>
              <span>呼 1 2 3 4 5 6</span>
            </>
          ) : (
            <>
              <strong>只看圆环</strong>
              <span>不用数，不屏息。</span>
            </>
          )}
        </div>
      </div>
    </>
  )
}

interface AfterStageProps {
  intervention: Intervention
  beforeScore: number
  afterScore: number
  note: string
  needsSupport: boolean
  onScore: (score: number) => void
  onNote: (note: string) => void
  onSave: () => void
  onRestart: () => void
}

function AfterStage({
  intervention,
  beforeScore,
  afterScore,
  note,
  needsSupport,
  onScore,
  onNote,
  onSave,
  onRestart,
}: AfterStageProps) {
  const delta = afterScore - beforeScore

  return (
    <div className="stage-content">
      <p className="stage-kicker">结束后</p>
      <h2>{intervention.kind === 'thought-labeling' ? '这一轮结束了' : '现在再打一次分'}</h2>
      {intervention.kind === 'thought-labeling' && (
        <p className="quick-start-copy">不用写总结。只看一下现在比开始时有没有松一点。</p>
      )}
      <ScoreControl score={afterScore} onScore={onScore} />
      <div className="result-strip">
        <span>{intervention.title}</span>
        <strong className={delta >= 0 ? 'delta-good' : 'delta-low'}>
          {delta >= 0 ? '+' : ''}
          {delta}
        </strong>
      </div>
      <label className="note-field">
        <span>{intervention.kind === 'thought-labeling' ? '想留一句就写，不想写直接保存' : '可选记录'}</span>
        <textarea
          value={note}
          onChange={(event) => onNote(event.target.value)}
          rows={4}
          placeholder="例如：贴了 8 次标签后，脑子没停，但没那么追着想法跑。"
        />
      </label>
      {needsSupport && <SafetyNotice />}
      <div className="action-row">
        <button type="button" className="secondary-action" onClick={onRestart}>
          <RotateCcw size={18} />
          再来一轮
        </button>
        <button type="button" className="primary-action" onClick={onSave}>
          <CheckCircle2 size={20} />
          保存并回首页
        </button>
      </div>
    </div>
  )
}

function SafetyNotice() {
  return (
    <div className="safety-notice" role="alert">
      <AlertTriangle size={20} />
      <div>
        <strong>先暂停这个练习</strong>
        <p>
          如果此刻可能伤害自己，请立刻联系身边可信任的人或当地急救电话。在美国可拨打或短信 988，也可以访问{' '}
          <a href="https://988lifeline.org/" target="_blank" rel="noreferrer">
            988lifeline.org
          </a>
          。
        </p>
      </div>
    </div>
  )
}

function ScoreControl({ score, onScore }: { score: number; onScore: (score: number) => void }) {
  return (
    <div className="score-control">
      <div className="score-readout">
        <strong>{score}</strong>
        <span>{scoreLabel(score)}</span>
      </div>
      <input
        type="range"
        min="0"
        max="10"
        value={score}
        onChange={(event) => onScore(Number(event.target.value))}
        aria-label="当前状态评分"
      />
      <div className="score-scale">
        <span>0 很糟</span>
        <span>10 很稳</span>
      </div>
    </div>
  )
}

function BreathModeSwitch({
  mode,
  onMode,
}: {
  mode: BreathMode
  onMode: (mode: BreathMode) => void
}) {
  return (
    <div className="control-block">
      <span className="control-label">关注方式</span>
      <div className="segmented">
        <button
          type="button"
          className={mode === 'count' ? 'active' : ''}
          onClick={() => onMode('count')}
        >
          数节奏
        </button>
        <button
          type="button"
          className={mode === 'visual' ? 'active' : ''}
          onClick={() => onMode('visual')}
        >
          只看圆环
        </button>
      </div>
    </div>
  )
}

export default App
