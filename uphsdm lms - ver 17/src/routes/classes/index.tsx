import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Plus,
  Search,
  BookOpen,
  Users,
  Grid3X3,
  List,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Calendar,
  MapPin,
  Clock,
  GraduationCap,
  IdCard,
  UserCircle2,
  ClipboardList,
  Check,
  Hourglass,
} from 'lucide-react'
import Tooltip from '../../components/Tooltip'
import { useClasses, useStudents, useAssignments, useSubmissions } from '../../lib/store'
import type { Assignment, Class, ExamPeriod, Student, SubmissionStatus } from '../../lib/types'

export const Route = createFileRoute('/classes/')({
  component: Classes,
})

const EMPTY_FORM: Omit<Class, 'id' | 'createdAt'> = {
  name: '',
  code: '',
  section: '',
  classType: '',
  academicYear: '',
  semester: '',
  yearLevel: '',
  faculty: '',
  schedule: '',
  room: '',
}

const CLASS_TYPES = ['LAB', 'LEC', 'GEC'] as const
const ACADEMIC_YEARS = ['2025-2026', '2026-2027', '2027-2028'] as const
const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'] as const
const TERMS = ['1st Semester', '2nd Semester', '3rd Semester', 'Summer'] as const
const ROOMS = ['M-209', 'M-210', 'M-203', 'IoT Lab'] as const
const DAYS = [
  { code: 'M', label: 'Mon' },
  { code: 'T', label: 'Tue' },
  { code: 'W', label: 'Wed' },
  { code: 'Th', label: 'Thu' },
  { code: 'F', label: 'Fri' },
  { code: 'S', label: 'Sat' },
  { code: 'Su', label: 'Sun' },
] as const

function parseSchedule(schedule: string): { days: string[]; startTime: string; endTime: string } {
  const result = { days: [] as string[], startTime: '', endTime: '' }
  if (!schedule) return result
  // Match day tokens (longest first to catch "Th"/"Su")
  const dayPattern = /\b(Su|Th|M|T|W|F|S)\b/g
  const raw = schedule.split(/\d{1,2}:\d{2}/)[0]
  const matches = raw.match(dayPattern)
  if (matches) result.days = Array.from(new Set(matches))
  // Match time range hh:mm [AM|PM] - hh:mm [AM|PM]
  const timeMatch = schedule.match(/(\d{1,2}:\d{2})\s*(AM|PM)?\s*[-–]\s*(\d{1,2}:\d{2})\s*(AM|PM)?/i)
  if (timeMatch) {
    result.startTime = to24h(timeMatch[1], timeMatch[2])
    result.endTime = to24h(timeMatch[3], timeMatch[4])
  }
  return result
}

