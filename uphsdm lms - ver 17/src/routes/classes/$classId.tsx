import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useCallback, useMemo } from 'react'
import {
  ArrowLeft, Plus, Trash2, Save, AlertCircle, Users,
  BookOpen, ClipboardList, X, Pencil, CheckCircle2, Calculator,
} from 'lucide-react'
import Tooltip from '../../components/Tooltip'
import { useClasses, useStudents } from '../../lib/store'
import { computeGrades, computeAttendanceGrade, getPeriodData } from '../../lib/grading'
import type { ExamPeriod, PeriodGrades, Student } from '../../lib/types'

export const Route = createFileRoute('/classes/$classId')({
  component: ClassDetail,
})

function periodUpdates(period: ExamPeriod, data: PeriodGrades): Partial<Student> {
  if (period === 'Prelim') {
    return {
      attendance: data.attendance,
      classParticipation: data.classParticipation,
      quizzes: data.quizzes,
      ra: data.ra,
      project: data.project,
      majorExam: data.majorExam,
    }
  }
  return period === 'Midterm' ? { gradesMidterm: data } : { gradesFinals: data }
}

function ClassDetail() {
  const { classId } = Route.useParams()
  const navigate = useNavigate()
  const { classes } = useClasses()
  const { students, addStudent, updateStudent, deleteStudent } = useStudents(classId)
  const [activeTab, setActiveTab] = useState<'grades' | 'students' | 'info'>('grades')
  const [gradingPeriod, setGradingPeriod] = useState<'Prelim' | 'Midterm' | 'Finals'>('Prelim')
  const [deleteModal, setDeleteModal] = useState<Student | null>(null)
  const [addModal, setAddModal] = useState(false)
  const [newStudentForm, setNewStudentForm] = useState({ lastName: '', firstName: '', mi: '', studentNo: '' })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [savedMsg, setSavedMsg] = useState(false)

  const cls = classes.find((c) => c.id === classId)
  if (!cls) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Class not found.</p>
        <Link to="/classes" className="text-[#7a1e33] hover:underline text-sm mt-2 inline-block">
          Back to Classes
        </Link>
      </div>
    )
  }

  function updateField(id: string, path: string[], value: number | string) {
    const student = students.find((s) => s.id === id)
    if (!student) return
    const periodData = JSON.parse(
      JSON.stringify(getPeriodData(student, gradingPeriod)),
    ) as PeriodGrades
    let obj: any = periodData
    for (let i = 0; i < path.length - 1; i++) {
      obj = obj[path[i]]
    }
    obj[path[path.length - 1]] = value
    updateStudent(id, periodUpdates(gradingPeriod, periodData))
  }

  function handleSave() {
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2000)
  }

  function handleAddStudent() {
    const e: Record<string, string> = {}
    if (!newStudentForm.lastName.trim()) e.lastName = 'Last name required'
    if (!newStudentForm.firstName.trim()) e.firstName = 'First name required'
    if (Object.keys(e).length > 0) { setFormErrors(e); return }
    addStudent(classId, {
      lastName: newStudentForm.lastName.toUpperCase(),
      firstName: newStudentForm.firstName.toUpperCase(),
      mi: newStudentForm.mi.toUpperCase(),
      studentNo: newStudentForm.studentNo || undefined,
    })
    setNewStudentForm({ lastName: '', firstName: '', mi: '', studentNo: '' })
    setFormErrors({})
    setAddModal(false)
  }

  // Input cell component for editable numeric fields
  const NumInput = useCallback(({ value, onChange, className = '' }: { value: number; onChange: (v: number) => void; className?: string }) => (
    <input
      type="number"
      min={0}
      max={100}
      value={value || ''}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className={`w-full min-w-[3rem] text-center border-0 bg-[#fdf0c4] focus:bg-[#fae4a0] focus:outline-none focus:ring-1 focus:ring-[#c8a45d] rounded text-xs px-1 py-0.5 ${className}`}
    />
  ), [])

  const totalStudents = students.length
  const displayStudents = useMemo(
    () => students.map((s) => ({ ...s, ...getPeriodData(s, gradingPeriod) })),
    [students, gradingPeriod],
  )
  const grades = displayStudents.map((s) => computeGrades(s))
  const avgFinal = totalStudents > 0 ? Math.round(grades.reduce((sum, g) => sum + g.finaleGrade, 0) / totalStudents) : 0
  const passCount = grades.filter((g) => g.finaleGrade >= 75).length

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <Link to="/classes" className="mt-1 p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-400 mb-0.5">{cls.code}</div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{cls.name}</h1>
          <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
            <span>{cls.section}</span>
            {cls.semester && <span>· {cls.semester}</span>}
            {cls.faculty && <span>· {cls.faculty}</span>}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Students', value: totalStudents, icon: Users },
          { label: 'Class Avg', value: avgFinal > 0 ? `${avgFinal}%` : '—', icon: BookOpen },
          { label: 'Passed', value: `${passCount}/${totalStudents}`, icon: CheckCircle2 },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <Icon className="w-4 h-4 mx-auto text-[#7a1e33] mb-1" />
            <div className="text-lg font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 w-fit">
        {[
          { id: 'grades', label: 'Grade Sheet', icon: ClipboardList },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'info', label: 'Class Info', icon: BookOpen },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === id ? 'bg-white shadow text-[#7a1e33]' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* GRADE SHEET TAB */}
      {activeTab === 'grades' && (
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="font-semibold text-gray-800">Grade Report — {gradingPeriod}</h2>
                <div className="flex items-center gap-1.5">
                  <label htmlFor="gradingPeriod" className="text-xs font-semibold text-[#7a1e33] uppercase tracking-wide">
                    Period
                  </label>
                  <select
                    id="gradingPeriod"
                    value={gradingPeriod}
                    onChange={(e) => setGradingPeriod(e.target.value as 'Prelim' | 'Midterm' | 'Finals')}
                    className="text-xs border border-[#d4a94a] bg-[#fdf0c4] rounded-lg px-2 py-1 font-semibold text-[#7a1e33] focus:outline-none focus:ring-2 focus:ring-[#c8a45d] focus:border-[#c8a45d] transition-colors"
                  >
                    <option value="Prelim">Prelim</option>
                    <option value="Midterm">Midterm</option>
                    <option value="Finals">Finals</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Class Performance (70%) + Major Exam (30%) = Final Grade
                <Tooltip text="Class Performance = Attendance(10%) + Class Participation(10%) + Quizzes/Assignments(50%) + Projects/Research Activities(30%). Then × 70%. Major Exam × 30%. Sum = Final Grade." position="bottom" />
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setAddModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#7a1e33] text-white text-xs font-medium rounded-lg hover:bg-[#96283f] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Student
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Save className="w-3.5 h-3.5" /> {savedMsg ? 'Saved!' : 'Save'}
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-3 text-xs">
            <div className="flex items-center gap-1.5"><span className="inline-block w-4 h-3 bg-[#fdf0c4] border border-[#d4a94a] rounded" />Input Field</div>
            <div className="flex items-center gap-1.5"><span className="inline-block w-4 h-3 bg-[#faf3e0] border border-[#c8a45d] rounded" />Computed Field</div>
            <div className="flex items-center gap-1.5"><span className="inline-block w-4 h-3 bg-[#f5e6c8] border border-[#c8a45d] rounded" />Final Grade</div>
          </div>

          {/* Grade Sheet Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="text-xs border-collapse min-w-max w-full">
                <thead>
                  <tr className="bg-[#7a1e33] text-white">
                    <th className="border border-[#c8a45d] px-2 py-2 text-center" rowSpan={3}>No.</th>
                    <th className="border border-[#c8a45d] px-3 py-2 text-left min-w-[160px]" rowSpan={3}>Student Name<br/>(Sname, Fname MI)</th>
                    <th className="border border-[#c8a45d] px-2 py-1 text-center bg-[#96283f]" colSpan={8}>CLASS PERFORMANCE (70%)</th>
                    <th className="border border-[#c8a45d] px-2 py-1 text-center bg-[#5e1724]" colSpan={2}>MAJOR EXAM (30%)</th>
                    <th className="border border-[#c8a45d] px-2 py-1 text-center bg-[#3d0f18]" rowSpan={3}>FINAL<br/>GRADE</th>
                    <th className="border border-[#c8a45d] px-2 py-1 text-center bg-[#3d0f18]" rowSpan={3}>EQUIV<br/>(GWA)</th>
                    <th className="border border-[#c8a45d] px-2 py-1 text-center bg-[#3d0f18]" rowSpan={3}>REMARKS</th>
                    <th className="border border-[#c8a45d] px-2 py-1 text-center" rowSpan={3}>Actions</th>
                  </tr>
                  <tr className="bg-[#96283f] text-white">
                    <th className="border border-[#d4a94a] px-2 py-1 text-center" colSpan={2}>ATTENDANCE</th>
                    <th className="border border-[#d4a94a] px-2 py-1 text-center" colSpan={2}>CLASS PARTICIPATION</th>
                    <th className="border border-[#d4a94a] px-2 py-1 text-center" colSpan={2}>QZS/ASNGMNTS</th>
                    <th className="border border-[#d4a94a] px-2 py-1 text-center" colSpan={2}>PROJ/RA</th>
                    <th className="border border-[#e0b963] px-2 py-1 text-center bg-[#5e1724]" colSpan={2}>MAJOR EXAM</th>
                  </tr>
                  <tr className="bg-[#a83d54] text-white text-[10px]">
                    <th className="border border-[#d4a94a] px-2 py-1 text-center">Grade</th>
                    <th className="border border-[#d4a94a] px-2 py-1 text-center">10%</th>
                    <th className="border border-[#d4a94a] px-2 py-1 text-center">Avg</th>
                    <th className="border border-[#d4a94a] px-2 py-1 text-center">10%</th>
                    <th className="border border-[#d4a94a] px-2 py-1 text-center">Avg</th>
                    <th className="border border-[#d4a94a] px-2 py-1 text-center">50%</th>
                    <th className="border border-[#d4a94a] px-2 py-1 text-center">Avg</th>
                    <th className="border border-[#d4a94a] px-2 py-1 text-center">30%</th>
                    <th className="border border-[#e0b963] px-2 py-1 text-center bg-[#a83d54]">Score %</th>
                    <th className="border border-[#e0b963] px-2 py-1 text-center bg-[#a83d54]">30%</th>
                  </tr>
                </thead>
                <tbody>
                  {displayStudents.map((student, idx) => {
                    const g = computeGrades(student)
                    const attGrade = computeAttendanceGrade(student.attendance)
                    return (
                      <tr key={student.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-200 px-2 py-1 text-center text-gray-500">{idx + 1}</td>
                        <td className="border border-gray-200 px-2 py-1 min-w-[160px]">
                          <div className="font-medium text-gray-900">{student.lastName}, {student.firstName} {student.mi}.</div>
                          <div className="text-gray-400 text-[10px]">{student.studentNo}</div>
                        </td>

                        {/* Attendance — Grade | × 10% */}
                        <td className="border border-gray-200 px-1 py-1 text-center bg-[#faf3e0] min-w-[48px]">
                          <div className="text-[#5e1724] font-medium">{attGrade.toFixed(0)}</div>
                          <AttendancePopover student={student} updateField={updateField} />
                        </td>
                        <td className="border border-gray-200 px-1 py-1 text-center bg-[#faf3e0]">
                          <span className="text-[#7a1e33] font-semibold">{g.attWeighted.toFixed(2)}</span>
                        </td>

                        {/* Class Participation — × 10% */}
                        <td className="border border-gray-200 px-1 py-1 text-center bg-[#faf3e0] min-w-[48px]">
                          <div className="text-[#5e1724] font-medium">{g.projGrade.toFixed(2)}</div>
                          <AssignmentPopover student={student} updateField={updateField} projGrade={g.projGrade} projWeighted={g.projWeighted} />
                        </td>
                        <td className="border border-gray-200 px-1 py-1 text-center bg-[#faf3e0]">
                          <span className="text-[#7a1e33] font-semibold">{g.projWeighted.toFixed(2)}</span>
                        </td>

                        {/* Quizzes/Assignments — Avg | × 50% */}
                        <td className="border border-gray-200 px-1 py-1 text-center bg-[#faf3e0] min-w-[48px]">
                          <div className="text-[#5e1724] font-medium">{g.quizAvg.toFixed(2)}</div>
                          <QuizPopover student={student} updateField={updateField} quizAvg={g.quizAvg} quizWeighted={g.quizWeighted} />
                        </td>
                        <td className="border border-gray-200 px-1 py-1 text-center bg-[#faf3e0]">
                          <span className="text-[#7a1e33] font-semibold">{g.quizWeighted.toFixed(2)}</span>
                        </td>

                        {/* Projects / Research Activities — Avg | × 30% */}
                        <td className="border border-gray-200 px-1 py-1 text-center bg-[#faf3e0] min-w-[48px]">
                          <div className="text-[#5e1724] font-medium">{g.raAvg.toFixed(2)}</div>
                          <RAPopover student={student} updateField={updateField} raAvg={g.raAvg} raWeighted={g.raWeighted} />
                        </td>
                        <td className="border border-gray-200 px-1 py-1 text-center bg-[#faf3e0]">
                          <span className="text-[#7a1e33] font-semibold">{g.raWeighted.toFixed(2)}</span>
                        </td>

                        {/* Major Exam — Score % | × 30% */}
                        <td className="border border-gray-200 px-1 py-1 text-center bg-[#faf3e0] min-w-[64px]">
                          <div className="text-[#5e1724] font-medium">
                            {student.majorExam.tps > 0 ? `${((student.majorExam.raw / student.majorExam.tps) * 100).toFixed(2)}` : '—'}
                          </div>
                          <MajorExamPopover student={student} updateField={updateField} majorWeighted={g.majorWeighted} />
                        </td>
                        <td className="border border-gray-200 px-1 py-1 text-center bg-[#faf3e0]">
                          <span className="text-[#7a1e33] font-semibold">{g.majorWeighted.toFixed(2)}</span>
                        </td>

                        {/* Final Grade */}
                        <td className={`border border-gray-200 px-2 py-1 text-center bg-[#f5e6c8] font-bold ${g.finaleGrade >= 75 ? 'text-emerald-700' : g.finaleGrade > 0 ? 'text-red-600' : 'text-[#7a1e33]/40'}`}>
                          {g.finaleGrade > 0 ? g.finaleGrade.toFixed(2) : '—'}
                        </td>
                        {/* GWA */}
                        <td className={`border border-gray-200 px-2 py-1 text-center bg-[#faf3e0] font-semibold ${g.finaleGrade > 0 ? 'text-[#7a1e33]' : 'text-[#7a1e33]/40'}`}>
                          {g.finaleGrade > 0 ? g.gradesLabel : '—'}
                        </td>
                        {/* Remarks */}
                        <td className={`border border-gray-200 px-2 py-1 text-center text-[10px] font-bold ${g.remarks === 'PASSED' ? 'text-emerald-700' : g.finaleGrade > 0 ? 'text-red-600' : 'text-[#7a1e33]/40'}`}>
                          {g.finaleGrade > 0 ? g.remarks : '—'}
                        </td>

                        {/* Actions */}
                        <td className="border border-gray-200 px-1 py-1 text-center">
                          <button
                            onClick={() => setDeleteModal(student)}
                            className="p-1 text-gray-300 hover:text-red-500 transition-colors rounded"
                            title="Remove student"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={16} className="py-12 text-center text-gray-400 text-sm">
                        No students yet.{' '}
                        <button onClick={() => setAddModal(true)} className="text-[#7a1e33] hover:underline">
                          Add a student
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Per-student score entry */}
          {students.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm">Individual Score Entry</h3>
              <div className="space-y-4">
                {displayStudents.map((student, idx) => (
                  <StudentScoreCard
                    key={student.id}
                    student={student}
                    idx={idx}
                    updateField={updateField}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STUDENTS TAB */}
      {activeTab === 'students' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Student List</h2>
            <button
              onClick={() => setAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#7a1e33] text-white text-sm font-medium rounded-lg hover:bg-[#96283f] transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Student
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student, idx) => {
              const g = computeGrades(student)
              return (
                <div key={student.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{student.lastName}, {student.firstName} {student.mi}.</div>
                      <div className="text-xs text-gray-400">{student.studentNo}</div>
                    </div>
                    <div className={`text-lg font-bold ${g.finaleGrade >= 75 ? 'text-emerald-600' : g.finaleGrade > 0 ? 'text-red-500' : 'text-gray-300'}`}>
                      {g.finaleGrade > 0 ? g.finaleGrade : '—'}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] text-gray-500">
                    <div className="bg-gray-50 rounded p-1.5 text-center">
                      <div className="font-semibold text-gray-700">{computeAttendanceGrade(student.attendance).toFixed(0)}%</div>
                      <div>Attendance</div>
                    </div>
                    <div className="bg-gray-50 rounded p-1.5 text-center">
                      <div className="font-semibold text-gray-700">{g.classPerformance.toFixed(1)}</div>
                      <div>Class Perf.</div>
                    </div>
                    <div className="bg-gray-50 rounded p-1.5 text-center">
                      <div className="font-semibold text-gray-700">{g.gradesLabel}</div>
                      <div>GWA</div>
                    </div>
                  </div>
                  <div className={`mt-2 text-center text-xs font-bold rounded py-1 ${
                    g.remarks === 'PASSED' ? 'bg-emerald-50 text-emerald-600' : g.finaleGrade > 0 ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'
                  }`}>
                    {g.finaleGrade > 0 ? g.remarks : 'No grades yet'}
                  </div>
                  <button
                    onClick={() => setDeleteModal(student)}
                    className="mt-2 w-full text-xs text-gray-400 hover:text-red-500 flex items-center justify-center gap-1 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Remove Student
                  </button>
                </div>
              )
            })}
            {students.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No students enrolled.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CLASS INFO TAB */}
      {activeTab === 'info' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
          <h2 className="font-semibold text-gray-800 mb-4">Class Information</h2>
          <div className="space-y-3">
            {[
              { label: 'Class Name', value: cls.name },
              { label: 'Subject Code', value: cls.code },
              { label: 'Section', value: cls.section },
              { label: 'Class Type', value: cls.classType },
              { label: 'Academic Year', value: cls.academicYear },
              { label: 'Year Level', value: cls.yearLevel },
              { label: 'Term', value: cls.semester },
              { label: 'Faculty Assigned', value: cls.faculty },
              { label: 'Schedule', value: cls.schedule },
              { label: 'Room', value: cls.room },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="w-40 text-sm text-gray-500 flex-shrink-0">{label}</div>
                <div className="text-sm text-gray-900 font-medium">{value || '—'}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t-2 border-[#e8d9b0]">
            <div className="bg-gradient-to-br from-[#faf3e0] via-[#f5e6c8] to-[#fae4a0] rounded-xl border-2 border-[#c8a45d] shadow-md overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#7a1e33] to-[#96283f] text-white">
                <Calculator className="w-4 h-4" />
                <h3 className="font-bold text-sm uppercase tracking-wide">Grading Formula</h3>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <div className="text-[10px] font-bold text-[#7a1e33] uppercase tracking-wider mb-2">Class Performance Components</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { label: 'Attendance', weight: '10%' },
                      { label: 'Class Participation', weight: '10%' },
                      { label: 'Quizzes / Exercises', weight: '30%' },
                      { label: 'Research / RA', weight: '50%' },
                    ].map(({ label, weight }) => (
                      <div key={label} className="flex items-center justify-between bg-white/70 border border-[#e8d9b0] rounded-lg px-3 py-2">
                        <span className="text-[#7a1e33] font-medium">{label}</span>
                        <span className="font-bold text-[#5e1724] bg-[#fdf0c4] border border-[#d4a94a] rounded px-1.5 py-0.5 text-[10px]">× {weight}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 px-3 py-2 bg-white/60 border border-dashed border-[#c8a45d] rounded-lg">
                  <span className="text-[10px] font-bold text-[#7a1e33] uppercase tracking-wider">Sum</span>
                  <span className="text-xs text-[#7a1e33] font-semibold">= Class Performance (out of 100)</span>
                </div>

                <div className="rounded-lg border-2 border-[#7a1e33] bg-white overflow-hidden">
                  <div className="px-3 py-2 bg-[#7a1e33] text-white text-[10px] font-bold uppercase tracking-wider">Finale Grade</div>
                  <div className="p-3 flex items-center justify-center gap-2 text-xs text-[#3d0f18] font-semibold flex-wrap">
                    <span className="bg-[#faf3e0] border border-[#c8a45d] rounded px-2 py-1">Class Perf × 70%</span>
                    <span className="text-[#7a1e33] font-bold">+</span>
                    <span className="bg-[#faf3e0] border border-[#c8a45d] rounded px-2 py-1">Major Exam × 30%</span>
                    <span className="text-[#7a1e33] font-bold">=</span>
                    <span className="bg-gradient-to-r from-[#7a1e33] to-[#96283f] text-white rounded px-2 py-1 font-bold shadow">Finale</span>
                  </div>
                </div>

                <div className="text-[10px] text-[#7a1e33]/70 text-center italic pt-1">Passing threshold: 75 · Remarks auto-update per student.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {addModal && (
        <div className="fixed inset-0 bg-[#3d0f18]/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#faf3e0] rounded-2xl shadow-2xl w-full max-w-md border-2 border-[#c8a45d] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#7a1e33] to-[#96283f] text-white">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <h2 className="font-semibold">Add Student</h2>
              </div>
              <button onClick={() => setAddModal(false)} className="p-1.5 rounded hover:bg-white/10 text-white/90"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4 bg-[#faf3e0]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#7a1e33] mb-1.5 block uppercase tracking-wide">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-[#fdf0c4] focus:outline-none focus:ring-2 transition-colors ${formErrors.lastName ? 'border-red-400 focus:ring-red-300' : 'border-[#d4a94a] focus:ring-[#c8a45d] focus:border-[#c8a45d]'}`}
                    value={newStudentForm.lastName}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, lastName: e.target.value })}
                    placeholder="e.g., DELA CRUZ"
                  />
                  {formErrors.lastName && <div className="text-xs text-red-500 mt-1">{formErrors.lastName}</div>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#7a1e33] mb-1.5 block uppercase tracking-wide">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-[#fdf0c4] focus:outline-none focus:ring-2 transition-colors ${formErrors.firstName ? 'border-red-400 focus:ring-red-300' : 'border-[#d4a94a] focus:ring-[#c8a45d] focus:border-[#c8a45d]'}`}
                    value={newStudentForm.firstName}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, firstName: e.target.value })}
                    placeholder="e.g., JUAN PEDRO"
                  />
                  {formErrors.firstName && <div className="text-xs text-red-500 mt-1">{formErrors.firstName}</div>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#7a1e33] mb-1.5 block uppercase tracking-wide">M.I.</label>
                  <input
                    className="w-full px-3 py-2 border border-[#d4a94a] bg-[#fdf0c4] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45d] focus:border-[#c8a45d]"
                    value={newStudentForm.mi}
                    maxLength={2}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, mi: e.target.value })}
                    placeholder="e.g., D"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#7a1e33] mb-1.5 block uppercase tracking-wide">Student No.</label>
                  <input
                    className="w-full px-3 py-2 border border-[#d4a94a] bg-[#fdf0c4] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45d] focus:border-[#c8a45d]"
                    value={newStudentForm.studentNo}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, studentNo: e.target.value })}
                    placeholder="e.g., 2025-0001"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end px-6 py-4 bg-[#f5e6c8] border-t-2 border-[#e8d9b0]">
              <button onClick={() => setAddModal(false)} className="px-4 py-2 text-sm border border-[#c8a45d] bg-[#faf3e0] text-[#7a1e33] rounded-lg hover:bg-[#fae4a0] font-medium transition-colors">Cancel</button>
              <button onClick={handleAddStudent} className="px-4 py-2 text-sm bg-[#7a1e33] text-white rounded-lg hover:bg-[#96283f] font-semibold shadow-sm transition-colors">Add Student</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteModal && (
        <div className="fixed inset-0 bg-[#3d0f18]/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#faf3e0] rounded-2xl shadow-2xl w-full max-w-sm border-2 border-[#c8a45d] overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-[#7a1e33] to-[#96283f] text-white">
              <AlertCircle className="w-4 h-4" />
              <h2 className="font-semibold">Remove Student</h2>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-[#f5e6c8] border-2 border-[#d4a94a] flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-[#7a1e33]" />
                </div>
                <div>
                  <p className="text-sm text-[#3d0f18]">
                    Remove <strong className="text-[#7a1e33]">{deleteModal.lastName}, {deleteModal.firstName}</strong> from this class?
                  </p>
                  <p className="text-xs text-[#7a1e33]/70 mt-1">All grades and records for this student will be permanently deleted.</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end px-6 py-4 bg-[#f5e6c8] border-t-2 border-[#e8d9b0]">
              <button onClick={() => setDeleteModal(null)} className="px-4 py-2 text-sm border border-[#c8a45d] bg-[#faf3e0] text-[#7a1e33] rounded-lg hover:bg-[#fae4a0] font-medium transition-colors">Cancel</button>
              <button onClick={() => { deleteStudent(deleteModal.id); setDeleteModal(null) }} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold shadow-sm transition-colors">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Attendance popover
function AttendancePopover({ student, updateField }: { student: Student; updateField: (id: string, path: string[], value: any) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="text-[10px] text-[#7a1e33] hover:underline block w-full text-center font-medium">
        edit
      </button>
      {open && (
        <div className="absolute z-40 top-full left-0 bg-[#faf3e0] border-2 border-[#c8a45d] rounded-xl shadow-xl p-3 min-w-[240px]">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#e8d9b0]">
            <span className="text-xs font-bold text-[#7a1e33] uppercase tracking-wide">Attendance · 6 Weeks</span>
            <button onClick={() => setOpen(false)} className="text-[#7a1e33] hover:bg-[#f5e6c8] rounded p-0.5"><X className="w-3 h-3" /></button>
          </div>
          {student.attendance.map((att, wi) => (
            <div key={wi} className="flex items-center gap-2 py-1">
              <span className="text-xs text-[#7a1e33] font-semibold w-14">Week {att.week}</span>
              <input
                type="date"
                value={att.date}
                onChange={(e) => {
                  const upd = [...student.attendance]
                  upd[wi] = { ...upd[wi], date: e.target.value }
                  updateField(student.id, ['attendance'], upd)
                }}
                className="text-xs border border-[#d4a94a] bg-[#fdf0c4] rounded px-1 py-0.5 flex-1 focus:outline-none focus:ring-1 focus:ring-[#c8a45d]"
              />
              <select
                value={att.status}
                onChange={(e) => {
                  const upd = [...student.attendance]
                  upd[wi] = { ...upd[wi], status: e.target.value as 'P' | 'A' | 'L' }
                  updateField(student.id, ['attendance'], upd)
                }}
                className="text-xs border border-[#d4a94a] bg-[#fdf0c4] rounded px-1 py-0.5 w-12 font-semibold text-[#7a1e33] focus:outline-none focus:ring-1 focus:ring-[#c8a45d]"
              >
                <option value="P">P</option>
                <option value="A">A</option>
                <option value="L">L</option>
              </select>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-[#e8d9b0] text-[10px] text-[#7a1e33]/70 font-medium">P = Present · A = Absent · L = Late</div>
        </div>
      )}
    </div>
  )
}

// Quiz popover
function QuizPopover({ student, updateField, quizAvg, quizWeighted }: {
  student: Student
  updateField: (id: string, path: string[], value: any) => void
  quizAvg: number
  quizWeighted: number
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="text-[10px] text-[#7a1e33] hover:underline block w-full text-center font-medium">
        edit
      </button>
      {open && (
        <div className="absolute z-40 top-full left-0 bg-[#faf3e0] border-2 border-[#c8a45d] rounded-xl shadow-xl p-3 min-w-[260px] text-left">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#e8d9b0]">
            <span className="text-xs font-bold text-[#7a1e33] uppercase tracking-wide">Quizzes/Assignments</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => updateField(student.id, ['quizzes'], [...student.quizzes, { rs: 0, ts: 100, qe: 0 }])}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-[#7a1e33] bg-[#fdf0c4] border border-[#d4a94a] rounded hover:bg-[#fae4a0] transition-colors"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
              <button onClick={() => setOpen(false)} className="text-[#7a1e33] hover:bg-[#f5e6c8] rounded p-0.5"><X className="w-3 h-3" /></button>
            </div>
          </div>
          {student.quizzes.length === 0 && (
            <div className="text-[10px] text-[#7a1e33]/60 italic py-2 text-center">No quizzes yet.</div>
          )}
          {student.quizzes.map((q, qi) => {
            const pct = q.ts > 0 ? (q.rs / q.ts) * 100 : 0
            return (
            <div key={qi} className="flex items-center gap-2 mb-1.5">
              <span className="text-xs text-[#7a1e33] font-medium w-10">#{qi + 1}</span>
              <div className="flex items-center gap-1 flex-1">
                <input type="number" min={0} value={q.rs || ''}
                  onChange={(e) => { const upd = [...student.quizzes]; upd[qi] = { ...upd[qi], rs: parseFloat(e.target.value) || 0 }; updateField(student.id, ['quizzes'], upd) }}
                  className="w-14 text-xs border border-[#d4a94a] bg-[#fdf0c4] rounded px-1 py-1 text-center focus:outline-none focus:ring-1 focus:ring-[#c8a45d]"
                  placeholder="Score" />
                <span className="text-[#7a1e33] font-bold text-xs">/</span>
                <input type="number" min={0} value={q.ts || ''}
                  onChange={(e) => { const upd = [...student.quizzes]; upd[qi] = { ...upd[qi], ts: parseFloat(e.target.value) || 0 }; updateField(student.id, ['quizzes'], upd) }}
                  className="w-14 text-xs border border-[#d4a94a] bg-[#fdf0c4] rounded px-1 py-1 text-center focus:outline-none focus:ring-1 focus:ring-[#c8a45d]"
                  placeholder="Total" />
                <span className="text-[10px] text-[#7a1e33]/70 w-10 text-right">{q.ts > 0 ? `${pct.toFixed(0)}%` : '—'}</span>
              </div>
              <button
                type="button"
                onClick={() => updateField(student.id, ['quizzes'], student.quizzes.filter((_, i) => i !== qi))}
                className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                title={`Remove quiz #${qi + 1}`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )})}
          <div className="mt-2 text-xs font-semibold text-[#7a1e33] bg-[#f5e6c8] border border-[#e8d9b0] rounded px-2 py-1.5">
            Quizzes/Assignments Grade: <span className="font-bold">{quizAvg.toFixed(2)}%</span> → <span className="font-bold">{quizWeighted.toFixed(2)}</span> <span className="text-[#7a1e33]/70 text-[10px]">(50%)</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Class Participation popover
function AssignmentPopover({ student, updateField, projGrade, projWeighted }: {
  student: Student
  updateField: (id: string, path: string[], value: any) => void
  projGrade: number
  projWeighted: number
}) {
  const [open, setOpen] = useState(false)
  const value = student.project[0] ?? 0
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="text-[10px] text-[#7a1e33] hover:underline block w-full text-center font-medium">
        edit
      </button>
      {open && (
        <div className="absolute z-40 top-full left-0 bg-[#faf3e0] border-2 border-[#c8a45d] rounded-xl shadow-xl p-3 min-w-[260px] text-left">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#e8d9b0]">
            <span className="text-xs font-bold text-[#7a1e33] uppercase tracking-wide">Class Participation</span>
            <button onClick={() => setOpen(false)} className="text-[#7a1e33] hover:bg-[#f5e6c8] rounded p-0.5"><X className="w-3 h-3" /></button>
          </div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs text-[#7a1e33] font-medium w-16">Grade</span>
            <input
              type="number"
              min={0}
              max={100}
              value={value || ''}
              onChange={(e) => updateField(student.id, ['project'], [parseFloat(e.target.value) || 0])}
              className="flex-1 text-xs border border-[#d4a94a] bg-[#fdf0c4] rounded px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-[#c8a45d]"
              placeholder="0-100"
            />
          </div>
          <div className="mt-2 text-xs font-semibold text-[#7a1e33] bg-[#f5e6c8] border border-[#e8d9b0] rounded px-2 py-1.5">
            Class Participation Grade: <span className="font-bold">{projGrade.toFixed(2)}%</span> → <span className="font-bold">{projWeighted.toFixed(2)}</span> <span className="text-[#7a1e33]/70 text-[10px]">(10%)</span>
          </div>
        </div>
      )}
    </div>
  )
}

// RA popover
function RAPopover({ student, updateField, raAvg, raWeighted }: {
  student: Student
  updateField: (id: string, path: string[], value: any) => void
  raAvg: number
  raWeighted: number
}) {
  const [open, setOpen] = useState(false)
  const [totals, setTotals] = useState<Record<number, number>>({})
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="text-[10px] text-[#7a1e33] hover:underline block w-full text-center font-medium">
        edit
      </button>
      {open && (
        <div className="absolute z-40 top-full left-0 bg-[#faf3e0] border-2 border-[#c8a45d] rounded-xl shadow-xl p-3 min-w-[260px] text-left">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#e8d9b0]">
            <span className="text-xs font-bold text-[#7a1e33] uppercase tracking-wide">Projects / Research Activities</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => updateField(student.id, ['ra'], [...student.ra, 0])}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-[#7a1e33] bg-[#fdf0c4] border border-[#d4a94a] rounded hover:bg-[#fae4a0] transition-colors"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
              <button onClick={() => setOpen(false)} className="text-[#7a1e33] hover:bg-[#f5e6c8] rounded p-0.5"><X className="w-3 h-3" /></button>
            </div>
          </div>
          {student.ra.length === 0 && (
            <div className="text-[10px] text-[#7a1e33]/60 italic py-2 text-center">No projects/research activities yet.</div>
          )}
          {student.ra.map((r, ri) => (
            <div key={ri} className="flex items-center gap-2 mb-1.5">
              <span className="text-xs text-[#7a1e33] font-medium w-10">#{ri + 1}</span>
              <div className="flex items-center gap-1 flex-1">
                <input type="number" min={0} value={r || ''}
                  onChange={(e) => { const upd = [...student.ra]; upd[ri] = parseFloat(e.target.value) || 0; updateField(student.id, ['ra'], upd) }}
                  className="w-14 text-xs border border-[#d4a94a] bg-[#fdf0c4] rounded px-1 py-1 text-center focus:outline-none focus:ring-1 focus:ring-[#c8a45d]"
                  placeholder="Score" />
                <span className="text-[#7a1e33] font-bold text-xs">/</span>
                <input type="number" min={0} value={totals[ri] ?? 100}
                  onChange={(e) => setTotals({ ...totals, [ri]: parseFloat(e.target.value) || 0 })}
                  className="w-14 text-xs border border-[#d4a94a] bg-[#fdf0c4] rounded px-1 py-1 text-center focus:outline-none focus:ring-1 focus:ring-[#c8a45d]"
                  placeholder="Total" />
              </div>
              <button
                type="button"
                onClick={() => updateField(student.id, ['ra'], student.ra.filter((_, i) => i !== ri))}
                className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                title={`Remove project/research activity #${ri + 1}`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          <div className="mt-2 text-xs font-semibold text-[#7a1e33] bg-[#f5e6c8] border border-[#e8d9b0] rounded px-2 py-1.5">
            Projects/RA Grade: <span className="font-bold">{raAvg.toFixed(2)}%</span> → <span className="font-bold">{raWeighted.toFixed(2)}</span> <span className="text-[#7a1e33]/70 text-[10px]">(30%)</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Major Exam popover
function MajorExamPopover({ student, updateField, majorWeighted }: {
  student: Student
  updateField: (id: string, path: string[], value: any) => void
  majorWeighted: number
}) {
  const [open, setOpen] = useState(false)
  const raw = student.majorExam.raw || 0
  const tps = student.majorExam.tps || 0
  const pct = tps > 0 ? (raw / tps) * 100 : 0
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="text-[10px] text-[#7a1e33] hover:underline block w-full text-center font-medium">
        edit
      </button>
      {open && (
        <div className="absolute z-40 top-full left-0 bg-[#faf3e0] border-2 border-[#c8a45d] rounded-xl shadow-xl p-3 min-w-[260px] text-left">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#e8d9b0]">
            <span className="text-xs font-bold text-[#7a1e33] uppercase tracking-wide">Major Exam</span>
            <button onClick={() => setOpen(false)} className="text-[#7a1e33] hover:bg-[#f5e6c8] rounded p-0.5"><X className="w-3 h-3" /></button>
          </div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs text-[#7a1e33] font-medium w-10">Exam</span>
            <div className="flex items-center gap-1 flex-1">
              <input type="number" min={0} value={student.majorExam.raw || ''}
                onChange={(e) => updateField(student.id, ['majorExam', 'raw'], parseFloat(e.target.value) || 0)}
                className="w-14 text-xs border border-[#d4a94a] bg-[#fdf0c4] rounded px-1 py-1 text-center focus:outline-none focus:ring-1 focus:ring-[#c8a45d]"
                placeholder="Score" />
              <span className="text-[#7a1e33] font-bold text-xs">/</span>
              <input type="number" min={0} value={student.majorExam.tps || ''}
                onChange={(e) => updateField(student.id, ['majorExam', 'tps'], parseFloat(e.target.value) || 0)}
                className="w-14 text-xs border border-[#d4a94a] bg-[#fdf0c4] rounded px-1 py-1 text-center focus:outline-none focus:ring-1 focus:ring-[#c8a45d]"
                placeholder="Total" />
              <span className="text-[10px] text-[#7a1e33]/70 w-10 text-right">{tps > 0 ? `${pct.toFixed(0)}%` : '—'}</span>
            </div>
          </div>
          <div className="mt-2 text-xs font-semibold text-[#7a1e33] bg-[#f5e6c8] border border-[#e8d9b0] rounded px-2 py-1.5">
            Major Exam Grade: <span className="font-bold">{pct.toFixed(2)}%</span> → <span className="font-bold">{majorWeighted.toFixed(2)}</span> <span className="text-[#7a1e33]/70 text-[10px]">(30%)</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Individual student full score entry card
function StudentScoreCard({ student, idx, updateField }: {
  student: Student
  idx: number
  updateField: (id: string, path: string[], value: any) => void
}) {
  const [open, setOpen] = useState(false)
  const [totals, setTotals] = useState<{
    ra: Record<number, number>
    project: Record<number, number>
    majorExam: number
  }>({ ra: {}, project: {}, majorExam: 100 })
  const g = computeGrades(student)

  return (
    <div className="bg-white rounded-xl border-2 border-[#e8d9b0] overflow-hidden shadow-sm hover:border-[#c8a45d] transition-colors">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${open ? 'bg-gradient-to-r from-[#7a1e33] to-[#96283f] text-white' : 'hover:bg-[#faf3e0]'}`}
      >
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${open ? 'bg-white/20 text-white' : 'bg-[#faf3e0] text-[#7a1e33]'}`}>{idx + 1}</span>
          <div className="text-left">
            <div className={`text-sm font-semibold ${open ? 'text-white' : 'text-gray-900'}`}>{student.lastName}, {student.firstName} {student.mi}.</div>
            <div className={`text-xs ${open ? 'text-white/70' : 'text-gray-400'}`}>{student.studentNo}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`text-lg font-bold ${
            open
              ? g.finaleGrade >= 75 ? 'text-[#fdf0c4]' : g.finaleGrade > 0 ? 'text-[#f5e6c8]' : 'text-white/40'
              : g.finaleGrade >= 75 ? 'text-emerald-600' : g.finaleGrade > 0 ? 'text-red-500' : 'text-gray-300'
          }`}>
            {g.finaleGrade > 0 ? g.finaleGrade : '—'}
          </div>
          <Pencil className={`w-4 h-4 transition-transform ${open ? 'text-white rotate-90' : 'text-[#c8a45d]'}`} />
        </div>
      </button>

      {open && (
        <div className="border-t-2 border-[#c8a45d] p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-[#faf3e0]/40">
          {/* Attendance */}
          <div className="bg-white rounded-lg border border-[#e8d9b0] p-3">
            <div className="text-[10px] font-bold text-[#7a1e33] mb-2 uppercase tracking-wider flex items-center gap-1.5 pb-1.5 border-b border-[#e8d9b0]">
              <Users className="w-3 h-3" /> Attendance
            </div>
            {student.attendance.map((att, wi) => (
              <div key={wi} className="flex items-center gap-2 mb-1.5">
                <span className="text-xs text-[#7a1e33] font-medium w-14 flex-shrink-0">Week {att.week}</span>
                <input
                  type="date" value={att.date}
                  onChange={(e) => {
                    const upd = [...student.attendance]; upd[wi] = { ...upd[wi], date: e.target.value }
                    updateField(student.id, ['attendance'], upd)
                  }}
                  className="flex-1 text-xs border border-[#d4a94a] bg-[#fdf0c4] rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#c8a45d]"
                />
                <select
                  value={att.status}
                  onChange={(e) => {
                    const upd = [...student.attendance]; upd[wi] = { ...upd[wi], status: e.target.value as any }
                    updateField(student.id, ['attendance'], upd)
                  }}
                  className={`text-xs border rounded px-1.5 py-1 w-14 font-semibold ${att.status === 'P' ? 'border-green-300 text-green-700 bg-green-50' : att.status === 'A' ? 'border-red-300 text-red-600 bg-red-50' : 'border-amber-300 text-amber-600 bg-amber-50'}`}
                >
                  <option value="P">P</option>
                  <option value="A">A</option>
                  <option value="L">L</option>
                </select>
              </div>
            ))}
            <div className="mt-2 text-xs font-semibold text-[#7a1e33] bg-[#f5e6c8] border border-[#e8d9b0] rounded px-2 py-1.5">
              Attendance Grade: <span className="font-bold">{computeAttendanceGrade(student.attendance).toFixed(2)}%</span> → <span className="font-bold">{g.attWeighted.toFixed(2)}</span> <span className="text-[#7a1e33]/70 text-[10px]">(10%)</span>
            </div>
          </div>

          {/* Class Participation + Quizzes/Assignments */}
          <div className="bg-white rounded-lg border border-[#e8d9b0] p-3">
            <div className="text-[10px] font-bold text-[#7a1e33] mb-2 uppercase tracking-wider flex items-center gap-1.5 pb-1.5 border-b border-[#e8d9b0]">
              <ClipboardList className="w-3 h-3" /> Class Participation &amp; Quizzes/Assignments
            </div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-[#7a1e33] uppercase tracking-wider">Class Participation</span>
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs text-[#7a1e33] font-medium w-16">Grade</span>
              <input
                type="number"
                min={0}
                max={100}
                value={(student.project[0] ?? 0) || ''}
                onChange={(e) => updateField(student.id, ['project'], [parseFloat(e.target.value) || 0])}
                className="flex-1 text-xs border border-[#d4a94a] bg-[#fdf0c4] rounded px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-[#c8a45d]"
                placeholder="0-100"
              />
            </div>
            <div className="mb-3 mt-2 text-xs font-semibold text-[#7a1e33] bg-[#f5e6c8] border border-[#e8d9b0] rounded px-2 py-1.5">
              Class Participation Grade: <span className="font-bold">{g.projGrade.toFixed(2)}%</span> → <span className="font-bold">{g.projWeighted.toFixed(2)}</span> <span className="text-[#7a1e33]/70 text-[10px]">(10%)</span>
            </div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-[#7a1e33] uppercase tracking-wider">Quizzes/Assignments</span>
              <button
                type="button"
                onClick={() => updateField(student.id, ['quizzes'], [...student.quizzes, { rs: 0, ts: 100, qe: 0 }])}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-[#7a1e33] bg-[#fdf0c4] border border-[#d4a94a] rounded hover:bg-[#fae4a0] transition-colors"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            {student.quizzes.length === 0 && (
              <div className="text-[10px] text-[#7a1e33]/60 italic py-2 text-center">No quizzes yet.</div>
            )}
            {student.quizzes.map((q, qi) => (
              <div key={qi} className="flex items-center gap-2 mb-1.5">
                <span className="text-xs text-[#7a1e33] font-medium w-10">#{qi + 1}</span>
                <div className="flex items-center gap-1 flex-1">
                  <input type="number" min={0} value={q.rs || ''}
                    onChange={(e) => { const upd = [...student.quizzes]; upd[qi] = { ...upd[qi], rs: parseFloat(e.target.value) || 0 }; updateField(student.id, ['quizzes'], upd) }}
                    className="w-14 text-xs border border-[#d4a94a] bg-[#fdf0c4] rounded px-1 py-1 text-center focus:outline-none focus:ring-1 focus:ring-[#c8a45d]"
                    placeholder="Score" />
                  <span className="text-[#7a1e33] font-bold text-xs">/</span>
                  <input type="number" min={0} value={q.ts || ''}
                    onChange={(e) => { const upd = [...student.quizzes]; upd[qi] = { ...upd[qi], ts: parseFloat(e.target.value) || 0 }; updateField(student.id, ['quizzes'], upd) }}
                    className="w-14 text-xs border border-[#d4a94a] bg-[#fdf0c4] rounded px-1 py-1 text-center focus:outline-none focus:ring-1 focus:ring-[#c8a45d]"
                    placeholder="Total" />
                  <span className="text-[10px] text-[#7a1e33]/70 w-10 text-right">{q.ts > 0 ? `${((q.rs / q.ts) * 100).toFixed(0)}%` : '—'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => updateField(student.id, ['quizzes'], student.quizzes.filter((_, i) => i !== qi))}
                  className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title={`Remove quiz #${qi + 1}`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            <div className="mt-2 text-xs font-semibold text-[#7a1e33] bg-[#f5e6c8] border border-[#e8d9b0] rounded px-2 py-1.5">
              Quizzes/Assignments Grade: <span className="font-bold">{g.quizAvg.toFixed(2)}%</span> → <span className="font-bold">{g.quizWeighted.toFixed(2)}</span> <span className="text-[#7a1e33]/70 text-[10px]">(50%)</span>
            </div>
          </div>

          {/* Projects/Research, Major */}
          <div className="bg-white rounded-lg border border-[#e8d9b0] p-3">
            <div className="text-[10px] font-bold text-[#7a1e33] mb-2 uppercase tracking-wider flex items-center gap-1.5 pb-1.5 border-b border-[#e8d9b0]">
              <BookOpen className="w-3 h-3" /> Projects/Research &amp; Major Exam
            </div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-[#7a1e33] uppercase tracking-wider">Projects / Research Activities</span>
              <button
                type="button"
                onClick={() => updateField(student.id, ['ra'], [...student.ra, 0])}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-[#7a1e33] bg-[#fdf0c4] border border-[#d4a94a] rounded hover:bg-[#fae4a0] transition-colors"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            {student.ra.length === 0 && (
              <div className="text-[10px] text-[#7a1e33]/60 italic py-2 text-center">No projects/research activities yet.</div>
            )}
            {student.ra.map((r, ri) => (
              <div key={ri} className="flex items-center gap-2 mb-1.5">
                <span className="text-xs text-[#7a1e33] font-medium w-10">#{ri + 1}</span>
                <div className="flex items-center gap-1 flex-1">
                  <input type="number" min={0} value={r || ''}
                    onChange={(e) => { const upd = [...student.ra]; upd[ri] = parseFloat(e.target.value) || 0; updateField(student.id, ['ra'], upd) }}
                    className="w-14 text-xs border border-[#d4a94a] bg-[#fdf0c4] rounded px-1 py-1 text-center focus:outline-none focus:ring-1 focus:ring-[#c8a45d]"
                    placeholder="Score" />
                  <span className="text-[#7a1e33] font-bold text-xs">/</span>
                  <input type="number" min={0} value={totals.ra[ri] ?? 100}
                    onChange={(e) => setTotals({ ...totals, ra: { ...totals.ra, [ri]: parseFloat(e.target.value) || 0 } })}
                    className="w-14 text-xs border border-[#d4a94a] bg-[#fdf0c4] rounded px-1 py-1 text-center focus:outline-none focus:ring-1 focus:ring-[#c8a45d]"
                    placeholder="Total" />
                </div>
                <button
                  type="button"
                  onClick={() => updateField(student.id, ['ra'], student.ra.filter((_, i) => i !== ri))}
                  className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors ml-auto"
                  title={`Remove project/research activity #${ri + 1}`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            <div className="mb-3 mt-2 text-xs font-semibold text-[#7a1e33] bg-[#f5e6c8] border border-[#e8d9b0] rounded px-2 py-1.5">
              Projects/RA Grade: <span className="font-bold">{g.raAvg.toFixed(2)}%</span> → <span className="font-bold">{g.raWeighted.toFixed(2)}</span> <span className="text-[#7a1e33]/70 text-[10px]">(30%)</span>
            </div>
            <div className="mt-3 text-[10px] font-bold text-[#7a1e33] uppercase tracking-wider">Major Exam</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-[#7a1e33] font-medium w-10">Score</span>
              <div className="flex items-center gap-1">
                <input type="number" min={0} value={student.majorExam.raw || ''}
                  onChange={(e) => updateField(student.id, ['majorExam', 'raw'], parseFloat(e.target.value) || 0)}
                  className="w-14 text-xs border border-[#d4a94a] bg-[#fdf0c4] rounded px-1 py-1 text-center focus:outline-none focus:ring-1 focus:ring-[#c8a45d]"
                  placeholder="Score" />
                <span className="text-[#7a1e33] font-bold text-xs">/</span>
                <input type="number" min={0} value={student.majorExam.tps || ''}
                  onChange={(e) => updateField(student.id, ['majorExam', 'tps'], parseFloat(e.target.value) || 0)}
                  className="w-14 text-xs border border-[#d4a94a] bg-[#fdf0c4] rounded px-1 py-1 text-center focus:outline-none focus:ring-1 focus:ring-[#c8a45d]"
                  placeholder="Total" />
              </div>
            </div>
            <div className="mt-2 text-xs font-semibold text-[#7a1e33] bg-[#f5e6c8] border border-[#e8d9b0] rounded px-2 py-1.5">
              Major Exam Grade: <span className="font-bold">{(student.majorExam.tps > 0 ? (student.majorExam.raw / student.majorExam.tps) * 100 : 0).toFixed(2)}%</span> → <span className="font-bold">{g.majorWeighted.toFixed(2)}</span> <span className="text-[#7a1e33]/70 text-[10px]">(30%)</span>
            </div>

            {/* Summary */}
            <div className="mt-3 p-3 bg-gradient-to-br from-[#faf3e0] to-[#f5e6c8] rounded-lg border-2 border-[#c8a45d] shadow-inner">
              <div className="text-[10px] text-[#7a1e33] space-y-1">
                <div className="flex justify-between"><span>Class Perf:</span><span className="font-bold">{g.classPerformance.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>× 70%:</span><span className="font-bold">{g.classGrade70.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Major × 30%:</span><span className="font-bold">{g.majorWeighted.toFixed(2)}</span></div>
                <div className={`mt-2 pt-2 border-t border-[#c8a45d] font-bold text-xs flex justify-between items-center ${g.finaleGrade >= 75 ? 'text-emerald-700' : 'text-red-600'}`}>
                  <span>FINALE:</span>
                  <span>{g.finaleGrade > 0 ? g.finaleGrade : '—'} ({g.gradesLabel}) · {g.remarks}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
