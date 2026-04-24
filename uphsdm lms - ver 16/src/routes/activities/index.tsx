import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Plus, Search, Trash2, Pencil, X, AlertCircle,
  ClipboardList, Grid3X3, List, Calendar, Tag,
} from 'lucide-react'
import { useAssignments, useClasses } from '../../lib/store'
import type { Assignment, Term, ExamPeriod, AcademicYear } from '../../lib/types'
import Tooltip from '../../components/Tooltip'

export const Route = createFileRoute('/activities/')({
  component: AssignmentsPage,
})

const TYPES = ['Assignment', 'Quiz', 'Project', 'Research', 'Recitation'] as const
const STATUSES = ['Draft', 'Active', 'Closed'] as const
const TERMS: Term[] = ['1st Semester', '2nd Semester', '3rd Semester', 'Summer']
const PERIODS: ExamPeriod[] = ['Prelim', 'Midterm', 'Finals']
const ACADEMIC_YEARS: AcademicYear[] = ['2025-2026', '2026-2027', '2027-2028']

const EMPTY: Omit<Assignment, 'id' | 'createdAt'> = {
  classId: '',
  title: '',
  type: 'Assignment',
  description: '',
  dueDate: '',
  dueTime: '',
  term: undefined,
  period: undefined,
  academicYear: undefined,
  maxScore: 100,
  status: 'Draft',
}

