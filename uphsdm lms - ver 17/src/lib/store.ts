import { useState, useEffect, useCallback } from 'react'
import type { Class, Student, Assignment, SubmissionStatus } from './types'

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function studentIdentityKey(
  s: Pick<Student, 'studentNo' | 'lastName' | 'firstName' | 'mi'>,
) {
  const num = (s.studentNo || '').trim()
  if (num) return `num:${num.toLowerCase()}`
  return `name:${s.lastName}|${s.firstName}|${s.mi}`.toLowerCase()
}

function makeDefaultStudent(classId: string, no: number): Student {
  return {
    id: genId(),
    classId,
    studentNo: `2025-${String(no).padStart(4, '0')}`,
    lastName: '',
    firstName: '',
    mi: '',
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

const SAMPLE_CLASS_ID = 'cls-demo-001'

const SAMPLE_CLASSES: Class[] = [
  {
    id: SAMPLE_CLASS_ID,
    name: 'Human Computer Interaction 1',
    code: 'BSCS 2207',
    section: '9408-AY225',
    classType: 'LEC',
    academicYear: '2025-2026',
    semester: '1st Semester',
    yearLevel: '2nd Year',
    faculty: 'HOMER T. FAVENIR',
    schedule: 'MWF 8:00 AM - 9:00 AM',
    room: 'M-209',
    createdAt: new Date().toISOString(),
  },
]

const SAMPLE_STUDENTS: Student[] = [
  {
    id: 'stu-001',
    classId: SAMPLE_CLASS_ID,
    studentNo: '2025-0001',
    lastName: 'ANDAYA',
    firstName: 'JOHN BENEDICT',
    mi: 'G',
    yearLevel: '2nd Year',
    collegeProgram: 'BSCS-DS',
    academicYear: '2025-2026',
    attendance: [
      { week: 1, date: '2/1/2025', status: 'A' },
      { week: 2, date: '2/15/2025', status: 'P' },
      { week: 3, date: '3/1/2025', status: 'P' },
      { week: 4, date: '3/15/2025', status: 'P' },
      { week: 5, date: '4/1/2025', status: 'P' },
      { week: 6, date: '4/15/2025', status: 'P' },
    ],
    classParticipation: 100,
    quizzes: [
      { rs: 100, ts: 100, qe: 100 },
      { rs: 100, ts: 100, qe: 100 },
      { rs: 100, ts: 100, qe: 100 },
      { rs: 100, ts: 100, qe: 100 },
    ],
    ra: [90, 90, 90, 90],
    project: [100, 100, 100, 100],
    majorExam: { raw: 90, tps: 90 },
  },
  {
    id: 'stu-002',
    classId: SAMPLE_CLASS_ID,
    studentNo: '2025-0002',
    lastName: 'ARNAIZ',
    firstName: 'SAMUEL ANGELO',
    mi: 'M',
    yearLevel: '2nd Year',
    collegeProgram: 'BSCS-DS',
    academicYear: '2025-2026',
    attendance: [
      { week: 1, date: '2/1/2025', status: 'P' },
      { week: 2, date: '2/15/2025', status: 'P' },
      { week: 3, date: '3/1/2025', status: 'P' },
      { week: 4, date: '3/15/2025', status: 'P' },
      { week: 5, date: '4/1/2025', status: 'P' },
      { week: 6, date: '4/15/2025', status: 'P' },
    ],
    classParticipation: 90,
    quizzes: [
      { rs: 90, ts: 100, qe: 90 },
      { rs: 90, ts: 100, qe: 90 },
      { rs: 90, ts: 100, qe: 90 },
      { rs: 90, ts: 100, qe: 90 },
    ],
    ra: [80, 80, 80, 80],
    project: [90, 90, 90, 90],
    majorExam: { raw: 80, tps: 100 },
  },
  {
    id: 'stu-003',
    classId: SAMPLE_CLASS_ID,
    studentNo: '2025-0003',
    lastName: 'BAGAYAS',
    firstName: 'BOBSON ROB',
    mi: 'V',
    yearLevel: '2nd Year',
    collegeProgram: 'BSCS-DS',
    academicYear: '2025-2026',
    attendance: [
      { week: 1, date: '2/1/2025', status: 'A' },
      { week: 2, date: '2/15/2025', status: 'P' },
      { week: 3, date: '3/1/2025', status: 'P' },
      { week: 4, date: '3/15/2025', status: 'P' },
      { week: 5, date: '4/1/2025', status: 'P' },
      { week: 6, date: '4/15/2025', status: 'P' },
    ],
    classParticipation: 50,
    quizzes: [
      { rs: 80, ts: 100, qe: 80 },
      { rs: 80, ts: 100, qe: 80 },
      { rs: 80, ts: 100, qe: 80 },
      { rs: 80, ts: 100, qe: 80 },
    ],
    ra: [70, 70, 70, 70],
    project: [80, 80, 80, 80],
    majorExam: { raw: 65, tps: 100 },
  },
]

const SAMPLE_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asgn-001',
    classId: SAMPLE_CLASS_ID,
    title: 'Odoo Studio',
    type: 'Assignment',
    description: 'Create an Odoo account and make sure to complete your personal details.',
    dueDate: '2025-04-15',
    dueTime: '23:59',
    term: '1st Semester',
    period: 'Midterm',
    academicYear: '2025-2026',
    maxScore: 100,
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'asgn-002',
    classId: SAMPLE_CLASS_ID,
    title: 'Research Assignment 1 - User Analysis',
    type: 'Research',
    description: 'Conduct a user needs analysis for a chosen application',
    dueDate: '2025-03-01',
    term: '1st Semester',
    period: 'Prelim',
    academicYear: '2025-2026',
    maxScore: 100,
    status: 'Closed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'asgn-003',
    classId: SAMPLE_CLASS_ID,
    title: 'UI Design Project - Wireframes',
    type: 'Project',
    description: 'Create wireframes for a grading system UI',
    dueDate: '2025-01-28',
    term: '1st Semester',
    period: 'Prelim',
    academicYear: '2025-2026',
    maxScore: 100,
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'asgn-004',
    classId: SAMPLE_CLASS_ID,
    title: 'HCI - Prelim Examination',
    type: 'Exam',
    description: 'Covers Chapter 1 to 4',
    dueDate: '2025-02-02',
    dueTime: '23:59',
    term: '1st Semester',
    period: 'Prelim',
    academicYear: '2025-2026',
    maxScore: 100,
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
]

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function saveToStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

// Initialize sample data if not present
export function initSampleData() {
  if (typeof window === 'undefined') return
  if (!localStorage.getItem('lms_initialized')) {
    localStorage.setItem('lms_classes', JSON.stringify(SAMPLE_CLASSES))
    localStorage.setItem('lms_students', JSON.stringify(SAMPLE_STUDENTS))
    localStorage.setItem('lms_assignments', JSON.stringify(SAMPLE_ASSIGNMENTS))
    localStorage.setItem('lms_initialized', '1')
  }
  // One-time migration: refresh the demo class code/section to the new values.
  if (!localStorage.getItem('lms_sample_class_migrated_v2')) {
    try {
      const raw = localStorage.getItem('lms_classes')
      if (raw) {
        const list = JSON.parse(raw) as Class[]
        const updated = list.map((c) =>
          c.id === SAMPLE_CLASS_ID
            ? { ...c, code: 'BSCS 2207', section: '9408-AY225' }
            : c,
        )
        localStorage.setItem('lms_classes', JSON.stringify(updated))
      }
    } catch {
      // ignore
    }
    localStorage.setItem('lms_sample_class_migrated_v2', '1')
  }
  // One-time migration: backfill Term/Period on the 3 sample assignments.
  if (!localStorage.getItem('lms_sample_assignments_term_period_migrated_v1')) {
    try {
      const raw = localStorage.getItem('lms_assignments')
      if (raw) {
        const list = JSON.parse(raw) as Assignment[]
        const targetIds = new Set(['asgn-001', 'asgn-002', 'asgn-003'])
        const updated = list.map((a) =>
          targetIds.has(a.id)
            ? { ...a, term: '1st Semester' as const, period: 'Prelim' as const }
            : a,
        )
        localStorage.setItem('lms_assignments', JSON.stringify(updated))
      }
    } catch {
      // ignore
    }
    localStorage.setItem('lms_sample_assignments_term_period_migrated_v1', '1')
  }
  // One-time migration: backfill academicYear on the 3 sample assignments.
  if (!localStorage.getItem('lms_sample_assignments_academic_year_migrated_v1')) {
    try {
      const raw = localStorage.getItem('lms_assignments')
      if (raw) {
        const list = JSON.parse(raw) as Assignment[]
        const targetIds = new Set(['asgn-001', 'asgn-002', 'asgn-003'])
        const updated = list.map((a) =>
          targetIds.has(a.id)
            ? { ...a, academicYear: '2025-2026' as const }
            : a,
        )
        localStorage.setItem('lms_assignments', JSON.stringify(updated))
      }
    } catch {
      // ignore
    }
    localStorage.setItem('lms_sample_assignments_academic_year_migrated_v1', '1')
  }
  // One-time migration: set dueTime to 11:59 PM on the sample exam.
  if (!localStorage.getItem('lms_sample_exam_due_time_migrated_v1')) {
    try {
      const raw = localStorage.getItem('lms_assignments')
      if (raw) {
        const list = JSON.parse(raw) as Assignment[]
        const updated = list.map((a) =>
          a.id === 'asgn-001' ? { ...a, dueTime: '23:59' } : a,
        )
        localStorage.setItem('lms_assignments', JSON.stringify(updated))
      }
    } catch {
      // ignore
    }
    localStorage.setItem('lms_sample_exam_due_time_migrated_v1', '1')
  }
  // One-time migration: change the 3 sample students from 3rd Year to 2nd Year.
  if (!localStorage.getItem('lms_sample_students_year_migrated_v1')) {
    try {
      const raw = localStorage.getItem('lms_students')
      if (raw) {
        const list = JSON.parse(raw) as Student[]
        const targetIds = new Set(['stu-001', 'stu-002', 'stu-003'])
        const updated = list.map((s) =>
          targetIds.has(s.id) ? { ...s, yearLevel: '2nd Year' as const } : s,
        )
        localStorage.setItem('lms_students', JSON.stringify(updated))
      }
    } catch {
      // ignore
    }
    localStorage.setItem('lms_sample_students_year_migrated_v1', '1')
  }
  // One-time migration: backfill academicYear on the 3 sample students.
  if (!localStorage.getItem('lms_sample_students_academic_year_migrated_v1')) {
    try {
      const raw = localStorage.getItem('lms_students')
      if (raw) {
        const list = JSON.parse(raw) as Student[]
        const targetIds = new Set(['stu-001', 'stu-002', 'stu-003'])
        const updated = list.map((s) =>
          targetIds.has(s.id) ? { ...s, academicYear: '2025-2026' as const } : s,
        )
        localStorage.setItem('lms_students', JSON.stringify(updated))
      }
    } catch {
      // ignore
    }
    localStorage.setItem('lms_sample_students_academic_year_migrated_v1', '1')
  }
  // One-time migration: rename the sample exam title.
  if (!localStorage.getItem('lms_sample_exam_title_migrated_v1')) {
    try {
      const raw = localStorage.getItem('lms_assignments')
      if (raw) {
        const list = JSON.parse(raw) as Assignment[]
        const updated = list.map((a) =>
          a.id === 'asgn-001' && a.title === 'Quiz 1 - HCI Fundamentals'
            ? { ...a, title: 'HCI - Prelim Examination' }
            : a,
        )
        localStorage.setItem('lms_assignments', JSON.stringify(updated))
      }
    } catch {
      // ignore
    }
    localStorage.setItem('lms_sample_exam_title_migrated_v1', '1')
  }
  // One-time migration: rename the sample exam to 'HCI Fundamentals' and set status to Active.
  if (!localStorage.getItem('lms_sample_exam_title_status_migrated_v2')) {
    try {
      const raw = localStorage.getItem('lms_assignments')
      if (raw) {
        const list = JSON.parse(raw) as Assignment[]
        const updated = list.map((a) =>
          a.id === 'asgn-001'
            ? { ...a, title: 'HCI Fundamentals', status: 'Active' as const }
            : a,
        )
        localStorage.setItem('lms_assignments', JSON.stringify(updated))
      }
    } catch {
      // ignore
    }
    localStorage.setItem('lms_sample_exam_title_status_migrated_v2', '1')
  }
  // One-time migration: add the HCI - Prelim Examination sample exam.
  if (!localStorage.getItem('lms_sample_prelim_exam_added_v1')) {
    try {
      const raw = localStorage.getItem('lms_assignments')
      if (raw) {
        const list = JSON.parse(raw) as Assignment[]
        if (!list.some((a) => a.id === 'asgn-004')) {
          list.push({
            id: 'asgn-004',
            classId: SAMPLE_CLASS_ID,
            title: 'HCI - Prelim Examination',
            type: 'Exam',
            description: 'Covers Chapter 1 to 4',
            dueDate: '2025-02-02',
            dueTime: '23:59',
            term: '1st Semester',
            period: 'Prelim',
            academicYear: '2025-2026',
            maxScore: 100,
            status: 'Active',
            createdAt: new Date().toISOString(),
          })
          localStorage.setItem('lms_assignments', JSON.stringify(list))
        }
      }
    } catch {
      // ignore
    }
    localStorage.setItem('lms_sample_prelim_exam_added_v1', '1')
  }
  // One-time migration: convert the first sample activity into the Odoo Studio assignment.
  if (!localStorage.getItem('lms_sample_activity_odoo_studio_migrated_v1')) {
    try {
      const raw = localStorage.getItem('lms_assignments')
      if (raw) {
        const list = JSON.parse(raw) as Assignment[]
        const updated = list.map((a) =>
          a.id === 'asgn-001'
            ? {
                ...a,
                title: 'Odoo Studio',
                type: 'Assignment' as const,
                description:
                  'Create an Odoo account and make sure to complete your personal details.',
                dueDate: '2025-04-15',
                period: 'Midterm' as const,
                status: 'Active' as const,
              }
            : a,
        )
        localStorage.setItem('lms_assignments', JSON.stringify(updated))
      }
    } catch {
      // ignore
    }
    localStorage.setItem('lms_sample_activity_odoo_studio_migrated_v1', '1')
  }
  // One-time migration: convert the sample Prelim Examination from 'Quiz' to 'Exam'
  // so it only appears on the Exams page and not on the Activities page.
  if (!localStorage.getItem('lms_sample_prelim_exam_type_migrated_v1')) {
    try {
      const raw = localStorage.getItem('lms_assignments')
      if (raw) {
        const list = JSON.parse(raw) as Assignment[]
        const updated = list.map((a) =>
          a.id === 'asgn-004' && a.type === 'Quiz'
            ? { ...a, type: 'Exam' as const }
            : a,
        )
        localStorage.setItem('lms_assignments', JSON.stringify(updated))
      }
    } catch {
      // ignore
    }
    localStorage.setItem('lms_sample_prelim_exam_type_migrated_v1', '1')
  }
  // One-time migration: set default Prelim major exam total (tps) to 100 for
  // Arnaiz (stu-002) and Bagayas (stu-003) so the displayed scores read
  // 80/100 and 70/100 respectively.
  if (!localStorage.getItem('lms_sample_major_exam_tps_migrated_v1')) {
    try {
      const raw = localStorage.getItem('lms_students')
      if (raw) {
        const list = JSON.parse(raw) as Student[]
        const updated = list.map((s) => {
          if (s.id === 'stu-002') {
            return { ...s, majorExam: { ...s.majorExam, raw: 80, tps: 100 } }
          }
          if (s.id === 'stu-003') {
            return { ...s, majorExam: { ...s.majorExam, raw: 70, tps: 100 } }
          }
          return s
        })
        localStorage.setItem('lms_students', JSON.stringify(updated))
      }
    } catch {
      // ignore
    }
    localStorage.setItem('lms_sample_major_exam_tps_migrated_v1', '1')
  }
  // One-time migration: set Bagayas (stu-003) Prelim Class Participation to 50
  // and Major Exam to 65/100.
  if (!localStorage.getItem('lms_sample_bagayas_prelim_defaults_migrated_v1')) {
    try {
      const raw = localStorage.getItem('lms_students')
      if (raw) {
        const list = JSON.parse(raw) as Student[]
        const updated = list.map((s) =>
          s.id === 'stu-003'
            ? {
                ...s,
                classParticipation: 50,
                majorExam: { ...s.majorExam, raw: 65, tps: 100 },
              }
            : s,
        )
        localStorage.setItem('lms_students', JSON.stringify(updated))
      }
    } catch {
      // ignore
    }
    localStorage.setItem('lms_sample_bagayas_prelim_defaults_migrated_v1', '1')
  }
}

export function useClasses() {
  const [classes, setClasses] = useState<Class[]>(() =>
    loadFromStorage('lms_classes', SAMPLE_CLASSES),
  )

  const save = useCallback((updated: Class[]) => {
    setClasses(updated)
    saveToStorage('lms_classes', updated)
  }, [])

  const addClass = useCallback(
    (cls: Omit<Class, 'id' | 'createdAt'>) => {
      const newCls: Class = { ...cls, id: genId(), createdAt: new Date().toISOString() }
      save([...classes, newCls])
      return newCls
    },
    [classes, save],
  )

  const updateClass = useCallback(
    (id: string, updates: Partial<Class>) => {
      save(classes.map((c) => (c.id === id ? { ...c, ...updates } : c)))
    },
    [classes, save],
  )

  const deleteClass = useCallback(
    (id: string) => {
      save(classes.filter((c) => c.id !== id))
    },
    [classes, save],
  )

  return { classes, addClass, updateClass, deleteClass }
}

export function useStudents(classId?: string) {
  const [students, setStudents] = useState<Student[]>(() =>
    loadFromStorage('lms_students', SAMPLE_STUDENTS),
  )

  const filtered = classId ? students.filter((s) => s.classId === classId) : students

  const save = useCallback((updater: (prev: Student[]) => Student[]) => {
    setStudents((prev) => {
      const updated = updater(prev)
      saveToStorage('lms_students', updated)
      return updated
    })
  }, [])

  const addStudent = useCallback(
    (classId: string, initialData?: Partial<Pick<Student, 'lastName' | 'firstName' | 'mi' | 'studentNo' | 'yearLevel' | 'collegeProgram' | 'academicYear'>>) => {
      save((prev) => {
        const takenNos = new Set(prev.map((s) => s.studentNo).filter(Boolean))
        let n = prev.length + 1
        let candidate = `2025-${String(n).padStart(4, '0')}`
        while (takenNos.has(candidate)) {
          n++
          candidate = `2025-${String(n).padStart(4, '0')}`
        }
        const newStu = makeDefaultStudent(classId, n)
        if (initialData) {
          if (initialData.lastName) newStu.lastName = initialData.lastName
          if (initialData.firstName) newStu.firstName = initialData.firstName
          if (initialData.mi !== undefined) newStu.mi = initialData.mi
          if (initialData.studentNo) newStu.studentNo = initialData.studentNo
          if (initialData.yearLevel) newStu.yearLevel = initialData.yearLevel
          if (initialData.collegeProgram) newStu.collegeProgram = initialData.collegeProgram
          if (initialData.academicYear) newStu.academicYear = initialData.academicYear
        }
        return [...prev, newStu]
      })
    },
    [save],
  )

  const addStudentToClasses = useCallback(
    (
      classIds: string[],
      initialData?: Partial<Pick<Student, 'lastName' | 'firstName' | 'mi' | 'studentNo' | 'yearLevel' | 'collegeProgram' | 'academicYear'>>,
    ) => {
      if (classIds.length === 0) return
      save((prev) => {
        const takenNos = new Set(prev.map((s) => s.studentNo).filter(Boolean))
        let sharedStudentNo = initialData?.studentNo?.trim() || ''
        if (!sharedStudentNo) {
          let n = prev.length + 1
          let candidate = `2025-${String(n).padStart(4, '0')}`
          while (takenNos.has(candidate)) {
            n++
            candidate = `2025-${String(n).padStart(4, '0')}`
          }
          sharedStudentNo = candidate
        }
        const records = classIds.map((cid) => {
          const newStu = makeDefaultStudent(cid, 0)
          newStu.studentNo = sharedStudentNo
          if (initialData) {
            if (initialData.lastName) newStu.lastName = initialData.lastName
            if (initialData.firstName) newStu.firstName = initialData.firstName
            if (initialData.mi !== undefined) newStu.mi = initialData.mi
            if (initialData.yearLevel) newStu.yearLevel = initialData.yearLevel
            if (initialData.collegeProgram) newStu.collegeProgram = initialData.collegeProgram
            if (initialData.academicYear) newStu.academicYear = initialData.academicYear
          }
          return newStu
        })
        return [...prev, ...records]
      })
    },
    [save],
  )

  const updateStudent = useCallback(
    (id: string, updates: Partial<Student>) => {
      save((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)))
    },
    [save],
  )

  const deleteStudent = useCallback(
    (id: string) => {
      save((prev) => prev.filter((s) => s.id !== id))
    },
    [save],
  )

  // Reconcile the set of class enrollments for a student (identified by `anchorId`)
  // with `classIds`. Shared profile fields are propagated to every matching record;
  // records whose class is no longer in the list are removed; classes that don't yet
  // have a record for this student get one.
  const syncStudentClasses = useCallback(
    (
      anchorId: string,
      classIds: string[],
      fields: Partial<
        Pick<
          Student,
          'lastName' | 'firstName' | 'mi' | 'studentNo' | 'yearLevel' | 'collegeProgram' | 'academicYear'
        >
      >,
    ) => {
      save((prev) => {
        const anchor = prev.find((s) => s.id === anchorId)
        if (!anchor) return prev
        const key = studentIdentityKey(anchor)
        const covered = new Set<string>()
        const next: Student[] = []
        for (const s of prev) {
          if (studentIdentityKey(s) !== key) {
            next.push(s)
            continue
          }
          if (!classIds.includes(s.classId)) continue
          next.push({ ...s, ...fields })
          covered.add(s.classId)
        }
        const missing = classIds.filter((cid) => !covered.has(cid))
        for (const cid of missing) {
          const newStu = makeDefaultStudent(cid, 0)
          const sharedNo = (fields.studentNo ?? anchor.studentNo ?? '').trim()
          if (sharedNo) newStu.studentNo = sharedNo
          if (fields.lastName !== undefined) newStu.lastName = fields.lastName
          if (fields.firstName !== undefined) newStu.firstName = fields.firstName
          if (fields.mi !== undefined) newStu.mi = fields.mi
          if (fields.yearLevel !== undefined) newStu.yearLevel = fields.yearLevel
          if (fields.collegeProgram !== undefined) newStu.collegeProgram = fields.collegeProgram
          if (fields.academicYear !== undefined) newStu.academicYear = fields.academicYear
          next.push(newStu)
        }
        return next
      })
    },
    [save],
  )

  return {
    students: filtered,
    allStudents: students,
    addStudent,
    addStudentToClasses,
    updateStudent,
    deleteStudent,
    syncStudentClasses,
  }
}

