import { useState, useRef, useMemo } from 'react'
import { Plus, Trash2, Check, Search, CalendarDays } from 'lucide-react'

const PRIORITIES = {
  low:    { label: 'ต่ำ',  badge: 'bg-green-100 text-green-700', ring: 'ring-green-400' },
  medium: { label: 'กลาง', badge: 'bg-amber-100 text-amber-700', ring: 'ring-amber-400' },
  high:   { label: 'สูง',  badge: 'bg-red-100 text-red-700',     ring: 'ring-red-400' },
}
const PRIORITY_ORDER = ['low', 'medium', 'high']

const CATEGORIES = {
  work:     { label: 'งาน',      badge: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  personal: { label: 'ส่วนตัว',  badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  shopping: { label: 'ช้อปปิ้ง', badge: 'bg-pink-100 text-pink-700',     dot: 'bg-pink-500' },
  health:   { label: 'สุขภาพ',   badge: 'bg-teal-100 text-teal-700',     dot: 'bg-teal-500' },
}
const CATEGORY_KEYS = Object.keys(CATEGORIES)

const FILTERS = [
  ['all', 'ทั้งหมด'],
  ['active', 'ยังไม่เสร็จ'],
  ['completed', 'เสร็จแล้ว'],
]

// ---------- date helpers (local time, YYYY-MM-DD) ----------
const toISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const todayISO = () => toISO(new Date())
const addDays = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return toISO(d)
}
const formatDate = (iso) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })

function dueState(todo, today) {
  if (!todo.dueDate) return null
  if (todo.done) return 'done'
  if (todo.dueDate < today) return 'overdue'
  if (todo.dueDate === today) return 'today'
  return 'upcoming'
}
const DUE_STYLE = {
  overdue:  { cls: 'bg-red-100 text-red-700',       text: (d) => `เลยกำหนด · ${formatDate(d)}` },
  today:    { cls: 'bg-yellow-100 text-yellow-800', text: () => 'วันนี้' },
  upcoming: { cls: 'bg-gray-100 text-gray-600',     text: (d) => formatDate(d) },
  done:     { cls: 'bg-gray-100 text-gray-400',     text: (d) => formatDate(d) },
}

// ---------- donut chart ----------
function Donut({ segments, total }) {
  const r = 40
  const C = 2 * Math.PI * r
  let offset = 0
  return (
    <svg viewBox="0 0 100 100" className="w-24 h-24 shrink-0 -rotate-90" role="img" aria-label="สัดส่วนสถานะงาน">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#e5e7eb" strokeWidth="14" />
      {total > 0 &&
        segments.map((s) => {
          if (s.value === 0) return null
          const len = (s.value / total) * C
          const el = (
            <circle
              key={s.key}
              cx="50" cy="50" r={r} fill="none"
              stroke={s.color} strokeWidth="14"
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-offset}
            />
          )
          offset += len
          return el
        })}
    </svg>
  )
}

