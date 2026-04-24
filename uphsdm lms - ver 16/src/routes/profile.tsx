import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Camera,
  Check,
  ChevronDown,
  Download,
  Eye,
  EyeOff,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Save,
  Trash2,
  User,
  Building2,
  Shield,
  AlertCircle,
} from 'lucide-react'
import type { Assignment, Class, Student } from '@/lib/types'
import { computeGrades, computeAttendanceGrade } from '@/lib/grading'
import { applyHciSettings } from '@/lib/hci'

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
})

type Address = {
  country: string
  street: string
  city: string
  province: string
}

type AuthUser = {
  username: string
  name: string
  role: string
  department?: string
  contactNumber?: string
  currentAddress?: Address
  permanentAddress?: Address
  sameAsCurrent?: boolean
}

type Account = AuthUser & { password: string }

const EMPTY_ADDRESS: Address = { country: '', street: '', city: '', province: '' }

const COUNTRIES = [
  'Australia',
  'Brazil',
  'Canada',
  'China',
  'France',
  'Germany',
  'India',
  'Indonesia',
  'Italy',
  'Japan',
  'Malaysia',
  'Mexico',
  'Netherlands',
  'New Zealand',
  'Philippines',
  'Saudi Arabia',
  'Singapore',
  'South Africa',
  'South Korea',
  'Spain',
  'Thailand',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Vietnam',
] as const

const COUNTRY_CODES = [
  { country: 'Australia', code: '+61' },
  { country: 'Brazil', code: '+55' },
  { country: 'Canada', code: '+1' },
  { country: 'China', code: '+86' },
  { country: 'France', code: '+33' },
  { country: 'Germany', code: '+49' },
  { country: 'India', code: '+91' },
  { country: 'Indonesia', code: '+62' },
  { country: 'Italy', code: '+39' },
  { country: 'Japan', code: '+81' },
  { country: 'Malaysia', code: '+60' },
  { country: 'Mexico', code: '+52' },
  { country: 'Netherlands', code: '+31' },
  { country: 'New Zealand', code: '+64' },
  { country: 'Philippines', code: '+63' },
  { country: 'Saudi Arabia', code: '+966' },
  { country: 'Singapore', code: '+65' },
  { country: 'South Africa', code: '+27' },
  { country: 'South Korea', code: '+82' },
  { country: 'Spain', code: '+34' },
  { country: 'Thailand', code: '+66' },
  { country: 'United Arab Emirates', code: '+971' },
  { country: 'United Kingdom', code: '+44' },
  { country: 'United States', code: '+1' },
  { country: 'Vietnam', code: '+84' },
] as const

const DEFAULT_COUNTRY_CODE = '+63'

function parseContactNumber(raw: string): { code: string; digits: string } {
  const value = (raw || '').trim()
  if (!value) return { code: DEFAULT_COUNTRY_CODE, digits: '' }
  const match = value.match(/^\+(\d{1,4})\s*(.*)$/)
  if (match) {
    const code = `+${match[1]}`
    const digits = match[2].replace(/\D/g, '')
    const known = COUNTRY_CODES.find((c) => c.code === code)
    if (known) return { code, digits }
    return { code: DEFAULT_COUNTRY_CODE, digits: value.replace(/\D/g, '') }
  }
  return { code: DEFAULT_COUNTRY_CODE, digits: value.replace(/\D/g, '') }
}

type Settings = {
  compactSidebar: boolean
  emailNotifications: boolean
  autoSaveGrades: boolean
  showGradeHints: boolean
  darkMode: boolean
  highContrast: boolean
  reduceMotion: boolean
  largeText: boolean
  dyslexiaFont: boolean
}

const DEFAULT_SETTINGS: Settings = {
  compactSidebar: false,
  emailNotifications: true,
  autoSaveGrades: true,
  showGradeHints: true,
  darkMode: false,
  highContrast: false,
  reduceMotion: false,
  largeText: false,
  dyslexiaFont: false,
}

