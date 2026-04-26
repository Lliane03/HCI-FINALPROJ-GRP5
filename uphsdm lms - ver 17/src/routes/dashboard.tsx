import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  BookOpen,
  Users,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import { useClasses, useStudents, studentIdentityKey } from '../lib/store'
import { computeGrades, getPeriodData } from '../lib/grading'

type Term = '1st Semester' | '2nd Semester' | '3rd Semester' | 'Summer'
type Period = 'Prelim' | 'Midterm' | 'Finals'
type AcademicYear = '2025-2026' | '2026-2027' | '2027-2028'

const TERMS: Term[] = ['1st Semester', '2nd Semester', '3rd Semester', 'Summer']
const PERIODS: Period[] = ['Prelim', 'Midterm', 'Finals']
const ACADEMIC_YEARS: AcademicYear[] = ['2025-2026', '2026-2027', '2027-2028']

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [term, setTerm] = useState<Term>('1st Semester')
  const [period, setPeriod] = useState<Period>('Prelim')
  const [academicYear, setAcademicYear] = useState<AcademicYear>('2025-2026')
  const { classes: allClasses } = useClasses()
  const { students: allStudents } = useStudents()

  // Total Classes syncs with the Classes route by matching term + academic year.
  // Period is tracked on grades, not on the class itself, so it doesn't filter here.
  const classes = allClasses.filter(
    (c) => c.semester === term && c.academicYear === academicYear,
  )
  // Per-period grade data: reshape each student with the selected period's
  // grade sheet so computeGrades reads the right bucket (Prelim top-level,
  // Midterm/Finals from gradesMidterm/gradesFinals).
  const filteredClassIds = new Set(classes.map((c) => c.id))
  const studentsInScope = allStudents.filter((s) => filteredClassIds.has(s.classId))
  // Total Students counts unique students assigned to any class matching the
  // selected term + academic year. A student enrolled in multiple classes for
  // the same term is counted once, deduped by shared profile identity.
  const totalStudents = (() => {
    const seen = new Set<string>()
    for (const s of studentsInScope) {
      const key = studentIdentityKey(s)
      if (seen.has(key)) continue
      seen.add(key)
    }
    return seen.size
  })()
  const students = studentsInScope.map((s) => ({ ...s, ...getPeriodData(s, period) }))

  useEffect(() => {
    setMounted(true)
    const update = () => setIsDark(document.documentElement.classList.contains('hci-dark'))
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const auth = (() => {
    try {
      return JSON.parse(localStorage.getItem('lms_auth') || '{}')
    } catch {
      return {}
    }
  })()

  // Grade distribution across all students
  const gradeDist = { passed: 0, failed: 0, excellent: 0, avg: 0 }
  let gradeSum = 0
  let gradeCount = 0
  students.forEach((s) => {
    const g = computeGrades(s)
    if (g.finaleGrade > 0) {
      gradeCount++
      gradeSum += g.finaleGrade
      if (g.finaleGrade >= 90) gradeDist.excellent++
      if (g.finaleGrade >= 75) gradeDist.passed++
      else gradeDist.failed++
    }
  })
  gradeDist.avg = gradeCount > 0 ? Math.round(gradeSum / gradeCount) : 0
  const hasGradeData = gradeCount > 0

  const gradeLabels = ['1.00', '1.25', '1.50', '1.75', '2.00', '2.25', '2.50', '2.75', '3.00', '5.00']
  const gradeBuckets: Record<string, number> = {}
  gradeLabels.forEach((l) => (gradeBuckets[l] = 0))
  students.forEach((s) => {
    const g = computeGrades(s)
    if (g.finaleGrade > 0) {
      const label = g.gradesLabel
      if (gradeBuckets[label] !== undefined) gradeBuckets[label]++
    }
  })

  // Palette-aware colors — lifted shades in dark mode so canvas charts stay legible.
  const palette = isDark
    ? {
        burgundy: 'rgba(220,140,155,0.95)',
        burgundyBorder: 'rgba(240,170,185,1)',
        gold: 'rgba(240,200,100,0.95)',
        goldBorder: 'rgba(250,215,130,1)',
        fail: 'rgba(248,113,113,0.95)',
        text: '#e2e8f0',
        grid: 'rgba(148,163,184,0.25)',
      }
    : {
        burgundy: 'rgba(107,15,26,0.9)',
        burgundyBorder: 'rgba(107,15,26,1)',
        gold: 'rgba(212,175,55,0.95)',
        goldBorder: 'rgba(180,145,40,1)',
        fail: 'rgba(185,28,28,0.9)',
        text: '#4a0b13',
        grid: 'rgba(107,15,26,0.12)',
      }

  const barData = {
    labels: gradeLabels,
    datasets: [
      {
        label: 'Students',
        data: gradeLabels.map((l) => gradeBuckets[l]),
        backgroundColor: gradeLabels.map((l) => (l === '5.00' ? palette.fail : palette.burgundy)),
        borderColor: gradeLabels.map((l) => (l === '5.00' ? palette.fail : palette.burgundyBorder)),
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  }

  const doughnutData = {
    labels: ['Passed', 'Failed'],
    datasets: [
      {
        data: [gradeDist.passed, gradeDist.failed],
        backgroundColor: [palette.gold, palette.burgundy],
        borderColor: [palette.goldBorder, palette.burgundyBorder],
        borderWidth: 2,
      },
    ],
  }

  const chartOptionsCommon = {
    plugins: {
      legend: {
        labels: { color: palette.text, font: { weight: 500 as const } },
      },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#4a0b13',
        titleColor: isDark ? '#fde68a' : '#F5E6C8',
        bodyColor: isDark ? '#e2e8f0' : '#FFF8E7',
        borderColor: isDark ? '#8a6d1e' : '#D4AF37',
        borderWidth: 1,
      },
    },
  }

  const stats = [
    { label: 'Total Classes', value: classes.length, icon: BookOpen, bg: 'bg-[#6B0F1A]', iconColor: 'text-[#FFF8E7]', link: '/classes' },
    { label: 'Total Students', value: totalStudents, icon: Users, bg: 'bg-[#D4AF37]', iconColor: 'text-[#6B0F1A]', link: '/students' },
    { label: 'Class Average', value: gradeDist.avg > 0 ? `${gradeDist.avg}%` : 'N/A', icon: TrendingUp, bg: 'bg-[#D4AF37]', iconColor: 'text-[#6B0F1A]', link: '/dashboard' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f9f5ea] via-white to-[#f9f5ea]">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#6B0F1A]">Welcome, {auth.name?.split(' ')[0] || 'Faculty'}!</h1>
          <p className="text-gray-600 text-sm mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-2">
            <span>Here's an overview of your classes and student performance of</span>
            <select
              aria-label="Term"
              value={term}
              onChange={(e) => setTerm(e.target.value as Term)}
              className="rounded-md border border-[#D4AF37]/60 bg-white px-2 py-0.5 text-xs font-medium text-[#6B0F1A] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            >
              {TERMS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <span>,</span>
            <select
              aria-label="Period"
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              className="rounded-md border border-[#D4AF37]/60 bg-white px-2 py-0.5 text-xs font-medium text-[#6B0F1A] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            >
              {PERIODS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <span>of Academic Year</span>
            <select
              aria-label="Academic Year"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value as AcademicYear)}
              className="rounded-md border border-[#D4AF37]/60 bg-white px-2 py-0.5 text-xs font-medium text-[#6B0F1A] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            >
              {ACADEMIC_YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <span>.</span>
          </p>
          {!hasGradeData && (
            <p className="text-xs text-gray-500 mt-2 italic">
              No data yet for {term}, {period} of Academic Year {academicYear}. Grades and students haven't been recorded for this period.
            </p>
          )}
          <div className="mt-3 h-0.5 w-20 rounded bg-[#D4AF37]" />
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              to={stat.link as any}
              className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 hover:shadow-md hover:border-[#D4AF37] transition-all border border-[#D4AF37]/30"
            >
              <div className={`${stat.bg} p-2.5 rounded-lg flex-shrink-0 shadow-sm`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-xs text-gray-600">{stat.label}</p>
                <p className="text-xl font-bold text-[#6B0F1A]">{stat.value}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Performance indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-[#D4AF37]/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FFF8E7] border border-[#D4AF37]/40 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <div className="text-xs text-gray-600">Passed Students</div>
              <div className="text-2xl font-bold text-[#6B0F1A]">{gradeDist.passed}</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-[#D4AF37]/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="text-xs text-gray-600">Failed Students</div>
              <div className="text-2xl font-bold text-red-600">{gradeDist.failed}</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-[#D4AF37]/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#6B0F1A] flex items-center justify-center flex-shrink-0 shadow-sm">
              <TrendingUp className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <div className="text-xs text-gray-600">Excellent (90+)</div>
              <div className="text-2xl font-bold text-[#6B0F1A]">{gradeDist.excellent}</div>
            </div>
          </div>
        </div>

        {/* Charts */}
        {mounted && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-5 border border-[#D4AF37]/30">
              <h2 className="text-base font-semibold text-[#6B0F1A] mb-4 flex items-center gap-2">
                <span className="inline-block w-1.5 h-4 rounded-sm bg-[#D4AF37]" />
                Grade Distribution
              </h2>
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  plugins: {
                    ...chartOptionsCommon.plugins,
                    legend: { display: false },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { stepSize: 1, color: palette.text },
                      grid: { color: palette.grid },
                    },
                    x: {
                      ticks: { color: palette.text },
                      grid: { color: palette.grid },
                    },
                  },
                }}
              />
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-[#D4AF37]/30">
              <h2 className="text-base font-semibold text-[#6B0F1A] mb-4 flex items-center gap-2">
                <span className="inline-block w-1.5 h-4 rounded-sm bg-[#D4AF37]" />
                Pass/Fail Overview
              </h2>
              <div className="max-w-xs mx-auto">
                <Doughnut
                  data={doughnutData}
                  options={{
                    responsive: true,
                    plugins: {
                      ...chartOptionsCommon.plugins,
                      legend: { position: 'bottom', labels: { color: palette.text, font: { weight: 500 as const } } },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Recent Classes */}
        <div className="bg-white rounded-xl shadow-sm border border-[#D4AF37]/30 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#D4AF37]/30 bg-[#FFF8E7]">
            <h2 className="font-semibold text-[#6B0F1A] flex items-center gap-2">
              <span className="inline-block w-1.5 h-4 rounded-sm bg-[#D4AF37]" />
              My Classes
            </h2>
            <Link to="/classes" className="text-sm text-[#6B0F1A] hover:text-[#8B1A2B] hover:underline flex items-center gap-1 font-medium">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-[#D4AF37]/20">
            {classes.slice(0, 5).map((cls) => {
              const studentCount = students.filter((s) => s.classId === cls.id).length
              return (
                <Link
                  key={cls.id}
                  to={`/classes/${cls.id}` as any}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-[#fdf8ec] transition-colors"
                >
                  <div>
                    <div className="font-medium text-[#6B0F1A] text-sm">{cls.name}</div>
                    <div className="text-xs text-gray-500">{cls.section} · {cls.semester}</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                    {studentCount} students
                  </div>
                </Link>
              )
            })}
            {classes.length === 0 && (
              <div className="px-5 py-8 text-center text-gray-500 text-sm">
                No classes recorded for {term}, Academic Year {academicYear}.{' '}
                <Link to="/classes" className="text-[#6B0F1A] hover:text-[#8B1A2B] hover:underline font-medium">Create one</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
