import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import {
  Search, Plus, Trash2, Pencil, X, AlertCircle,
  Users, Grid3X3, List, Check, ChevronRight, GraduationCap,
  BookOpen, Hash, Layers, User as UserIcon, ExternalLink, CalendarDays,
} from 'lucide-react'
import { useStudents, useClasses, studentIdentityKey } from '../../lib/store'
import type { Student, YearLevel, CollegeProgram, Class, AcademicYear } from '../../lib/types'
import Tooltip from '../../components/Tooltip'

const YEAR_LEVELS: YearLevel[] = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']
const COLLEGE_PROGRAMS: CollegeProgram[] = ['BSCS-DS', 'BSIT-GD']
const ACADEMIC_YEARS: AcademicYear[] = ['2025-2026', '2026-2027', '2027-2028']

export const Route = createFileRoute('/students/')({
  component: StudentsPage,
})

function fullName(s: Student) {
  const mi = s.mi ? ` ${s.mi}.` : ''
  return `${s.lastName}, ${s.firstName}${mi}`
}

function StudentsPage() {
  const { classes } = useClasses()
  const { allStudents: students, addStudentToClasses, deleteStudent, syncStudentClasses } = useStudents()
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [modal, setModal] = useState<null | 'add' | 'edit' | 'delete' | 'profile'>(null)
  const [selected, setSelected] = useState<Student | null>(null)
  const [form, setForm] = useState<{
    lastName: string
    firstName: string
    mi: string
    studentNo: string
    yearLevel: '' | YearLevel
    collegeProgram: '' | CollegeProgram
    academicYear: '' | AcademicYear
    classId: string
    classIds: string[]
  }>({ lastName: '', firstName: '', mi: '', studentNo: '', yearLevel: '', collegeProgram: '', academicYear: '', classId: '', classIds: [] })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const seen = new Set<string>()
    const out: Student[] = []
    for (const s of students) {
      if (classFilter && s.classId !== classFilter) continue
      const matches = `${s.lastName} ${s.firstName} ${s.studentNo}`.toLowerCase().includes(q)
      if (!matches) continue
      const key = studentIdentityKey(s)
      if (seen.has(key)) continue
      seen.add(key)
      out.push(s)
    }
    return out
  }, [students, search, classFilter])

  // Map of studentId → list of classes this student is assigned to (across all enrollment records)
  const assignedClassesByStudent = useMemo(() => {
    const groups = new Map<string, Class[]>()
    const buckets = new Map<string, Student[]>()
    for (const s of students) {
      const k = studentIdentityKey(s)
      if (!buckets.has(k)) buckets.set(k, [])
      buckets.get(k)!.push(s)
    }
    for (const [, group] of buckets) {
      const assigned: Class[] = []
      const seen = new Set<string>()
      for (const s of group) {
        const c = classes.find((cc) => cc.id === s.classId)
        if (c && !seen.has(c.id)) { assigned.push(c); seen.add(c.id) }
      }
      for (const s of group) groups.set(s.id, assigned)
    }
    return groups
  }, [students, classes])

  function openAdd() {
    const defaults = classFilter ? [classFilter] : []
    setForm({ lastName: '', firstName: '', mi: '', studentNo: '', yearLevel: '', collegeProgram: '', academicYear: '', classId: '', classIds: defaults })
    setErrors({})
    setModal('add')
  }

  function openProfile(s: Student) {
    setSelected(s)
    setModal('profile')
  }

  function openEdit(s: Student) {
    const assigned = assignedClassesByStudent.get(s.id) ?? []
    const classIds = assigned.length > 0 ? assigned.map((c) => c.id) : [s.classId]
    setSelected(s)
    setForm({
      lastName: s.lastName,
      firstName: s.firstName,
      mi: s.mi,
      studentNo: s.studentNo,
      yearLevel: s.yearLevel ?? '',
      collegeProgram: s.collegeProgram ?? '',
      academicYear: s.academicYear ?? '',
      classId: s.classId,
      classIds,
    })
    setErrors({})
    setModal('edit')
  }

  function openDelete(s: Student) {
    setSelected(s)
    setModal('delete')
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.lastName.trim()) e.lastName = 'Last name is required.'
    if (!form.firstName.trim()) e.firstName = 'First name is required.'
    if (!form.studentNo.trim()) e.studentNo = 'Student number is required.'
    if (!form.yearLevel) e.yearLevel = 'Year level is required.'
    if (!form.collegeProgram) e.collegeProgram = 'College program is required.'
    if (!form.academicYear) e.academicYear = 'Academic year is required.'
    if (form.classIds.length === 0) {
      e.classId = modal === 'add' ? 'Please assign at least one class.' : 'Please assign the student to at least one class.'
    }
    return e
  }

  function handleSave() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    const lastName = form.lastName.toUpperCase()
    const firstName = form.firstName.toUpperCase()
    const mi = form.mi.toUpperCase()
    const yearLevel = form.yearLevel || undefined
    const collegeProgram = form.collegeProgram || undefined
    const academicYear = form.academicYear || undefined
    if (modal === 'add') {
      addStudentToClasses(form.classIds, {
        lastName,
        firstName,
        mi,
        studentNo: form.studentNo || undefined,
        yearLevel,
        collegeProgram,
        academicYear,
      })
    } else if (modal === 'edit' && selected) {
      const sharedStudentNo = (form.studentNo || selected.studentNo || '').trim()
      syncStudentClasses(selected.id, form.classIds, {
        lastName,
        firstName,
        mi,
        studentNo: sharedStudentNo,
        yearLevel,
        collegeProgram,
        academicYear,
      })
    }
    setModal(null)
  }

  function toggleClass(id: string) {
    setForm((f) => {
      const has = f.classIds.includes(id)
      return { ...f, classIds: has ? f.classIds.filter((c) => c !== id) : [...f.classIds, id] }
    })
    if (errors.classId) setErrors((prev) => { const { classId: _omit, ...rest } = prev; return rest })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f9f5ea] via-white to-[#f9f5ea]">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#6B0F1A]">Students</h1>
            <p className="text-gray-600 text-sm mt-0.5">{students.length} students enrolled across {classes.length} classes</p>
            <div className="mt-3 h-0.5 w-20 rounded bg-[#D4AF37]" />
          </div>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#6B0F1A] text-white text-sm font-medium rounded-lg hover:bg-[#8B1A2B] transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-1"
          >
            <Plus className="w-4 h-4" /> Add Student
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4AF37]" />
            <input
              type="text" placeholder="Search by name or student number..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[#D4AF37]/40 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
            />
          </div>
          <select
            value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 border border-[#D4AF37]/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white"
          >
            <option value="">All Students</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((s) => {
              const assigned = assignedClassesByStudent.get(s.id) ?? []
              const primary = classes.find((c) => c.id === s.classId)
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => openProfile(s)}
                  className="group text-left bg-white rounded-2xl border border-[#D4AF37]/30 shadow-sm hover:shadow-lg hover:border-[#D4AF37] hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 overflow-hidden"
                  aria-label={`Open profile for ${fullName(s)}`}
                >
                  <div className="h-2 bg-gradient-to-r from-[#6B0F1A] via-[#8B1A2B] to-[#D4AF37]" />
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-full bg-[#6B0F1A] ring-2 ring-[#D4AF37]/60 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#FFF8E7] font-bold">{(s.lastName[0] || '?').toUpperCase()}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[#6B0F1A] text-sm leading-tight truncate" title={fullName(s)}>
                          {fullName(s)}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <Hash className="w-3 h-3" /> {s.studentNo || '—'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {s.yearLevel && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#FFF8E7] text-[#6B0F1A] border border-[#D4AF37]/40">
                          <GraduationCap className="w-3 h-3" /> {s.yearLevel}
                        </span>
                      )}
                      {s.collegeProgram && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#6B0F1A]/5 text-[#6B0F1A] border border-[#6B0F1A]/20">
                          <BookOpen className="w-3 h-3" /> {s.collegeProgram}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#D4AF37]/20">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            {assigned.length > 1 ? `${assigned.length} Classes` : 'Class'}
                          </div>
                          <div className="text-xs text-[#6B0F1A] font-medium truncate" title={assigned.map((c) => c.section).join(', ')}>
                            {assigned.length > 0
                              ? assigned.slice(0, 2).map((c) => c.section).join(', ') + (assigned.length > 2 ? ` +${assigned.length - 2}` : '')
                              : primary?.section || '—'}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#D4AF37] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-16 text-gray-500">
                <Users className="w-10 h-10 mx-auto mb-3 text-[#D4AF37]/60" />
                <p className="text-sm">No students found.</p>
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
                    {['#', 'Student Name', 'Student No.', 'Year', 'Program', 'Classes', ''].map((h, i) => (
                      <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-[#6B0F1A] uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4AF37]/20">
                  {filtered.map((s, idx) => {
                    const assigned = assignedClassesByStudent.get(s.id) ?? []
                    return (
                      <tr
                        key={s.id}
                        onClick={() => openProfile(s)}
                        className="group hover:bg-[#fdf8ec] transition-colors cursor-pointer focus-within:bg-[#fdf8ec]"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProfile(s) } }}
                        aria-label={`Open profile for ${fullName(s)}`}
                      >
                        <td className="px-4 py-3 text-xs text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#6B0F1A] ring-1 ring-[#D4AF37]/60 flex items-center justify-center flex-shrink-0">
                              <span className="text-[#FFF8E7] text-xs font-bold">{(s.lastName[0] || '?').toUpperCase()}</span>
                            </div>
                            <div className="font-medium text-sm text-[#6B0F1A]">{fullName(s)}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">{s.studentNo || '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-700">{s.yearLevel || '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-700">{s.collegeProgram || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {assigned.length === 0 && <span className="text-xs text-gray-400">—</span>}
                            {assigned.slice(0, 2).map((c) => (
                              <span key={c.id} className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#FFF8E7] text-[#6B0F1A] border border-[#D4AF37]/40">
                                {c.section}
                              </span>
                            ))}
                            {assigned.length > 2 && (
                              <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#6B0F1A]/5 text-[#6B0F1A] border border-[#6B0F1A]/20">
                                +{assigned.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <ChevronRight className="w-4 h-4 text-[#D4AF37] inline-block group-hover:translate-x-0.5 transition-transform" />
                        </td>
                      </tr>
                    )
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-500 text-sm">No students found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Profile Modal */}
        {modal === 'profile' && selected && (() => {
          const s = selected
          const assigned = assignedClassesByStudent.get(s.id) ?? []
          return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => setModal(null)}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-[#D4AF37]/40 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Header banner */}
                <div className="relative">
                  <div className="h-20 bg-gradient-to-r from-[#6B0F1A] via-[#8B1A2B] to-[#D4AF37]" />
                  <button onClick={() => setModal(null)} className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 hover:bg-white text-[#6B0F1A]" aria-label="Close">
                    <X className="w-4 h-4" />
                  </button>
                  <div className="px-6 -mt-10">
                    <div className="flex items-end gap-4">
                      <div className="w-20 h-20 rounded-full bg-[#6B0F1A] ring-4 ring-white flex items-center justify-center flex-shrink-0 shadow-md">
                        <span className="text-[#FFF8E7] font-bold text-2xl">{(s.lastName[0] || '?').toUpperCase()}</span>
                      </div>
                      <div className="pb-1">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Student Profile</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 pt-3 pb-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="text-xl font-bold text-[#6B0F1A] leading-tight">{fullName(s)}</h2>
                      <div className="text-xs text-gray-500 mt-0.5">{s.studentNo || 'No student number'}</div>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <DetailRow icon={<UserIcon className="w-3.5 h-3.5" />} label="Full Name" value={fullName(s)} />
                    <DetailRow icon={<Hash className="w-3.5 h-3.5" />} label="Student Number" value={s.studentNo || '—'} />
                    <DetailRow icon={<GraduationCap className="w-3.5 h-3.5" />} label="Year Level" value={s.yearLevel || '—'} />
                    <DetailRow icon={<BookOpen className="w-3.5 h-3.5" />} label="College Program" value={s.collegeProgram || '—'} />
                    <DetailRow icon={<CalendarDays className="w-3.5 h-3.5" />} label="Academic Year" value={s.academicYear || '—'} className="sm:col-span-2" />
                  </div>

                  {/* Assigned classes */}
                  <div className="mt-3 rounded-lg border border-[#D4AF37]/30 bg-[#FFFDF6] p-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
                      <Layers className="w-3.5 h-3.5 text-[#D4AF37]" /> Assigned Class{assigned.length === 1 ? '' : 'es'}
                    </div>
                    {assigned.length === 0 ? (
                      <div className="text-sm text-gray-400">Not assigned to any class.</div>
                    ) : (
                      <ul className="space-y-1.5">
                        {assigned.map((c) => (
                          <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                            <div className="min-w-0">
                              <div className="font-medium text-[#6B0F1A] truncate">{c.name}</div>
                              <div className="text-xs text-gray-500 truncate">{c.section} · {c.schedule}</div>
                            </div>
                            <Link
                              to={`/classes/${c.id}` as any}
                              onClick={() => setModal(null)}
                              className="inline-flex items-center gap-1 text-xs text-[#6B0F1A] hover:text-[#8B1A2B] hover:underline font-medium whitespace-nowrap"
                            >
                              Open <ExternalLink className="w-3 h-3" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Footer actions */}
                <div className="flex flex-wrap gap-2 justify-end px-6 py-4 border-t border-[#D4AF37]/30 bg-[#FFF8E7]">
                  <button
                    onClick={() => setModal(null)}
                    className="px-4 py-2 text-sm border border-[#D4AF37]/40 text-[#6B0F1A] bg-white rounded-lg hover:bg-[#fdf8ec] font-medium transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => openDelete(s)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm border border-red-200 text-red-600 bg-white rounded-lg hover:bg-red-50 font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                  <button
                    onClick={() => openEdit(s)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-[#6B0F1A] text-white rounded-lg hover:bg-[#8B1A2B] font-medium transition-colors"
                  >
                    <Pencil className="w-4 h-4" /> Edit
                  </button>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Add/Edit Modal */}
        {(modal === 'add' || modal === 'edit') && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[#D4AF37]/40">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#D4AF37]/30 bg-[#FFF8E7]">
                <h2 className="font-semibold text-[#6B0F1A] flex items-center gap-2">
                  <span className="inline-block w-1.5 h-4 rounded-sm bg-[#D4AF37]" />
                  {modal === 'add' ? 'Add Student' : 'Edit Student'}
                </h2>
                <button onClick={() => setModal(selected && modal === 'edit' ? 'profile' : null)} className="p-1.5 rounded hover:bg-[#fdf8ec] text-[#6B0F1A]"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-[#6B0F1A] mb-1.5 flex items-center gap-1">
                      Last Name <span className="text-red-600">*</span>
                      <Tooltip text="Student's last/family name in uppercase" position="right" />
                    </label>
                    <input
                      className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 ${errors.lastName ? 'border-red-400 focus:ring-red-300' : 'border-[#D4AF37]/40 focus:ring-[#D4AF37] focus:border-[#D4AF37]'}`}
                      value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      placeholder="e.g., DELA CRUZ"
                    />
                    {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#6B0F1A] mb-1.5 block">First Name <span className="text-red-600">*</span></label>
                    <input
                      className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 ${errors.firstName ? 'border-red-400 focus:ring-red-300' : 'border-[#D4AF37]/40 focus:ring-[#D4AF37] focus:border-[#D4AF37]'}`}
                      value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      placeholder="e.g., JUAN"
                    />
                    {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-[#6B0F1A] mb-1.5 block">M.I.</label>
                    <input maxLength={2}
                      className="w-full px-3 py-2 border border-[#D4AF37]/40 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                      value={form.mi} onChange={(e) => setForm({ ...form, mi: e.target.value })}
                      placeholder="e.g., D"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#6B0F1A] mb-1.5 block">Student No. <span className="text-red-600">*</span></label>
                    <input
                      inputMode="text"
                      pattern="[0-9-]*"
                      className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 ${errors.studentNo ? 'border-red-400 focus:ring-red-300' : 'border-[#D4AF37]/40 focus:ring-[#D4AF37] focus:border-[#D4AF37]'}`}
                      value={form.studentNo}
                      onChange={(e) => {
                        const digitsAndDashes = e.target.value.replace(/[^0-9-]/g, '')
                        setForm({ ...form, studentNo: digitsAndDashes })
                      }}
                      placeholder="e.g., 2025-0001"
                    />
                    {errors.studentNo && <p className="text-xs text-red-600 mt-1">{errors.studentNo}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-[#6B0F1A] mb-1.5 block">Year Level <span className="text-red-600">*</span></label>
                    <select
                      className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 ${errors.yearLevel ? 'border-red-400 focus:ring-red-300' : 'border-[#D4AF37]/40 focus:ring-[#D4AF37] focus:border-[#D4AF37]'}`}
                      value={form.yearLevel}
                      onChange={(e) => {
                        const nextYear = e.target.value as '' | YearLevel
                        setForm((f) => {
                          const allowedIds = new Set(
                            classes
                              .filter((c) => (!nextYear || c.yearLevel === nextYear) && (!f.academicYear || c.academicYear === f.academicYear))
                              .map((c) => c.id),
                          )
                          return {
                            ...f,
                            yearLevel: nextYear,
                            classIds: f.classIds.filter((id) => allowedIds.has(id)),
                          }
                        })
                        if (errors.yearLevel) setErrors((prev) => { const { yearLevel: _omit, ...rest } = prev; return rest })
                      }}
                    >
                      <option value="">Select year level…</option>
                      {YEAR_LEVELS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                    {errors.yearLevel && <p className="text-xs text-red-600 mt-1">{errors.yearLevel}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#6B0F1A] mb-1.5 block">College Program <span className="text-red-600">*</span></label>
                    <select
                      className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 ${errors.collegeProgram ? 'border-red-400 focus:ring-red-300' : 'border-[#D4AF37]/40 focus:ring-[#D4AF37] focus:border-[#D4AF37]'}`}
                      value={form.collegeProgram}
                      onChange={(e) => {
                        setForm({ ...form, collegeProgram: e.target.value as '' | CollegeProgram })
                        if (errors.collegeProgram) setErrors((prev) => { const { collegeProgram: _omit, ...rest } = prev; return rest })
                      }}
                    >
                      <option value="">Select program…</option>
                      {COLLEGE_PROGRAMS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {errors.collegeProgram && <p className="text-xs text-red-600 mt-1">{errors.collegeProgram}</p>}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#6B0F1A] mb-1.5 block">Academic Year <span className="text-red-600">*</span></label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 ${errors.academicYear ? 'border-red-400 focus:ring-red-300' : 'border-[#D4AF37]/40 focus:ring-[#D4AF37] focus:border-[#D4AF37]'}`}
                    value={form.academicYear}
                    onChange={(e) => {
                      const nextAY = e.target.value as '' | AcademicYear
                      setForm((f) => {
                        const allowedIds = new Set(
                          classes
                            .filter((c) => (!f.yearLevel || c.yearLevel === f.yearLevel) && (!nextAY || c.academicYear === nextAY))
                            .map((c) => c.id),
                        )
                        return {
                          ...f,
                          academicYear: nextAY,
                          classIds: f.classIds.filter((id) => allowedIds.has(id)),
                        }
                      })
                      if (errors.academicYear) setErrors((prev) => { const { academicYear: _omit, ...rest } = prev; return rest })
                    }}
                  >
                    <option value="">Select academic year…</option>
                    {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                  {errors.academicYear && <p className="text-xs text-red-600 mt-1">{errors.academicYear}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-[#6B0F1A] mb-1.5 block">
                    Assign to Classes <span className="text-red-600">*</span>
                  </label>
                  {(() => {
                    const matchingClasses = form.yearLevel && form.academicYear
                      ? classes.filter((c) => c.yearLevel === form.yearLevel && c.academicYear === form.academicYear)
                      : []
                    if (!form.yearLevel || !form.academicYear) {
                      return (
                        <div className={`px-3 py-2 border rounded-lg text-sm bg-white text-gray-500 ${errors.classId ? 'border-red-400' : 'border-[#D4AF37]/40'}`}>
                          Select a year level and academic year first to see matching classes.
                        </div>
                      )
                    }
                    if (matchingClasses.length === 0) {
                      return (
                        <div className={`px-3 py-2 border rounded-lg text-sm bg-white text-gray-500 ${errors.classId ? 'border-red-400' : 'border-[#D4AF37]/40'}`}>
                          No classes for {form.yearLevel} in {form.academicYear}. Create one in the Classes page.
                        </div>
                      )
                    }
                    return (
                      <div className={`max-h-44 overflow-y-auto rounded-lg border bg-white divide-y divide-[#D4AF37]/20 ${errors.classId ? 'border-red-400' : 'border-[#D4AF37]/40'}`}>
                        {matchingClasses.map((c) => {
                          const checked = form.classIds.includes(c.id)
                          return (
                            <label key={c.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-[#fdf8ec]">
                              <span className={`inline-flex items-center justify-center w-4 h-4 rounded border ${checked ? 'bg-[#6B0F1A] border-[#6B0F1A] text-white' : 'bg-white border-[#D4AF37]/60'}`}>
                                {checked && <Check className="w-3 h-3" />}
                              </span>
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={checked}
                                onChange={() => toggleClass(c.id)}
                              />
                              <span className="text-[#6B0F1A]">{c.name} — {c.section}</span>
                            </label>
                          )
                        })}
                      </div>
                    )
                  })()}
                  <p className="text-xs text-gray-500 mt-1">
                    {modal === 'add'
                      ? 'Only classes matching the selected year level and academic year are shown.'
                      : 'Only classes matching the selected year level and academic year are shown.'}
                  </p>
                  {errors.classId && <p className="text-xs text-red-600 mt-1">{errors.classId}</p>}
                </div>
              </div>
              <div className="flex gap-3 justify-end px-6 py-4 border-t border-[#D4AF37]/30 bg-[#FFF8E7]">
                <button onClick={() => setModal(selected && modal === 'edit' ? 'profile' : null)} className="px-4 py-2 text-sm border border-[#D4AF37]/40 text-[#6B0F1A] bg-white rounded-lg hover:bg-[#fdf8ec] font-medium transition-colors">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 text-sm bg-[#6B0F1A] text-white rounded-lg hover:bg-[#8B1A2B] font-medium transition-colors">
                  {modal === 'add'
                    ? (form.classIds.length > 1 ? `Add to ${form.classIds.length} Classes` : 'Add Student')
                    : (form.classIds.length > 1 ? `Save to ${form.classIds.length} Classes` : 'Save Changes')}
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
                  <h2 className="font-semibold text-[#6B0F1A]">Remove Student</h2>
                  <p className="text-sm text-gray-600 mt-1">Remove <strong className="text-[#6B0F1A]">{fullName(selected)}</strong>? All grade data will be lost.</p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setModal('profile')} className="px-4 py-2 text-sm border border-[#D4AF37]/40 text-[#6B0F1A] bg-white rounded-lg hover:bg-[#fdf8ec] font-medium transition-colors">Cancel</button>
                <button onClick={() => { deleteStudent(selected.id); setSelected(null); setModal(null) }} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors">Remove</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DetailRow({ icon, label, value, className }: { icon: React.ReactNode; label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-lg border border-[#D4AF37]/30 bg-[#FFFDF6] px-3 py-2${className ? ` ${className}` : ''}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        <span className="text-[#D4AF37]">{icon}</span>
        {label}
      </div>
      <div className="text-sm text-[#6B0F1A] font-medium mt-0.5 truncate" title={value}>{value}</div>
    </div>
  )
}