// ---------- todo item ----------
function TodoItem({ todo, today, removing, editing, editText, setEditText, onToggle, onRemove, onCycle, onStartEdit, onSaveEdit, onCancelEdit }) {
  const due = dueState(todo, today)
  const cat = CATEGORIES[todo.category]
  return (
    <div className={`row mb-2 ${removing ? 'removing' : ''}`}>
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-start gap-3 px-4 py-3">
        <button
          onClick={onToggle}
          aria-label="เสร็จแล้ว"
          className={`mt-0.5 shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition ${
            todo.done ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 hover:border-indigo-400 text-transparent'
          }`}
        >
          <Check size={14} />
        </button>

        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              autoFocus
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={onSaveEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveEdit()
                if (e.key === 'Escape') onCancelEdit()
              }}
              className="w-full border-b-2 border-indigo-400 outline-none py-0.5 bg-white"
            />
          ) : (
            <div
              onDoubleClick={onStartEdit}
              title="ดับเบิลคลิกเพื่อแก้ไข"
              className={`break-words cursor-text select-none ${todo.done ? 'line-through text-gray-400' : ''}`}
            >
              {todo.text}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <button
              onClick={onCycle}
              title="เปลี่ยนความสำคัญ"
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${PRIORITIES[todo.priority].badge}`}
            >
              {PRIORITIES[todo.priority].label}
            </button>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${cat.badge}`}>{cat.label}</span>
            {due && (
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${DUE_STYLE[due].cls}`}>
                <CalendarDays size={12} />
                {DUE_STYLE[due].text(todo.dueDate)}
              </span>
            )}
          </div>
        </div>

        <button onClick={onRemove} aria-label="ลบ" className="shrink-0 text-gray-400 hover:text-red-500 p-1 transition-colors">
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  )
}

// ---------- app ----------
export default function App() {
  const today = todayISO()
  const nextId = useRef(6)
  const [todos, setTodos] = useState([
    { id: 1, text: 'ซื้อของเข้าบ้าน',        done: false, priority: 'medium', category: 'shopping', dueDate: addDays(0) },
    { id: 2, text: 'ส่งรายงานให้หัวหน้า',    done: false, priority: 'high',   category: 'work',     dueDate: addDays(-1) },
    { id: 3, text: 'ออกกำลังกายตอนเย็น',     done: true,  priority: 'low',    category: 'health',   dueDate: addDays(0) },
    { id: 4, text: 'โทรหาคุณแม่',            done: false, priority: 'low',    category: 'personal', dueDate: addDays(3) },
    { id: 5, text: 'นัดตรวจสุขภาพประจำปี',   done: false, priority: 'medium', category: 'health',   dueDate: '' },
  ])
  const [text, setText] = useState('')
  const [priority, setPriority] = useState('medium')
  const [category, setCategory] = useState('personal')
  const [dueDate, setDueDate] = useState('')
  const [filter, setFilter] = useState('all')
  const [catFilter, setCatFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [editId, setEditId] = useState(null)
  const [editText, setEditText] = useState('')
  const [removing, setRemoving] = useState([])

  const add = () => {
    const t = text.trim()
    if (!t) return
    setTodos((p) => [{ id: nextId.current++, text: t, done: false, priority, category, dueDate }, ...p])
    setText('')
    setDueDate('')
  }
  const toggle = (id) => setTodos((p) => p.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  const remove = (id) => {
    setRemoving((r) => [...r, id])
    setTimeout(() => {
      setTodos((p) => p.filter((t) => t.id !== id))
      setRemoving((r) => r.filter((x) => x !== id))
    }, 250)
  }
  const cycle = (id) =>
    setTodos((p) =>
      p.map((t) => (t.id === id ? { ...t, priority: PRIORITY_ORDER[(PRIORITY_ORDER.indexOf(t.priority) + 1) % 3] } : t))
    )
  const startEdit = (t) => { setEditId(t.id); setEditText(t.text) }
  const saveEdit = () => {
    const v = editText.trim()
    if (v) setTodos((p) => p.map((t) => (t.id === editId ? { ...t, text: v } : t)))
    setEditId(null)
  }
  const clearDone = () => {
    const ids = todos.filter((t) => t.done).map((t) => t.id)
    setRemoving((r) => [...r, ...ids])
    setTimeout(() => {
      setTodos((p) => p.filter((t) => !t.done))
      setRemoving([])
    }, 250)
  }

  // derived data
  const remaining = todos.filter((t) => !t.done).length
  const doneCount = todos.length - remaining
  const overdueCount = todos.filter((t) => dueState(t, today) === 'overdue').length
  const pct = todos.length ? Math.round((doneCount / todos.length) * 100) : 0
  const segments = [
    { key: 'done',    label: 'เสร็จแล้ว', value: doneCount,                    color: '#22c55e' },
    { key: 'active',  label: 'ค้างอยู่',   value: remaining - overdueCount,     color: '#6366f1' },
    { key: 'overdue', label: 'เลยกำหนด',  value: overdueCount,                 color: '#ef4444' },
  ]
  const catCounts = useMemo(() => {
    const c = {}
    CATEGORY_KEYS.forEach((k) => (c[k] = todos.filter((t) => t.category === k).length))
    return c
  }, [todos])

  const q = query.trim().toLowerCase()
  const shown = todos.filter(
    (t) =>
      (filter === 'all' || (filter === 'active' ? !t.done : t.done)) &&
      (catFilter === 'all' || t.category === catFilter) &&
      (!q || t.text.toLowerCase().includes(q))
  )

  const catBtn = (key, label, count, dot) => (
    <button
      key={key}
      onClick={() => setCatFilter(key)}
      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
        catFilter === key ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <span className="flex items-center gap-2">
        {dot && <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />}
        {label}
      </span>
      <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{count}</span>
    </button>
  )

  return (
    <div className="min-h-screen px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">สิ่งที่ต้องทำ</h1>
        <p className="text-gray-500 text-sm mb-5">จัดการงานของคุณอย่างเป็นระบบ</p>

        {/* Statistics */}
        <div className="bg-white rounded-2xl shadow-md p-4 mb-4 flex flex-wrap items-center gap-x-8 gap-y-4">
          <div className="relative">
            <Donut segments={segments} total={todos.length} />
            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">{pct}%</div>
          </div>
          <div className="flex gap-6">
            <div>
              <div className="text-2xl font-bold">{todos.length}</div>
              <div className="text-xs text-gray-500">งานทั้งหมด</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{pct}%</div>
              <div className="text-xs text-gray-500">เสร็จแล้ว</div>
            </div>
          </div>
          <ul className="text-sm space-y-1">
            {segments.map((s) => (
              <li key={s.key} className="flex items-center gap-2 text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                {s.label} <span className="font-semibold text-gray-800">{s.value}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-4 md:grid-cols-[210px_1fr]">
          {/* Category sidebar */}
          <aside className="bg-white rounded-2xl shadow-md p-3 h-fit">
            <div className="text-xs font-semibold text-gray-400 px-3 pb-2">หมวดหมู่</div>
            <div className="flex md:flex-col gap-1 overflow-x-auto">
              {catBtn('all', 'ทั้งหมด', todos.length)}
              {CATEGORY_KEYS.map((k) => catBtn(k, CATEGORIES[k].label, catCounts[k], CATEGORIES[k].dot))}
            </div>
          </aside>

          <main className="min-w-0">
            {/* Add card */}
            <div className="bg-white rounded-2xl shadow-md p-4 mb-4">
              <div className="flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && add()}
                  placeholder="เพิ่มงานใหม่..."
                  className="flex-1 min-w-0 rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                />
                <button
                  onClick={add}
                  aria-label="เพิ่ม"
                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 font-medium transition-colors"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">เพิ่ม</span>
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">ความสำคัญ:</span>
                  {PRIORITY_ORDER.map((k) => (
                    <button
                      key={k}
                      onClick={() => setPriority(k)}
                      className={`px-3 py-1 rounded-full font-medium transition ${PRIORITIES[k].badge} ${
                        priority === k ? `ring-2 ring-offset-1 ${PRIORITIES[k].ring}` : 'opacity-60'
                      }`}
                    >
                      {PRIORITIES[k].label}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2">
                  <span className="text-gray-500">หมวด:</span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="rounded-lg border border-gray-200 px-2 py-1 bg-white outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    {CATEGORY_KEYS.map((k) => (
                      <option key={k} value={k}>{CATEGORIES[k].label}</option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <span className="text-gray-500">กำหนดส่ง:</span>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="rounded-lg border border-gray-200 px-2 py-1 bg-white outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </label>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหางาน..."
                className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              />
            </div>

            {/* Status tabs */}
            <div className="flex gap-1 bg-gray-200/70 rounded-xl p-1 mb-4">
              {FILTERS.map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`flex-1 py-2 text-sm rounded-lg font-medium transition ${
                    filter === k ? 'bg-white shadow text-indigo-700' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* List */}
            <div>
              {shown.length === 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-400">ไม่มีรายการ</div>
              )}
              {shown.map((t) => (
                <TodoItem
                  key={t.id}
                  todo={t}
                  today={today}
                  removing={removing.includes(t.id)}
                  editing={editId === t.id}
                  editText={editText}
                  setEditText={setEditText}
                  onToggle={() => toggle(t.id)}
                  onRemove={() => remove(t.id)}
                  onCycle={() => cycle(t.id)}
                  onStartEdit={() => startEdit(t)}
                  onSaveEdit={saveEdit}
                  onCancelEdit={() => setEditId(null)}
                />
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <span>เหลืออีก {remaining} งาน</span>
              <button
                onClick={clearDone}
                disabled={doneCount === 0}
                className={`font-medium transition ${
                  doneCount === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:text-red-600'
                }`}
              >
                ล้างงานที่เสร็จแล้ว{doneCount ? ` (${doneCount})` : ''}
              </button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-6">
              ดับเบิลคลิกที่ข้อความเพื่อแก้ไข · กดป้ายความสำคัญเพื่อเปลี่ยนระดับ
            </p>
          </main>
        </div>
      </div>
    </div>
  )
}
