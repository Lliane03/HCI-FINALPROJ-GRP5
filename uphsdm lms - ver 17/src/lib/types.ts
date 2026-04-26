export interface AuthUser {
  username: string
  name: string
  role: string
}

export type ClassType = 'LAB' | 'LEC' | 'GEC'
export type Term = '1st Semester' | '2nd Semester' | '3rd Semester' | 'Summer'
export type Room = 'M-209' | 'M-210' | 'M-203' | 'IoT Lab'
export type AcademicYear = '2025-2026' | '2026-2027' | '2027-2028'

export interface Class {
  id: string
  name: string
  code: string
  section: string
  classType: ClassType | ''
  academicYear: AcademicYear | ''
  semester: string
  yearLevel: string
  faculty: string
  schedule: string
  room: string
  createdAt: string
}

export interface AttendanceRecord {
  week: number
  date: string
  status: 'P' | 'A' | 'L' // Present, Absent, Late
}

export interface QuizRecord {
  rs: number
  ts: number
  qe: number
}

export type YearLevel = '1st Year' | '2nd Year' | '3rd Year' | '4th Year' | '5th Year'
export type CollegeProgram = 'BSCS-DS' | 'BSIT-GD'

export interface PeriodGrades {
  attendance: AttendanceRecord[]
  classParticipation: number
  quizzes: QuizRecord[]
  ra: number[]
  project: number[]
  majorExam: { raw: number; tps: number }
}

export interface Student {
  id: string
  classId: string
  studentNo: string
  lastName: string
  firstName: string
  mi: string
  yearLevel?: YearLevel
  collegeProgram?: CollegeProgram
  academicYear?: AcademicYear
  // Top-level grade fields mirror the Prelim period so existing views
  // (dashboard, profile) keep reading the same shape.
  attendance: AttendanceRecord[]
  classParticipation: number
  quizzes: QuizRecord[]
  ra: number[]
  project: number[]
  majorExam: { raw: number; tps: number }
  // Per-period buckets for Midterm and Finals — edited independently of Prelim.
  gradesMidterm?: PeriodGrades
  gradesFinals?: PeriodGrades
  gradesSeenSignature?: string
}

export type ExamPeriod = 'Prelim' | 'Midterm' | 'Finals'

export type SubmissionStatus = 'done' | 'missed' | 'pending'

export interface Assignment {
  id: string
  classId: string
  title: string
  type: 'Assignment' | 'Quiz' | 'Project' | 'Research' | 'Recitation' | 'Exam'
  description: string
  dueDate: string
  dueTime?: string
  term?: Term
  period?: ExamPeriod
  academicYear?: AcademicYear
  maxScore: number
  status: 'Draft' | 'Active' | 'Closed'
  createdAt: string
}
