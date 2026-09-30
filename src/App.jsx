import { useState, useRef } from 'react'
import { Plus, Trash2, Check } from 'lucide-react'

const PRIORITIES = {
  low:    { label: 'ต่ำ',  badge: 'bg-green-100 text-green-700', ring: 'ring-green-400' },
  medium: { label: 'กลาง', badge: 'bg-amber-100 text-amber-700', ring: 'ring-amber-400' },
  high:   { label: 'สูง',  badge: 'bg-red-100 text-red-700',     ring: 'ring-red-400' },
}
const ORDER = ['low', 'medium', 'high']
const FILTERS = [
  ['all', 'ทั้งหมด'],
  ['active', 'ยังไม่เสร็จ'],
  ['completed', 'เสร็จแล้ว'],
]

function TodoItem({ todo, removing, editing, editText, setEditText, onToggle, onRemove, onCycle, onStartEdit, onSaveEdit, onCancelEdit }) {
  return (
    <div className={`row mb-2 ${removing ? 'removing' : ''}`}>
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-center gap-3 px-4 py-3">
        <button
          onClick={onToggle}
          aria-label="เสร็จแล้ว"
          className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition ${
            todo.done
              ? 'bg-indigo-600 border-indigo-600 text-white'
              : 'border-gray-300 hover:border-indigo-400 text-transparent'
          }`}
        >
          <Check size={14} />
        </button>

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
            className="flex-1 min-w-0 border-b-2 border-indigo-400 outline-none py-0.5 bg-white"
          />
        ) : (
          <span
            onDoubleClick={onStartEdit}
            title="ดับเบิลคลิกเพื่อแก้ไข"
            className={`flex-1 min-w-0 break-words cursor-text select-none ${
              todo.done ? 'line-through text-gray-400' : ''
            }`}
          >
            {todo.text}
          </span>
        )}

        <button
          onClick={onCycle}
          title="เปลี่ยนความสำคัญ"
          className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold ${PRIORITIES[todo.priority].badge}`}
        >
          {PRIORITIES[todo.priority].label}
        </button>

        <button
          onClick={onRemove}
          aria-label="ลบ"
          className="shrink-0 text-gray-400 hover:text-red-500 p-1 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const nextId = useRef(4)
  const [todos, setTodos] = useState([
    { id: 1, text: 'ซื้อของเข้าบ้าน', done: false, priority: 'medium' },
    { id: 2, text: 'ส่งรายงานให้หัวหน้า', done: false, priority: 'high' },
    { id: 3, text: 'ออกกำลังกายตอนเย็น', done: true, priority: 'low' },
  ])
  const [text, setText] = useState('')
  const [priority, setPriority] = useState('medium')
  const [filter, setFilter] = useState('all')
  const [editId, setEditId] = useState(null)
  const [editText, setEditText] = useState('')
  const [removing, setRemoving] = useState([])

  const add = () => {
    const t = text.trim()
    if (!t) return
    setTodos((p) => [{ id: nextId.current++, text: t, done: false, priority }, ...p])
    setText('')
  }

  const toggle = (id) =>
    setTodos((p) => p.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  const remove = (id) => {
    setRemoving((r) => [...r, id])
    setTimeout(() => {
      setTodos((p) => p.filter((t) => t.id !== id))
      setRemoving((r) => r.filter((x) => x !== id))
    }, 250)
  }

  const cycle = (id) =>
    setTodos((p) =>
      p.map((t) =>
        t.id === id ? { ...t, priority: ORDER[(ORDER.indexOf(t.priority) + 1) % 3] } : t
      )
    )

  const startEdit = (t) => {
    setEditId(t.id)
    setEditText(t.text)
  }

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

  const remaining = todos.filter((t) => !t.done).length
  const doneCount = todos.length - remaining
  const shown = todos.filter(
    (t) => filter === 'all' || (filter === 'active' ? !t.done : t.done)
  )

  return (
    <div className="min-h-screen px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">สิ่งที่ต้องทำ</h1>
        <p className="text-gray-500 text-sm mb-5">จัดการงานของคุณอย่างเป็นระบบ</p>

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
          <div className="flex items-center gap-2 mt-3 text-sm">
            <span className="text-gray-500">ความสำคัญ:</span>
            {ORDER.map((k) => (
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
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-gray-200/70 rounded-xl p-1 mb-4">
          {FILTERS.map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`flex-1 py-2 text-sm rounded-lg font-medium transition ${
                filter === k
                  ? 'bg-white shadow text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* List */}
        <div>
          {shown.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-400">
              ไม่มีรายการ
            </div>
          )}
          {shown.map((t) => (
            <TodoItem
              key={t.id}
              todo={t}
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
              doneCount === 0
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-red-500 hover:text-red-600'
            }`}
          >
            ล้างงานที่เสร็จแล้ว{doneCount ? ` (${doneCount})` : ''}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          ดับเบิลคลิกที่ข้อความเพื่อแก้ไข · กดป้ายความสำคัญเพื่อเปลี่ยนระดับ
        </p>
      </div>
    </div>
  )
}