export function useAssignments(classId?: string) {
  const [assignments, setAssignments] = useState<Assignment[]>(() =>
    loadFromStorage('lms_assignments', SAMPLE_ASSIGNMENTS),
  )

  const filtered = classId
    ? assignments.filter((a) => a.classId === classId)
    : assignments

  const save = useCallback((updated: Assignment[]) => {
    setAssignments(updated)
    saveToStorage('lms_assignments', updated)
  }, [])

  const addAssignment = useCallback(
    (asgn: Omit<Assignment, 'id' | 'createdAt'>) => {
      const newA: Assignment = { ...asgn, id: genId(), createdAt: new Date().toISOString() }
      save([...assignments, newA])
      return newA
    },
    [assignments, save],
  )

  const updateAssignment = useCallback(
    (id: string, updates: Partial<Assignment>) => {
      save(assignments.map((a) => (a.id === id ? { ...a, ...updates } : a)))
    },
    [assignments, save],
  )

  const deleteAssignment = useCallback(
    (id: string) => {
      save(assignments.filter((a) => a.id !== id))
    },
    [assignments, save],
  )

  return { assignments: filtered, addAssignment, updateAssignment, deleteAssignment }
}

type SubmissionMap = Record<string, SubmissionStatus>

function submissionKey(studentId: string, assignmentId: string) {
  return `${studentId}::${assignmentId}`
}

export function useSubmissions() {
  const [submissions, setSubmissions] = useState<SubmissionMap>(() =>
    loadFromStorage<SubmissionMap>('lms_submissions', {}),
  )

  const getStatus = useCallback(
    (studentId: string, assignmentId: string): SubmissionStatus | undefined =>
      submissions[submissionKey(studentId, assignmentId)],
    [submissions],
  )

  const setStatus = useCallback(
    (
      studentId: string,
      assignmentId: string,
      status: SubmissionStatus | null,
    ) => {
      setSubmissions((prev) => {
        const key = submissionKey(studentId, assignmentId)
        const next: SubmissionMap = { ...prev }
        if (status === null) {
          delete next[key]
        } else {
          next[key] = status
        }
        saveToStorage('lms_submissions', next)
        return next
      })
    },
    [],
  )

  return { getStatus, setStatus }
}