function AssignmentsPage() {
  const { classes } = useClasses()
  const { assignments, addAssignment, updateAssignment, deleteAssignment } = useAssignments()
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState<ExamPeriod | ''>('')
  const [modal, setModal] = useState<null | 'create' | 'edit' | 'delete'>(null)
  const [selected, setSelected] = useState<Assignment | null>(null)
  const [form, setForm] = useState<Omit<Assignment, 'id' | 'createdAt'>>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const filtered = assignments.filter((a) => {
    if (a.type === 'Exam') return false
    const q = search.toLowerCase()
    const matchQ = a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
    const matchT = typeFilter ? a.type === typeFilter : true
    return matchQ && matchT
    
  })

  function openCreate() {
    setForm({ ...EMPTY, classId: classes[0]?.id ?? '' })
    setErrors({})
    setModal('create')
  }

  function openEdit(a: Assignment) {
    setSelected(a)
    setForm({
      classId: a.classId,
      title: a.title,
      type: a.type,
      description: a.description,
      dueDate: a.dueDate,
      dueTime: a.dueTime ?? '',
      term: a.term,
      period: a.period,
      academicYear: a.academicYear,
      maxScore: a.maxScore,
      status: a.status,
    })
    setErrors({})
    setModal('edit')
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'Title is required.'
    if (!form.type) e.type = 'Type is required.'
    if (!form.status) e.status = 'Status is required.'
    if (!form.classId) e.classId = 'Please select a class.'
    if (!form.dueDate) e.dueDate = 'Due date is required.'
    if (!form.dueTime) e.dueTime = 'Due time is required.'
    if (!form.term) e.term = 'Term is required.'
    if (!form.period) e.period = 'Period is required.'
    if (!form.academicYear) e.academicYear = 'Academic year is required.'
    if (form.maxScore < 1 || form.maxScore > 100) e.maxScore = 'Score must be between 1 and 100.'
    if (!form.description.trim()) e.description = 'Description is required.'
    return e
  }

  function handleSave() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    if (modal === 'create') addAssignment(form)
    else if (modal === 'edit' && selected) updateAssignment(selected.id, form)
    setModal(null)
  }

  const statusColor: Record<string, string> = {
    Active: 'bg-emerald-100 text-emerald-700',
    Draft: 'bg-[#FFF8E7] text-[#6B0F1A] border border-[#D4AF37]/40',
    Closed: 'bg-[#6B0F1A]/10 text-[#6B0F1A] border border-[#6B0F1A]/20',
  }

  const typeColor: Record<string, string> = {
    Assignment: 'bg-[#6B0F1A] text-[#FFF8E7]',
    Quiz: 'bg-[#D4AF37] text-[#4a0b13]',
    Project: 'bg-[#FFF8E7] text-[#6B0F1A] border border-[#D4AF37]/50',
    Research: 'bg-[#6B0F1A]/10 text-[#6B0F1A] border border-[#6B0F1A]/20',
    Recitation: 'bg-amber-100 text-amber-800 border border-[#D4AF37]/40',
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f9f5ea] via-white to-[#f9f5ea]">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#6B0F1A]">Activities</h1>
            <p className="text-gray-600 text-sm mt-0.5">Manage assignments, quizzes, projects, and research tasks</p>
            <div className="mt-3 h-0.5 w-20 rounded bg-[#D4AF37]" />
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#6B0F1A] text-white text-sm font-medium rounded-lg hover:bg-[#8B1A2B] transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-1"
          >
            <Plus className="w-4 h-4" /> New Activity
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Active', count: assignments.filter((a) => a.status === 'Active' && a.type !== 'Exam').length, color: 'text-emerald-600' },
            { label: 'Draft', count: assignments.filter((a) => a.status === 'Draft' && a.type !== 'Exam').length, color: 'text-[#6B0F1A]' },
            { label: 'Closed', count: assignments.filter((a) => a.status === 'Closed' && a.type !== 'Exam').length, color: 'text-[#8B1A2B]' },
          ].map(({ label, count, color }) => (
            <div key={label} className="bg-white rounded-xl border border-[#D4AF37]/30 shadow-sm p-3 text-center">
              <div className={`text-2xl font-bold ${color}`}>{count}</div>
              <div className="text-xs text-gray-600">{label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4AF37]" />
            <input
              type="text" placeholder="Search activity..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[#D4AF37]/40 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
            />
          </div>
          <select
            value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-[#D4AF37]/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white"
            aria-label="Filter by type"
          >
            <option value="">All Types</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as ExamPeriod | '')}
            className="px-3 py-2 border border-[#D4AF37]/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white"
            aria-label="Filter by period"
          >
            <option value="">All Periods</option>
            {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <div className="flex items-center gap-1 bg-[#FFF8E7] border border-[#D4AF37]/30 rounded-lg p-1">
            <button onClick={() => setView('grid')} className={`p-1.5 rounded transition-colors ${view === 'grid' ? 'bg-[#6B0F1A] text-[#FFF8E7] shadow' : 'text-[#6B0F1A] hover:bg-[#fdf8ec]'}`} title="Grid">
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button onClick={() => setView('list')} className={`p-1.5 rounded transition-colors ${view === 'list' ? 'bg-[#6B0F1A] text-[#FFF8E7] shadow' : 'text-[#6B0F1A] hover:bg-[#fdf8ec]'}`} title="List">
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Grid View */}
        {view === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((a) => {
              const cls = classes.find((c) => c.id === a.classId)
              return (
                <div key={a.id} className="bg-white rounded-xl border border-[#D4AF37]/30 shadow-sm p-4 hover:shadow-md hover:border-[#D4AF37] transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColor[a.type] || 'bg-[#FFF8E7] text-[#6B0F1A]'}`}>
                      {a.type}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[a.status]}`}>
                      {a.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-[#6B0F1A] text-sm mt-2 mb-1">{a.title}</h3>
                  {a.description && <p className="text-xs text-gray-600 line-clamp-2">{a.description}</p>}
                  <div className="mt-3 space-y-1">
                    {a.dueDate && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                        Due: {a.dueDate}
                      </div>
                    )}
                    {cls && (
                      <div className="flex items-center gap-1.5 text-xs text-[#6B0F1A] font-medium">
                        <Tag className="w-3.5 h-3.5 text-[#D4AF37]" />
                        {cls.section}
                      </div>
                    )}
                    <div className="text-xs text-gray-600">Max Score: <span className="font-semibold text-[#6B0F1A]">{a.maxScore}</span></div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#D4AF37]/20">
                    <button onClick={() => openEdit(a)} className="flex-1 text-center text-xs py-1.5 bg-[#FFF8E7] text-[#6B0F1A] rounded-md hover:bg-[#fdf8ec] transition-colors font-medium">
                      Edit
                    </button>
                    <button onClick={() => { setSelected(a); setModal('delete') }} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-16 text-gray-600">
                <ClipboardList className="w-10 h-10 mx-auto mb-3 text-[#D4AF37]/60" />
                <p className="text-sm">
                  {periodFilter
                    ? <>No activities found for <span className="font-semibold text-[#6B0F1A]">{periodFilter}</span>.</>
                    : <>No assignments found. <button onClick={openCreate} className="text-[#6B0F1A] hover:text-[#8B1A2B] font-medium underline">Create one</button></>
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* List View */}
        {view === 'list' && (
          <div className="bg-white rounded-xl border border-[#D4AF37]/30 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#D4AF37]/30">
                <thead className="bg-[#FFF8E7]">
                  <tr>
                    {['Title', 'Type', 'Class', 'Due Date', 'Max Score', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#6B0F1A] uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4AF37]/20">
                  {filtered.map((a) => {
                    const cls = classes.find((c) => c.id === a.classId)
                    return (
                      <tr key={a.id} className="hover:bg-[#fdf8ec] transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-sm text-[#6B0F1A]">{a.title}</div>
                          {a.description && <div className="text-xs text-gray-600 truncate max-w-xs">{a.description}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColor[a.type] || ''}`}>{a.type}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700">{cls?.section || '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-700">{a.dueDate || '—'}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-[#6B0F1A]">{a.maxScore}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[a.status]}`}>{a.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEdit(a)} className="text-[#6B0F1A]/70 hover:text-[#6B0F1A] p-1 rounded hover:bg-[#FFF8E7] transition-colors" title="Edit">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => { setSelected(a); setModal('delete') }} className="text-gray-500 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-600 text-sm">No assignments found.</td>
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[#D4AF37]/40">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#D4AF37]/30 bg-[#FFF8E7]">
                <h2 className="font-semibold text-[#6B0F1A] flex items-center gap-2">
                  <span className="inline-block w-1.5 h-4 rounded-sm bg-[#D4AF37]" />
                  {modal === 'create' ? 'New Activity' : 'Edit Activity'}
                </h2>
                <button onClick={() => setModal(null)} className="p-1.5 rounded hover:bg-[#fdf8ec] text-[#6B0F1A]"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#6B0F1A] mb-1.5 flex items-center gap-1">
                    Title <span className="text-red-600">*</span>
                    <Tooltip text="Give a clear, descriptive title for this assignment/quiz" position="right" />
                  </label>
                  <input
                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 ${errors.title ? 'border-red-400 focus:ring-red-300' : 'border-[#D4AF37]/40 focus:ring-[#D4AF37] focus:border-[#D4AF37]'}`}
                    value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g., Quiz 1 - HCI Fundamentals"
                  />
                  {errors.title && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.title}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-[#6B0F1A] mb-1.5 block">Type <span className="text-red-600">*</span></label>
                    <select
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 bg-white ${errors.type ? 'border-red-400 focus:ring-red-300' : 'border-[#D4AF37]/40 focus:ring-[#D4AF37] focus:border-[#D4AF37]'}`}
                      value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                    >
                      {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {errors.type && <p className="text-xs text-red-600 mt-1">{errors.type}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#6B0F1A] mb-1.5 block">Status <span className="text-red-600">*</span></label>
                    <select
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 bg-white ${errors.status ? 'border-red-400 focus:ring-red-300' : 'border-[#D4AF37]/40 focus:ring-[#D4AF37] focus:border-[#D4AF37]'}`}
                      value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.status && <p className="text-xs text-red-600 mt-1">{errors.status}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-[#6B0F1A] mb-1.5 block">Class <span className="text-red-600">*</span></label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 bg-white ${errors.classId ? 'border-red-400 focus:ring-red-300' : 'border-[#D4AF37]/40 focus:ring-[#D4AF37] focus:border-[#D4AF37]'}`}
                    value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}
                  >
                    <option value="">Select a class...</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
                  </select>
                  {errors.classId && <p className="text-xs text-red-600 mt-1">{errors.classId}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-[#6B0F1A] mb-1.5 block">Due Date <span className="text-red-600">*</span></label>
                    <input
                      type="date"
                      className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 ${errors.dueDate ? 'border-red-400 focus:ring-red-300' : 'border-[#D4AF37]/40 focus:ring-[#D4AF37] focus:border-[#D4AF37]'}`}
                      value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    />
                    {errors.dueDate && <p className="text-xs text-red-600 mt-1">{errors.dueDate}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#6B0F1A] mb-1.5 block">Due Time <span className="text-red-600">*</span></label>
                    <input
                      type="time"
                      className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 ${errors.dueTime ? 'border-red-400 focus:ring-red-300' : 'border-[#D4AF37]/40 focus:ring-[#D4AF37] focus:border-[#D4AF37]'}`}
                      value={form.dueTime ?? ''} onChange={(e) => setForm({ ...form, dueTime: e.target.value })}
                    />
                    {errors.dueTime && <p className="text-xs text-red-600 mt-1">{errors.dueTime}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-[#6B0F1A] mb-1.5 block">Term <span className="text-red-600">*</span></label>
                    <select
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 bg-white ${errors.term ? 'border-red-400 focus:ring-red-300' : 'border-[#D4AF37]/40 focus:ring-[#D4AF37] focus:border-[#D4AF37]'}`}
                      value={form.term ?? ''} onChange={(e) => setForm({ ...form, term: (e.target.value || undefined) as Term | undefined })}
                    >
                      <option value="">Select term...</option>
                      {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {errors.term && <p className="text-xs text-red-600 mt-1">{errors.term}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#6B0F1A] mb-1.5 block">Period <span className="text-red-600">*</span></label>
                    <select
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 bg-white ${errors.period ? 'border-red-400 focus:ring-red-300' : 'border-[#D4AF37]/40 focus:ring-[#D4AF37] focus:border-[#D4AF37]'}`}
                      value={form.period ?? ''} onChange={(e) => setForm({ ...form, period: (e.target.value || undefined) as ExamPeriod | undefined })}
                    >
                      <option value="">Select period...</option>
                      {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {errors.period && <p className="text-xs text-red-600 mt-1">{errors.period}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-[#6B0F1A] mb-1.5 block">Academic Year <span className="text-red-600">*</span></label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 bg-white ${errors.academicYear ? 'border-red-400 focus:ring-red-300' : 'border-[#D4AF37]/40 focus:ring-[#D4AF37] focus:border-[#D4AF37]'}`}
                    value={form.academicYear ?? ''} onChange={(e) => setForm({ ...form, academicYear: (e.target.value || undefined) as AcademicYear | undefined })}
                  >
                    <option value="">Select academic year...</option>
                    {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                  {errors.academicYear && <p className="text-xs text-red-600 mt-1">{errors.academicYear}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-[#6B0F1A] mb-1.5 flex items-center gap-1">
                    Max Score <span className="text-red-600">*</span>
                    <Tooltip text="Maximum possible score for this assessment (1-100)" position="right" />
                  </label>
                  <input
                    type="number" min={1} max={100}
                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 ${errors.maxScore ? 'border-red-400 focus:ring-red-300' : 'border-[#D4AF37]/40 focus:ring-[#D4AF37] focus:border-[#D4AF37]'}`}
                    value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: parseInt(e.target.value) || 100 })}
                  />
                  {errors.maxScore && <p className="text-xs text-red-600 mt-1">{errors.maxScore}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-[#6B0F1A] mb-1.5 block">Description <span className="text-red-600">*</span></label>
                  <textarea
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 resize-none ${errors.description ? 'border-red-400 focus:ring-red-300' : 'border-[#D4AF37]/40 focus:ring-[#D4AF37] focus:border-[#D4AF37]'}`}
                    value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Instructions or description..."
                  />
                  {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
                </div>
              </div>
              <div className="flex gap-3 justify-end px-6 py-4 border-t border-[#D4AF37]/30 bg-[#FFF8E7]">
                <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border border-[#D4AF37]/40 text-[#6B0F1A] bg-white rounded-lg hover:bg-[#fdf8ec] font-medium transition-colors">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 text-sm bg-[#6B0F1A] text-white rounded-lg hover:bg-[#8B1A2B] font-medium transition-colors">
                  {modal === 'create' ? 'Create' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm */}
        {modal === 'delete' && selected && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-[#D4AF37]/40">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-semibold text-[#6B0F1A]">Delete Assignment</h2>
                  <p className="text-sm text-gray-600 mt-1">Delete <strong className="text-[#6B0F1A]">{selected.title}</strong>? This cannot be undone.</p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border border-[#D4AF37]/40 text-[#6B0F1A] bg-white rounded-lg hover:bg-[#fdf8ec] font-medium transition-colors">Cancel</button>
                <button onClick={() => { deleteAssignment(selected.id); setModal(null) }} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