const DATA_KEYS = [
  'lms_classes',
  'lms_students',
  'lms_assignments',
  'lms_initialized',
] as const

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJSON(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

function ProfilePage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [auth, setAuth] = useState<AuthUser | null>(null)
  const [name, setName] = useState('')
  const [contactCode, setContactCode] = useState<string>(DEFAULT_COUNTRY_CODE)
  const [contactDigits, setContactDigits] = useState('')
  const [currentAddress, setCurrentAddress] = useState<Address>(EMPTY_ADDRESS)
  const [permanentAddress, setPermanentAddress] = useState<Address>(EMPTY_ADDRESS)
  const [sameAsCurrent, setSameAsCurrent] = useState(false)
  const [avatar, setAvatar] = useState<string>('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem('lms_auth')
    if (!raw) {
      navigate({ to: '/login' })
      return
    }
    try {
      const u = JSON.parse(raw) as AuthUser
      setAuth(u)
      setName(u.name || '')
      const parsed = parseContactNumber(u.contactNumber || '')
      setContactCode(parsed.code)
      setContactDigits(parsed.digits)
      setCurrentAddress({ ...EMPTY_ADDRESS, ...(u.currentAddress || {}) })
      setPermanentAddress({ ...EMPTY_ADDRESS, ...(u.permanentAddress || {}) })
      setSameAsCurrent(Boolean(u.sameAsCurrent))
    } catch {
      navigate({ to: '/login' })
      return
    }
    const storedSettings = readJSON<Settings>('lms_settings', DEFAULT_SETTINGS)
    const merged = { ...DEFAULT_SETTINGS, ...storedSettings }
    setSettings(merged)
    applyHciSettings(merged)
  }, [])

  useEffect(() => {
    if (!auth) return
    const key = `lms_avatar_${auth.username}`
    setAvatar(localStorage.getItem(key) || '')
  }, [auth])

  useEffect(() => {
    if (sameAsCurrent) {
      setPermanentAddress(currentAddress)
    }
  }, [sameAsCurrent, currentAddress])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(t)
  }, [toast])

  if (!auth) return null

  function flash(type: 'success' | 'error', msg: string) {
    setToast({ type, msg })
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      flash('error', 'Please select an image file.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      flash('error', 'Image must be under 2 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      setAvatar(dataUrl)
      localStorage.setItem(`lms_avatar_${auth!.username}`, dataUrl)
      flash('success', 'Avatar updated.')
    }
    reader.onerror = () => flash('error', 'Could not read image file.')
    reader.readAsDataURL(file)
  }

  function removeAvatar() {
    if (!auth) return
    localStorage.removeItem(`lms_avatar_${auth.username}`)
    setAvatar('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    flash('success', 'Avatar removed.')
  }

  function validateProfile() {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Name is required.'
    if (contactDigits && !/^\d{5,15}$/.test(contactDigits)) {
      errs.contactNumber = 'Enter a valid contact number (5–15 digits).'
    }
    if (newPassword && newPassword.length < 6) {
      errs.newPassword = 'New password must be at least 6 characters.'
    }
    if (newPassword && !currentPassword) {
      errs.currentPassword = 'Enter your current password to change it.'
    }
    return errs
  }

  function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    const errs = validateProfile()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setErrors({})

    const trimmedName = name.trim().toUpperCase()
    const trimmedContact = contactDigits ? `${contactCode} ${contactDigits}` : ''
    const trimmedCurrent: Address = {
      country: currentAddress.country.trim(),
      street: currentAddress.street.trim(),
      city: currentAddress.city.trim(),
      province: currentAddress.province.trim(),
    }
    const trimmedPermanent: Address = sameAsCurrent
      ? { ...trimmedCurrent }
      : {
          country: permanentAddress.country.trim(),
          street: permanentAddress.street.trim(),
          city: permanentAddress.city.trim(),
          province: permanentAddress.province.trim(),
        }

    const accounts = readJSON<Account[]>('lms_accounts', [])
    const idx = accounts.findIndex((a) => a.username === auth!.username)

    if (newPassword) {
      if (idx === -1) {
        setErrors({ currentPassword: 'Password changes are only allowed for registered accounts.' })
        return
      }
      if (accounts[idx].password !== currentPassword) {
        setErrors({ currentPassword: 'Current password is incorrect.' })
        return
      }
    }

    if (idx !== -1) {
      accounts[idx] = {
        ...accounts[idx],
        name: trimmedName,
        contactNumber: trimmedContact,
        currentAddress: trimmedCurrent,
        permanentAddress: trimmedPermanent,
        sameAsCurrent,
        password: newPassword ? newPassword : accounts[idx].password,
      }
      writeJSON('lms_accounts', accounts)
    }

    const updatedAuth: AuthUser = {
      username: auth!.username,
      name: trimmedName,
      role: auth!.role,
      department: auth!.department,
      contactNumber: trimmedContact,
      currentAddress: trimmedCurrent,
      permanentAddress: trimmedPermanent,
      sameAsCurrent,
    }
    writeJSON('lms_auth', updatedAuth)
    setAuth(updatedAuth)
    if (sameAsCurrent) setPermanentAddress(trimmedCurrent)
    setCurrentPassword('')
    setNewPassword('')
    flash('success', 'Profile saved.')
  }

  function toggleSetting(key: keyof Settings) {
    const next = { ...settings, [key]: !settings[key] }
    setSettings(next)
    writeJSON('lms_settings', next)
    applyHciSettings(next)
  }

  function handleExport() {
    const classes = readJSON<Class[]>('lms_classes', [])
    const students = readJSON<Student[]>('lms_students', [])
    const assignments = readJSON<Assignment[]>('lms_assignments', [])

    const fmtAddress = (a?: Address) =>
      a && (a.street || a.city || a.province || a.country)
        ? [a.street, a.city, a.province, a.country].filter(Boolean).join(', ')
        : ''

    const escapeCell = (value: unknown): string => {
      const s = value == null ? '' : String(value)
      return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }

    const rows: string[] = []
    const addRow = (cells: unknown[]) => rows.push(cells.map(escapeCell).join(','))
    const addBlank = () => rows.push('')
    const addSection = (title: string) => {
      if (rows.length > 0) addBlank()
      addRow([`# ${title}`])
    }

    addRow(['LMS Data Export'])
    addRow(['Generated', new Date().toISOString()])

    addSection('Profile')
    addRow(['Field', 'Value'])
    addRow(['Username', auth?.username || ''])
    addRow(['Full name', auth?.name || ''])
    addRow(['Role', auth?.role || ''])
    addRow(['Department', auth?.department || ''])
    addRow(['Contact number', auth?.contactNumber || ''])
    addRow(['Current address', fmtAddress(auth?.currentAddress)])
    addRow(['Permanent address', fmtAddress(auth?.permanentAddress)])

    addSection('Preferences')
    addRow(['Setting', 'Status'])
    addRow(['Compact sidebar', settings.compactSidebar ? 'Enabled' : 'Disabled'])
    addRow(['Email notifications', settings.emailNotifications ? 'Enabled' : 'Disabled'])
    addRow(['Auto-save grades', settings.autoSaveGrades ? 'Enabled' : 'Disabled'])
    addRow(['Show grade hints', settings.showGradeHints ? 'Enabled' : 'Disabled'])
    addRow(['Dark mode', settings.darkMode ? 'Enabled' : 'Disabled'])
    addRow(['High contrast', settings.highContrast ? 'Enabled' : 'Disabled'])
    addRow(['Reduce motion', settings.reduceMotion ? 'Enabled' : 'Disabled'])
    addRow(['Larger text', settings.largeText ? 'Enabled' : 'Disabled'])
    addRow(['Dyslexia-friendly font', settings.dyslexiaFont ? 'Enabled' : 'Disabled'])

    const classNameById = new Map(classes.map((c) => [c.id, `${c.code} — ${c.name}`]))

    addSection(`Classes (${classes.length})`)
    addRow(['Code', 'Name', 'Section', 'Semester', 'Year', 'Faculty', 'Schedule', 'Room'])
    classes.forEach((c) => {
      addRow([c.code, c.name, c.section, c.semester, c.yearLevel, c.faculty, c.schedule, c.room])
    })

    addSection(`Students (${students.length})`)
    addRow([
      'Student No.',
      'Last Name',
      'First Name',
      'MI',
      'Class',
      'Class Participation',
      'Major Exam Raw',
      'Major Exam TPS',
    ])
    students.forEach((s) => {
      addRow([
        s.studentNo,
        s.lastName,
        s.firstName,
        s.mi || '',
        classNameById.get(s.classId) || s.classId || '',
        s.classParticipation ?? 0,
        s.majorExam?.raw ?? 0,
        s.majorExam?.tps ?? 0,
      ])
    })

    const nonQuizAssignments = assignments.filter((a) => a.type !== 'Exam')
    addSection(`Assignments (${nonQuizAssignments.length})`)
    addRow(['Title', 'Type', 'Class', 'Due Date', 'Max Score', 'Status'])
    nonQuizAssignments.forEach((a) => {
      addRow([
        a.title,
        a.type,
        classNameById.get(a.classId) || a.classId || '',
        a.dueDate ? new Date(a.dueDate).toISOString().slice(0, 10) : '',
        a.maxScore ?? 0,
        a.status,
      ])
    })

    const quizzes = assignments.filter((a) => a.type === 'Exam')
    addSection(`Exams (${quizzes.length})`)
    addRow(['Title', 'Class', 'Date', 'Max Score', 'Status', 'Description'])
    quizzes.forEach((q) => {
      addRow([
        q.title,
        classNameById.get(q.classId) || q.classId || '',
        q.dueDate ? new Date(q.dueDate).toISOString().slice(0, 10) : '',
        q.maxScore ?? 0,
        q.status,
        q.description || '',
      ])
    })

    addSection(`Grade Sheets (${classes.length})`)
    addRow([
      'Class Code',
      'Class Name',
      'Section',
      'No.',
      'Student No.',
      'Last Name',
      'First Name',
      'MI',
      'Attendance %',
      'Class Participation',
      'Quiz Avg',
      'RA Avg',
      'Class Performance',
      'Major Exam Raw',
      'Major Exam TPS',
      'Finale Grade',
      'GWA',
      'Remarks',
    ])
    classes.forEach((cls) => {
      const classStudents = students.filter((s) => s.classId === cls.id)
      classStudents.forEach((s, i) => {
        const g = computeGrades(s)
        const attPct = computeAttendanceGrade(s.attendance)
        addRow([
          cls.code,
          cls.name,
          cls.section || '',
          i + 1,
          s.studentNo || '',
          s.lastName,
          s.firstName,
          s.mi || '',
          attPct.toFixed(0),
          s.classParticipation ?? 0,
          g.quizAvg.toFixed(2),
          g.raAvg.toFixed(2),
          g.classPerformance.toFixed(2),
          s.majorExam?.raw ?? 0,
          s.majorExam?.tps ?? 0,
          g.finaleGrade > 0 ? g.finaleGrade : '',
          g.finaleGrade > 0 ? g.gradesLabel : '',
          g.finaleGrade > 0 ? g.remarks : '',
        ])
      })
    })

    const csv = '\ufeff' + rows.join('\r\n') + '\r\n'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const safeName = (auth?.name || 'user').replace(/[^a-z0-9]+/gi, '_').toLowerCase()
    const link = document.createElement('a')
    link.href = url
    link.download = `lms_export_${safeName}_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    flash('success', 'Data exported.')
  }

  function handleReset() {
    DATA_KEYS.forEach((k) => localStorage.removeItem(k))
    localStorage.removeItem('lms_settings')
    setSettings(DEFAULT_SETTINGS)
    applyHciSettings(DEFAULT_SETTINGS)
    setConfirmReset(false)
    flash('success', 'Data reset. Reloading…')
    setTimeout(() => window.location.reload(), 900)
  }

  const initials = (auth.name || '?')
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Back + Title */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate({ to: '/dashboard' })}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your account details and preferences.</p>
        </div>
      </div>

      {toast && (
        <div
          className={`mb-4 flex items-start gap-2 px-4 py-3 rounded-lg text-sm border ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
          role="status"
        >
          {toast.type === 'success' ? (
            <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar + Identity card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center lg:col-span-1">
          <div className="relative">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-[#6B0F1A] text-[#F5E6C8] flex items-center justify-center text-3xl font-bold shadow-inner">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{initials || <User className="w-10 h-10" />}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-[#D4AF37] text-[#6B0F1A] shadow hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#6B0F1A]"
              aria-label="Upload avatar"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />

          <div className="mt-4">
            <div className="font-semibold text-gray-900">{auth.name || 'Faculty'}</div>
            <div className="text-xs text-gray-500 mt-0.5">{auth.role}</div>
          </div>

          <div className="mt-4 w-full text-left space-y-2 text-xs">
            <div className="flex items-center gap-2 text-gray-500">
              <Mail className="w-3.5 h-3.5" />
              <span className="truncate">{auth.username}</span>
            </div>
            {auth.department && (
              <div className="flex items-center gap-2 text-gray-500">
                <Building2 className="w-3.5 h-3.5" />
                <span className="truncate">{auth.department}</span>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2 w-full">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Change
            </button>
            {avatar && (
              <button
                type="button"
                onClick={removeAvatar}
                className="flex-1 text-xs font-medium px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            )}
          </div>
          <p className="mt-3 text-[11px] text-gray-400">PNG or JPG, up to 2 MB.</p>
        </div>

        {/* Editable details */}
        <form onSubmit={saveProfile} className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <User className="w-4 h-4 text-[#6B0F1A]" />
            <h2 className="font-semibold text-gray-800">Account Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                  errors.name ? 'border-red-400 focus:ring-red-300 bg-red-50' : 'border-gray-300 focus:ring-[#D4AF37]'
                }`}
              />
              {errors.name && (
                <div className="mt-1.5 text-xs text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3" />
                  {errors.name}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email</label>
              <input
                type="email"
                value={auth.username}
                disabled
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="mt-1 text-[11px] text-gray-400">Email cannot be changed.</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Contact Number</label>
              <div className="flex gap-2">
                <CountryCodeSelect
                  value={contactCode}
                  onChange={setContactCode}
                  invalid={Boolean(errors.contactNumber)}
                />
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={contactDigits}
                    onChange={(e) => setContactDigits(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => {
                      if (
                        e.key.length === 1 &&
                        !/\d/.test(e.key) &&
                        !e.ctrlKey &&
                        !e.metaKey
                      ) {
                        e.preventDefault()
                      }
                    }}
                    placeholder="9123456789"
                    maxLength={15}
                    className={`w-full pl-9 pr-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                      errors.contactNumber ? 'border-red-400 focus:ring-red-300 bg-red-50' : 'border-gray-300 focus:ring-[#D4AF37]'
                    }`}
                  />
                </div>
              </div>
              {errors.contactNumber && (
                <div className="mt-1.5 text-xs text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3" />
                  {errors.contactNumber}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Department</label>
              <input
                type="text"
                value={auth.department || ''}
                disabled
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="mt-1 text-[11px] text-gray-400">Department cannot be changed.</p>
            </div>
          </div>

          <div className="pt-5 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-[#6B0F1A]" />
              <h3 className="font-semibold text-gray-800 text-sm">Current Address</h3>
            </div>
            <AddressFields
              address={currentAddress}
              onChange={setCurrentAddress}
              idPrefix="current"
            />
          </div>

          <div className="pt-4">
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sameAsCurrent}
                onChange={(e) => setSameAsCurrent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#6B0F1A] focus:ring-[#D4AF37]"
              />
              <span className="text-sm text-gray-700">
                Permanent address is the same as current address
                <span className="block text-xs text-gray-500 mt-0.5">
                  Tick to automatically copy the fields above. Untick to enter a different permanent address.
                </span>
              </span>
            </label>
          </div>

          <div className={`pt-4 border-t border-gray-100 ${sameAsCurrent ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-[#6B0F1A]" />
              <h3 className="font-semibold text-gray-800 text-sm">Permanent Address</h3>
              {sameAsCurrent && (
                <span className="text-xs text-gray-400">Auto-filled from current address</span>
              )}
            </div>
            <AddressFields
              address={permanentAddress}
              onChange={setPermanentAddress}
              idPrefix="permanent"
              disabled={sameAsCurrent}
            />
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-[#6B0F1A]" />
              <h3 className="font-semibold text-gray-800 text-sm">Change Password</h3>
              <span className="text-xs text-gray-400">Optional</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className={`w-full px-3.5 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                      errors.currentPassword ? 'border-red-400 focus:ring-red-300 bg-red-50' : 'border-gray-300 focus:ring-[#D4AF37]'
                    }`}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-gray-600"
                    aria-label={showCurrent ? 'Hide password' : 'Show password'}
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <div className="mt-1.5 text-xs text-red-600 flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3" />
                    {errors.currentPassword}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className={`w-full px-3.5 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                      errors.newPassword ? 'border-red-400 focus:ring-red-300 bg-red-50' : 'border-gray-300 focus:ring-[#D4AF37]'
                    }`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-gray-600"
                    aria-label={showNew ? 'Hide password' : 'Show password'}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <div className="mt-1.5 text-xs text-red-600 flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3" />
                    {errors.newPassword}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6B0F1A] hover:bg-[#8B1A2B] text-white text-sm font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Settings */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Preferences</h2>
        <div className="divide-y divide-gray-100">
          <SettingToggle
            label="Compact sidebar"
            description="Hide extra labels and condense the navigation."
            checked={settings.compactSidebar}
            onChange={() => toggleSetting('compactSidebar')}
          />
          <SettingToggle
            label="Email notifications"
            description="Receive announcements about assignments and grading."
            checked={settings.emailNotifications}
            onChange={() => toggleSetting('emailNotifications')}
          />
          <SettingToggle
            label="Auto-save grades"
            description="Persist grade edits automatically after each change."
            checked={settings.autoSaveGrades}
            onChange={() => toggleSetting('autoSaveGrades')}
          />
          <SettingToggle
            label="Show grade hints"
            description="Display scoring tips and transmutation guidance."
            checked={settings.showGradeHints}
            onChange={() => toggleSetting('showGradeHints')}
          />
        </div>

        <div className="mt-6 pt-5 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">Display &amp; accessibility</h3>
          <p className="text-xs text-gray-500 mt-0.5">Human-computer interaction modes that adjust how the LMS looks and feels.</p>
          <div className="mt-2 divide-y divide-gray-100">
            <SettingToggle
              label="Dark mode"
              description="Use a dim, low-glare palette that is easier on the eyes in low light."
              checked={settings.darkMode}
              onChange={() => toggleSetting('darkMode')}
            />
            <SettingToggle
              label="High contrast"
              description="Boost text and border contrast to improve legibility."
              checked={settings.highContrast}
              onChange={() => toggleSetting('highContrast')}
            />
            <SettingToggle
              label="Reduce motion"
              description="Disable transitions and animations for a calmer interface."
              checked={settings.reduceMotion}
              onChange={() => toggleSetting('reduceMotion')}
            />
            <SettingToggle
              label="Larger text"
              description="Increase the base font size for easier reading."
              checked={settings.largeText}
              onChange={() => toggleSetting('largeText')}
            />
            <SettingToggle
              label="Dyslexia-friendly font"
              description="Switch to a rounded, evenly-spaced typeface that can aid reading."
              checked={settings.dyslexiaFont}
              onChange={() => toggleSetting('dyslexiaFont')}
            />
          </div>
        </div>
      </div>

      {/* Data actions */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-800 mb-1">Data</h2>
        <p className="text-sm text-gray-500 mb-4">Back up your records or start fresh.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleExport}
            className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:border-[#D4AF37] hover:bg-[#FFF8E7] text-left transition-colors"
          >
            <Download className="w-5 h-5 text-[#6B0F1A] flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-gray-800">Export all data</div>
              <div className="text-xs text-gray-500 mt-0.5">Download a structured CSV with classes, students, assignments, quizzes, and grade sheets.</div>
            </div>
          </button>
          <button
            onClick={() => setConfirmReset(true)}
            className="flex items-start gap-3 p-4 rounded-lg border border-red-200 hover:bg-red-50 text-left transition-colors"
          >
            <RotateCcw className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-red-600">Reset LMS data</div>
              <div className="text-xs text-red-500/80 mt-0.5">Clear classes, students, and assignments on this device.</div>
            </div>
          </button>
        </div>
      </div>

      {/* Reset confirmation modal */}
      {confirmReset && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-red-100">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Reset all LMS data?</h3>
                <p className="text-sm text-gray-500 mt-1">
                  This will remove classes, students, and assignments stored on this device. Your account and login will remain. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setConfirmReset(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CountryCodeSelect({
  value,
  onChange,
  invalid,
}: {
  value: string
  onChange: (code: string) => void
  invalid?: boolean
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (open && listRef.current) {
      const el = listRef.current.querySelector<HTMLLIElement>('[data-selected="true"]')
      el?.scrollIntoView({ block: 'nearest' })
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Country code"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1 px-2.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white ${
          invalid ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-[#D4AF37]'
        }`}
      >
        <span className="font-medium text-gray-800">({value})</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-20 mt-1 left-0 min-w-[16rem] max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg py-1 text-sm"
        >
          {COUNTRY_CODES.map((c) => {
            const selected = c.code === value
            return (
              <li
                key={`${c.country}-${c.code}`}
                role="option"
                aria-selected={selected}
                data-selected={selected}
                onClick={() => {
                  onChange(c.code)
                  setOpen(false)
                }}
                className={`px-3 py-2 cursor-pointer flex items-center justify-between gap-3 ${
                  selected ? 'bg-[#FFF8E7] text-[#6B0F1A]' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{c.country} ({c.code})</span>
                {selected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function SettingToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-800">{label}</div>
        <div className="text-xs text-gray-500 mt-0.5">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 ${
          checked ? 'bg-[#6B0F1A]' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}

function AddressFields({
  address,
  onChange,
  idPrefix,
  disabled = false,
}: {
  address: Address
  onChange: (next: Address) => void
  idPrefix: string
  disabled?: boolean
}) {
  const inputClass = `w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
    disabled ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-gray-300 focus:ring-[#D4AF37]'
  }`

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={`${idPrefix}-country`} className="text-sm font-medium text-gray-700 mb-1.5 block">
          Country
        </label>
        <select
          id={`${idPrefix}-country`}
          value={address.country}
          disabled={disabled}
          onChange={(e) => onChange({ ...address, country: e.target.value })}
          className={inputClass}
        >
          <option value="">Select a country...</option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {address.country && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor={`${idPrefix}-street`} className="text-sm font-medium text-gray-700 mb-1.5 block">
              Street
            </label>
            <input
              id={`${idPrefix}-street`}
              type="text"
              value={address.street}
              disabled={disabled}
              onChange={(e) => onChange({ ...address, street: e.target.value })}
              placeholder="House no., street, barangay"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor={`${idPrefix}-city`} className="text-sm font-medium text-gray-700 mb-1.5 block">
              City
            </label>
            <input
              id={`${idPrefix}-city`}
              type="text"
              value={address.city}
              disabled={disabled}
              onChange={(e) => onChange({ ...address, city: e.target.value })}
              placeholder="e.g., Manila"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor={`${idPrefix}-province`} className="text-sm font-medium text-gray-700 mb-1.5 block">
              Province / State
            </label>
            <input
              id={`${idPrefix}-province`}
              type="text"
              value={address.province}
              disabled={disabled}
              onChange={(e) => onChange({ ...address, province: e.target.value })}
              placeholder="e.g., Metro Manila"
              className={inputClass}
            />
          </div>
        </div>
      )}
    </div>
  )
}