function to24h(hhmm: string, meridian?: string): string {
  if (!hhmm) return ''
  const [hStr, mStr] = hhmm.split(':')
  let h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  if (meridian) {
    const upper = meridian.toUpperCase()
    if (upper === 'PM' && h < 12) h += 12
    if (upper === 'AM' && h === 12) h = 0
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function to12h(hhmm: string): string {
  if (!hhmm) return ''
  const [hStr, mStr] = hhmm.split(':')
  let h = parseInt(hStr, 10)
  const meridian = h >= 12 ? 'PM' : 'AM'
  if (h === 0) h = 12
  else if (h > 12) h -= 12
  return `${h}:${mStr} ${meridian}`
}

function buildSchedule(days: string[], startTime: string, endTime: string): string {
  const parts: string[] = []
  if (days.length > 0) parts.push(days.join(''))
  if (startTime && endTime) parts.push(`${to12h(startTime)} - ${to12h(endTime)}`)
  else if (startTime) parts.push(to12h(startTime))
  return parts.join(' ').trim()
}

function Classes() {
  const { classes, addClass, updateClass, deleteClass } = useClasses()
  const { students } = useStudents()
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [semesterFilter, setSemesterFilter] = useState<string>('all')
  const [modal, setModal] = useState<null | 'create' | 'edit' | 'delete' | 'students'>(null)
  const [selected, setSelected] = useState<Class | null>(null)
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [scheduleParts, setScheduleParts] = useState({ days: [] as string[], startTime: '', endTime: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const semesterOptions = Array.from(
    new Set(classes.map((c) => c.semester).filter(Boolean)),
  ).sort()

  const filtered = classes.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.section.toLowerCase().includes(search.toLowerCase())
    const matchesSemester = semesterFilter === 'all' || c.semester === semesterFilter
    return matchesSearch && matchesSemester
  })

  function openCreate() {
    setForm(EMPTY_FORM)
    setScheduleParts({ days: [], startTime: '', endTime: '' })
    setErrors({})
    setModal('create')
  }

  function openEdit(cls: Class) {
    setSelected(cls)
    setForm({ name: cls.name, code: cls.code, section: cls.section, classType: cls.classType ?? '', academicYear: cls.academicYear ?? '', semester: cls.semester, yearLevel: cls.yearLevel, faculty: cls.faculty, schedule: cls.schedule, room: cls.room })
    setScheduleParts(parseSchedule(cls.schedule))
    setErrors({})
    setModal('edit')
  }

  function openDelete(cls: Class) {
    setSelected(cls)
    setModal('delete')
  }

  function openStudents(cls: Class) {
    setSelected(cls)
    setViewingStudent(null)
    setModal('students')
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Class name is required.'
    if (!form.code.trim()) e.code = 'Subject code is required.'
    if (!form.section.trim()) e.section = 'Section is required.'
    if (!form.classType) e.classType = 'Class type is required.'
    if (!form.academicYear) e.academicYear = 'Academic year is required.'
    if (!form.yearLevel) e.yearLevel = 'Year level is required.'
    if (!form.semester) e.semester = 'Term is required.'
    if (!form.faculty.trim()) e.faculty = 'Faculty name is required.'
    if (!form.room) e.room = 'Room is required.'
    if (scheduleParts.days.length === 0) e.schedule = 'Please select at least one day.'
    else if (!scheduleParts.startTime || !scheduleParts.endTime) e.schedule = 'Start and end time are required.'
    else if (scheduleParts.startTime === scheduleParts.endTime) e.schedule = 'End time must be after start time.'
    else if (scheduleParts.endTime <= scheduleParts.startTime) e.schedule = 'End time must be after start time.'
    // Prevent duplicates: same name + code + section within the same semester.
    if (form.name.trim() && form.code.trim() && form.section.trim() && form.semester) {
      const editingId = modal === 'edit' && selected ? selected.id : null
      const norm = (v: string) => v.trim().toLowerCase()
      const clash = classes.some(
        (c) =>
          c.id !== editingId &&
          norm(c.name) === norm(form.name) &&
          norm(c.code) === norm(form.code) &&
          norm(c.section) === norm(form.section) &&
          c.semester === form.semester,
      )
      if (clash) {
        e.name = 'A class with the same name, subject code, and section already exists in this semester.'
      }
    }
    return e
  }

  function handleSave() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    const schedule = buildSchedule(scheduleParts.days, scheduleParts.startTime, scheduleParts.endTime)
    const payload = { ...form, schedule }
    if (modal === 'create') {
      addClass(payload)
    } else if (modal === 'edit' && selected) {
      updateClass(selected.id, payload)
    }
    setModal(null)
  }

  function handleDelete() {
    if (selected) deleteClass(selected.id)
    setModal(null)
  }

  const auth = (() => {
    try { return JSON.parse(localStorage.getItem('lms_auth') || '{}') } catch { return {} }
  })()

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your subjects and class sections</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#7b1e3a] text-white text-sm font-medium rounded-lg hover:bg-[#9a2650] transition-colors focus:outline-none focus:ring-2 focus:ring-[#c9a961] focus:ring-offset-1"
        >
          <Plus className="w-4 h-4" />
          New Class
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search classes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a961]"
          />
        </div>
        <div className="relative sm:w-56">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c9a961]"
            aria-label="Filter by semester"
          >
            <option value="all">All Semesters</option>
            {semesterOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1 bg-[#faf3e0] rounded-lg p-1">
          <button
            onClick={() => setView('grid')}
            className={`p-1.5 rounded ${view === 'grid' ? 'bg-white shadow text-[#7b1e3a]' : 'text-gray-500 hover:text-gray-700'}`}
            title="Grid view"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-1.5 rounded ${view === 'list' ? 'bg-white shadow text-[#7b1e3a]' : 'text-gray-500 hover:text-gray-700'}`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid View */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cls) => {
            const studentCount = students.filter((s) => s.classId === cls.id).length
            return (
              <div key={cls.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-[#7b1e3a] px-4 py-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="text-[#d4af37] text-xs font-medium uppercase tracking-wider">{cls.code}</div>
                    {cls.classType && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#d4af37] text-[#5e1724]">
                        {cls.classType}
                      </span>
                    )}
                  </div>
                  <div className="text-[#faf3e0] font-semibold text-sm leading-snug">{cls.name}</div>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Users className="w-3.5 h-3.5" />
                    <span>{cls.section}</span>
                    <span className="text-gray-400" aria-hidden="true">·</span>
                    <span>{studentCount} students</span>
                  </div>
                  {cls.schedule && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      {cls.schedule}
                    </div>
                  )}
                  {cls.room && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="w-3.5 h-3.5" />
                      {cls.room}
                    </div>
                  )}
                  {cls.semester && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5" />
                      {cls.semester}
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <Link
                      to={`/classes/${cls.id}` as any}
                      className="flex-1 text-center text-xs py-1.5 bg-[#faf3e0] text-[#7b1e3a] rounded-md hover:bg-[#ebe0c4] transition-colors font-medium"
                    >
                      View Grades
                    </Link>
                    <button
                      onClick={() => openStudents(cls)}
                      className="flex-1 text-center text-xs py-1.5 bg-[#7b1e3a] text-[#faf3e0] rounded-md hover:bg-[#9a2650] transition-colors font-medium"
                    >
                      View Students
                    </button>
                    <button
                      onClick={() => openEdit(cls)}
                      className="p-1.5 text-gray-400 hover:text-[#7b1e3a] hover:bg-[#faf3e0] rounded-md transition-colors"
                      title="Edit class"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openDelete(cls)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete class"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-500">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No classes found. <button onClick={openCreate} className="text-[#7b1e3a] hover:underline">Create a class</button></p>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#faf3e0]">
                <tr>
                  {['Class Name', 'Code', 'Section', 'Type', 'Faculty', 'Students', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#7b1e3a] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((cls) => {
                  const sc = students.filter((s) => s.classId === cls.id).length
                  return (
                    <tr key={cls.id} className="hover:bg-[#fdf9ee] transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{cls.name}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{cls.code}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{cls.section}</td>
                      <td className="px-4 py-3 text-xs">
                        {cls.classType ? (
                          <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#faf3e0] text-[#7b1e3a] border border-[#e8d9b0]">
                            {cls.classType}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{cls.faculty}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{sc}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link to={`/classes/${cls.id}` as any} className="text-xs text-[#7b1e3a] hover:underline font-medium">
                            Grades
                          </Link>
                          <button onClick={() => openStudents(cls)} className="text-xs text-[#7b1e3a] hover:underline font-medium">
                            Students
                          </button>
                          <button onClick={() => openEdit(cls)} className="text-gray-400 hover:text-[#7b1e3a] p-1 rounded" title="Edit">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => openDelete(cls)} className="text-gray-400 hover:text-red-600 p-1 rounded" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                      No classes found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{modal === 'create' ? 'New Class' : 'Edit Class'}</h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <FormField label="Class Name" tooltip="Full descriptive name of the subject" error={errors.name} required>
                <input className={inputCls(errors.name)} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Human Computer Interaction 1" />
              </FormField>
              <FormField label="Subject Code" tooltip="Official subject/course code from the registrar" error={errors.code} required>
                <input className={inputCls(errors.code)} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g., BSCS 2207" />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Section" error={errors.section} required>
                  <input className={inputCls(errors.section)} value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} placeholder="e.g., 9408-AY225" />
                </FormField>
                <FormField label="Class Type" tooltip="LAB (laboratory), LEC (lecture), or GEC (general education course)" error={errors.classType} required>
                  <select className={inputCls(errors.classType)} value={form.classType} onChange={(e) => setForm({ ...form, classType: e.target.value as Class['classType'] })}>
                    <option value="">Select class type</option>
                    {CLASS_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </FormField>
              </div>
              <FormField label="Academic Year" tooltip="School year this class belongs to" error={errors.academicYear} required>
                <select className={inputCls(errors.academicYear)} value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value as Class['academicYear'] })}>
                  <option value="">Select academic year</option>
                  {ACADEMIC_YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Year Level" error={errors.yearLevel} required>
                  <select className={inputCls(errors.yearLevel)} value={form.yearLevel} onChange={(e) => setForm({ ...form, yearLevel: e.target.value })}>
                    <option value="">Select year level</option>
                    {YEAR_LEVELS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Term" error={errors.semester} required>
                  <select className={inputCls(errors.semester)} value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
                    <option value="">Select term</option>
                    {TERMS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </FormField>
              </div>
              <FormField label="Faculty Assigned" error={errors.faculty} tooltip="Name of the professor/instructor handling this class" required>
                <input className={inputCls(errors.faculty)} value={form.faculty} onChange={(e) => setForm({ ...form, faculty: e.target.value })} placeholder="e.g., HOMER T. FAVENIR" />
              </FormField>
              <FormField label="Schedule" tooltip="Pick the meeting days and the start/end times" error={errors.schedule} required>
                <div className={`space-y-2 p-3 border rounded-lg bg-gray-50 ${errors.schedule ? 'border-red-400' : 'border-gray-200'}`}>
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-1.5">Days</div>
                    <div className="flex flex-wrap gap-1.5">
                      {DAYS.map((d) => {
                        const active = scheduleParts.days.includes(d.code)
                        return (
                          <button
                            type="button"
                            key={d.code}
                            onClick={() => {
                              setScheduleParts((prev) => ({
                                ...prev,
                                days: active ? prev.days.filter((x) => x !== d.code) : [...prev.days, d.code],
                              }))
                            }}
                            className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                              active
                                ? 'bg-[#7b1e3a] text-white border-[#7b1e3a]'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-[#c9a961]'
                            }`}
                          >
                            {d.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <div className="text-xs font-medium text-gray-600 mb-1">Start time</div>
                      <input
                        type="time"
                        className={inputCls()}
                        value={scheduleParts.startTime}
                        onChange={(e) => setScheduleParts({ ...scheduleParts, startTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-600 mb-1">End time</div>
                      <input
                        type="time"
                        className={inputCls()}
                        value={scheduleParts.endTime}
                        onChange={(e) => setScheduleParts({ ...scheduleParts, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 pt-1">
                    Preview: <span className="font-medium text-gray-700">{buildSchedule(scheduleParts.days, scheduleParts.startTime, scheduleParts.endTime) || '—'}</span>
                  </div>
                </div>
              </FormField>
              <FormField label="Room" error={errors.room} required>
                <select className={inputCls(errors.room)} value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })}>
                  <option value="">Select room</option>
                  {ROOMS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </FormField>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-[#7b1e3a] text-white rounded-lg hover:bg-[#9a2650] transition-colors font-medium">
                {modal === 'create' ? 'Create Class' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Students List Modal */}
      {modal === 'students' && selected && (
        <StudentsModal
          cls={selected}
          students={students.filter((s) => s.classId === selected.id)}
          viewingStudent={viewingStudent}
          onSelectStudent={setViewingStudent}
          onClose={() => { setModal(null); setViewingStudent(null) }}
        />
      )}

      {/* Delete Confirm */}
      {modal === 'delete' && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" role="dialog">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold text-gray-900">Delete Class</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Are you sure you want to delete <strong>{selected.name}</strong>? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function inputCls(error?: string) {
  return `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
    error ? 'border-red-400 focus:ring-red-300 bg-red-50' : 'border-gray-300 focus:ring-[#c9a961]'
  }`
}

function FormField({
  label, children, error, required, tooltip,
}: {
  label: string; children: React.ReactNode; error?: string; required?: boolean; tooltip?: string
}) {
  return (
    <div>
      <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500">*</span>}
        {tooltip && <Tooltip text={tooltip} position="right" />}
      </label>
      {children}
      {error && (
        <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
          <AlertCircle className="w-3 h-3" /> {error}
        </div>
      )}
    </div>
  )
}

function StudentsModal({
  cls, students, viewingStudent, onSelectStudent, onClose,
}: {
  cls: Class
  students: Student[]
  viewingStudent: Student | null
  onSelectStudent: (s: Student | null) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#7b1e3a] to-[#9a2650] text-white">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <h2 className="font-semibold text-sm">Students</h2>
            </div>
            <div className="text-[11px] text-white/80 mt-0.5">{cls.code} · {cls.section}{cls.semester ? ` · ${cls.semester}` : ''}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-white/10" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {students.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No students assigned to this class.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {students.map((s, idx) => (
                <li key={s.id}>
                  <button
                    onClick={() => onSelectStudent(s)}
                    className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-[#fdf9ee] transition-colors"
                  >
                    <span className="w-7 h-7 rounded-full bg-[#faf3e0] text-[#7b1e3a] text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {s.firstName} {s.mi ? `${s.mi}. ` : ''}{s.lastName}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {viewingStudent && (
        <StudentDetailCard
          student={viewingStudent}
          cls={cls}
          onClose={() => onSelectStudent(null)}
        />
      )}
    </div>
  )
}

function StudentDetailCard({
  student, cls, onClose,
}: {
  student: Student
  cls: Class
  onClose: () => void
}) {
  const { assignments } = useAssignments(cls.id)
  const { getStatus, setStatus } = useSubmissions()
  const [periodFilter, setPeriodFilter] = useState<ExamPeriod | ''>('')
  const fullName = `${student.firstName}${student.mi ? ` ${student.mi}.` : ''} ${student.lastName}`
  const inScope = (a: Assignment) => a.term === cls.semester && a.status === 'Active'
  const matchesPeriod = (a: Assignment) => (periodFilter ? a.period === periodFilter : true)
  const activities = assignments.filter((a) => a.type !== 'Exam' && inScope(a) && matchesPeriod(a))
  const exams = assignments.filter((a) => a.type === 'Exam' && inScope(a) && matchesPeriod(a))
  const PERIODS: ExamPeriod[] = ['Prelim', 'Midterm', 'Finals']

  const typeColor: Record<string, string> = {
    Assignment: 'bg-[#7b1e3a] text-[#faf3e0]',
    Quiz: 'bg-[#d4af37] text-[#4a0b13]',
    Project: 'bg-[#faf3e0] text-[#7b1e3a] border border-[#d4af37]/50',
    Research: 'bg-[#7b1e3a]/10 text-[#7b1e3a] border border-[#7b1e3a]/20',
    Recitation: 'bg-amber-100 text-amber-800 border border-[#d4af37]/40',
  }

  const statusColor: Record<string, string> = {
    Active: 'bg-emerald-100 text-emerald-700',
    Draft: 'bg-[#faf3e0] text-[#7b1e3a] border border-[#d4af37]/40',
    Closed: 'bg-[#7b1e3a]/10 text-[#7b1e3a] border border-[#7b1e3a]/20',
  }

  function renderTaskList(items: typeof assignments, emptyLabel: string, showTypeBadge = true) {
    if (items.length === 0) {
      return (
        <div className="bg-[#faf3e0]/60 border border-dashed border-[#c9a961] rounded-lg py-6 text-center">
          <ClipboardList className="w-6 h-6 mx-auto mb-2 text-[#c9a961]" />
          <div className="text-xs text-[#7b1e3a]/70">{emptyLabel}</div>
        </div>
      )
    }
    return (
      <ul className="space-y-2">
        {items.map((a) => {
          const current = getStatus(student.id, a.id)
          const toggle = (next: SubmissionStatus) => {
            setStatus(student.id, a.id, current === next ? null : next)
          }
          return (
            <li key={a.id} className="bg-white border border-[#e8d9b0] rounded-lg p-2.5 hover:border-[#c9a961] transition-colors">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    {showTypeBadge && (
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${typeColor[a.type] || 'bg-[#faf3e0] text-[#7b1e3a]'}`}>{a.type}</span>
                    )}
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${statusColor[a.status] || ''}`}>{a.status}</span>
                  </div>
                  <div className="text-xs font-semibold text-[#5e1724]">{a.title}</div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                    {a.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        {a.dueDate}{a.dueTime ? ` ${a.dueTime}` : ''}
                      </span>
                    )}
                    <span>Max: <span className="font-semibold text-[#7b1e3a]">{a.maxScore}</span></span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <SubmissionIconButton
                    label="Done"
                    active={current === 'done'}
                    activeClass="bg-emerald-500 text-white border-emerald-500"
                    idleClass="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                    onClick={() => toggle('done')}
                    icon={<Check className="w-3.5 h-3.5" strokeWidth={3} />}
                  />
                  <SubmissionIconButton
                    label="Did Not Submit"
                    active={current === 'missed'}
                    activeClass="bg-red-500 text-white border-red-500"
                    idleClass="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => toggle('missed')}
                    icon={<X className="w-3.5 h-3.5" strokeWidth={3} />}
                  />
                  <SubmissionIconButton
                    label="Pending"
                    active={current === 'pending'}
                    activeClass="bg-amber-500 text-white border-amber-500"
                    idleClass="text-amber-600 border-amber-200 hover:bg-amber-50"
                    onClick={() => toggle('pending')}
                    icon={<Hourglass className="w-3.5 h-3.5" />}
                  />
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#3d0f18]/70 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden border-2 border-[#c9a961] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-[#7b1e3a] to-[#5e1724] px-6 py-5 text-white relative">
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded hover:bg-white/10" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#faf3e0] border-2 border-[#d4af37] flex items-center justify-center flex-shrink-0">
              <UserCircle2 className="w-9 h-9 text-[#7b1e3a]" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-[#d4af37] font-semibold">Student Profile</div>
              <div className="text-base font-bold leading-tight truncate">{fullName}</div>
              <div className="text-[11px] text-white/70 mt-0.5">{cls.code} · {cls.semester || '—'}</div>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          <InfoRow icon={<UserCircle2 className="w-3.5 h-3.5" />} label="Full Name" value={fullName} />
          <InfoRow icon={<IdCard className="w-3.5 h-3.5" />} label="Student No." value={student.studentNo || '—'} />
          <InfoRow icon={<GraduationCap className="w-3.5 h-3.5" />} label="Year Level" value={student.yearLevel || '—'} />
          <InfoRow icon={<BookOpen className="w-3.5 h-3.5" />} label="College Program" value={student.collegeProgram || '—'} />

          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-bold text-[#7b1e3a] uppercase tracking-wider">Tasks</div>
              <div className="text-[10px] text-[#7b1e3a]/70 font-medium">
                {activities.length} {activities.length === 1 ? 'activity' : 'activities'} · {exams.length} {exams.length === 1 ? 'exam' : 'exams'}
              </div>
            </div>

            {/* Period filter menu */}
            <div className="flex items-center gap-1 mb-3 bg-[#faf3e0] border border-[#d4af37]/40 rounded-md p-0.5">
              {(['All', ...PERIODS] as const).map((p) => {
                const active = (p === 'All' && periodFilter === '') || p === periodFilter
                return (
                  <button
                    key={p}
                    onClick={() => setPeriodFilter(p === 'All' ? '' : (p as ExamPeriod))}
                    className={`flex-1 px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors ${active ? 'bg-[#7b1e3a] text-[#faf3e0] shadow' : 'text-[#7b1e3a] hover:bg-white'}`}
                    aria-pressed={active}
                  >
                    {p}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-semibold text-[#7b1e3a]/80 uppercase tracking-wider">Activities</div>
              <div className="text-[10px] text-[#7b1e3a]/60">{activities.length}</div>
            </div>
            {renderTaskList(activities, 'No activities yet for this class.')}

            <div className="flex items-center justify-between mt-4 mb-2">
              <div className="text-[10px] font-semibold text-[#7b1e3a]/80 uppercase tracking-wider">Exams</div>
              <div className="text-[10px] text-[#7b1e3a]/60">{exams.length}</div>
            </div>
            {renderTaskList(exams, 'No exams yet for this class.', false)}
          </div>
        </div>

        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white text-gray-600 font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-[#7b1e3a] mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{label}</div>
        <div className="text-sm text-gray-900 font-medium break-words">{value}</div>
      </div>
    </div>
  )
}

function SubmissionIconButton({
  label,
  icon,
  active,
  activeClass,
  idleClass,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  active: boolean
  activeClass: string
  idleClass: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full border transition-colors ${active ? activeClass : `bg-white ${idleClass}`}`}
    >
      {icon}
    </button>
  )
}
