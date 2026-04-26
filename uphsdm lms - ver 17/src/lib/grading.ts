import type { ExamPeriod, PeriodGrades, Student } from './types'

export function emptyPeriodGrades(): PeriodGrades {
  return {
    attendance: Array.from({ length: 6 }, (_, i) => ({
      week: i + 1,
      date: '',
      status: 'P' as const,
    })),
    classParticipation: 0,
    quizzes: Array.from({ length: 4 }, () => ({ rs: 0, ts: 100, qe: 0 })),
    ra: [0, 0, 0, 0],
    project: [0, 0, 0, 0],
    majorExam: { raw: 0, tps: 0 },
  }
}

export function getPeriodData(student: Student, period: ExamPeriod): PeriodGrades {
  if (period === 'Prelim') {
    return {
      attendance: student.attendance,
      classParticipation: student.classParticipation,
      quizzes: student.quizzes,
      ra: student.ra,
      project: student.project,
      majorExam: student.majorExam,
    }
  }
  const stored = period === 'Midterm' ? student.gradesMidterm : student.gradesFinals
  return stored ?? emptyPeriodGrades()
}

export const ATTENDANCE_TOTAL_SESSIONS = 6

export function computeAttendanceGrade(attendance: Student['attendance']): number {
  if (!attendance || attendance.length === 0) return 0
  const presentCount = attendance.filter((a) => a.status === 'P').length
  return (presentCount / ATTENDANCE_TOTAL_SESSIONS) * 100
}

export function computeGrades(student: Student) {
  // Attendance: 10%
  const attGrade = computeAttendanceGrade(student.attendance)
  const attWeighted = attGrade * 0.1

  // Class Participation: 10%
  const cpWeighted = (student.classParticipation || 0) * 0.1

  // Quizzes: compute each entry's percentage from (Score / TotalScore) × 100,
  // average those percentages, then weight by 50%.
  const quizPercentages = student.quizzes
    .filter((q) => q.ts > 0)
    .map((q) => (q.rs / q.ts) * 100)
  const quizAvg =
    quizPercentages.length > 0
      ? quizPercentages.reduce((s, p) => s + p, 0) / quizPercentages.length
      : 0
  const quizWeighted = quizAvg * 0.5

  // Projects / Research Activities average: 30%
  const validRA = student.ra.filter((r) => r > 0)
  const raAvg =
    validRA.length > 0
      ? validRA.reduce((s, r) => s + r, 0) / validRA.length
      : 0
  const raWeighted = raAvg * 0.3

  // Assignments average: 10%
  const validP = student.project.filter((p) => p > 0)
  const projGrade =
    validP.length > 0
      ? validP.reduce((s, p) => s + p, 0) / validP.length
      : 0
  const projWeighted = projGrade * 0.1

  // Class Performance (Attendance 10% + Quizzes 50% + Assignments 10% + Projects/RA 30% = 100%)
  const classPerformance = attWeighted + quizWeighted + projWeighted + raWeighted

  // Final = Class Performance × 70% + Major Exam × 30%
  const classGrade70 = classPerformance * 0.7
  const examRaw = student.majorExam.raw || 0
  const examTotal = student.majorExam.tps || 0
  const majorWeighted = examTotal > 0 ? (examRaw / examTotal) * 100 * 0.3 : 0
  const finaleRaw = Math.min(classGrade70 + majorWeighted, 100)
  const finaleGrade = Math.round(finaleRaw)

  return {
    attGrade,
    attWeighted,
    cpWeighted,
    quizAvg,
    quizWeighted,
    raAvg,
    raWeighted,
    classPerformance,
    classGrade70,
    projGrade,
    projWeighted,
    majorWeighted,
    finaleRaw,
    finaleGrade,
    gradesLabel: transmute(finaleGrade),
    remarks: finaleGrade >= 75 ? 'PASSED' : 'FAILED',
  }
}

export function transmute(score: number): string {
  if (score >= 97) return '1.00'
  if (score >= 94) return '1.25'
  if (score >= 91) return '1.50'
  if (score >= 88) return '1.75'
  if (score >= 85) return '2.00'
  if (score >= 82) return '2.25'
  if (score >= 79) return '2.50'
  if (score >= 76) return '2.75'
  if (score >= 75) return '3.00'
  if (score > 0) return '5.00'
  return '-'
}
