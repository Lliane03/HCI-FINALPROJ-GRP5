import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Eye, EyeOff, GraduationCap, AlertCircle, ArrowLeft } from 'lucide-react'
import Tooltip from '../components/Tooltip'

export const Route = createFileRoute('/login')({
  component: Login,
})

const DEPARTMENTS = ['Basic Education', 'Junior High School', 'Senior High School', 'College'] as const

function getRegisteredAccounts(): { username: string; password: string; name: string; role: string; department?: string }[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('lms_accounts') || '[]')
  } catch {
    return []
  }
}

function saveRegisteredAccounts(accounts: { username: string; password: string; name: string; role: string; department?: string }[]) {
  localStorage.setItem('lms_accounts', JSON.stringify(accounts))
}

const DEFAULT_CREDENTIALS = [
  { username: 'prof.essor@uphsdm.edu.ph', password: 'uphsdm2026', name: 'PROF. ESSOR', role: 'Faculty', department: 'Group 5 Demonstration' },
  { username: 'admin@uphsdm.edu.ph', password: 'admin123', name: 'System Administrator', role: 'LMS Administrator', department: 'System Administration' },
]

function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  // Register form state
  const [regFullName, setRegFullName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regShowPassword, setRegShowPassword] = useState(false)
  const [regDepartment, setRegDepartment] = useState('')
  const [regCollegeType, setRegCollegeType] = useState('')
  const [regSuccess, setRegSuccess] = useState(false)

  function validateLogin() {
    const errs: Record<string, string> = {}
    if (!username) {
      errs.username = 'Username (email) is required.'
    } else if (!username.includes('@')) {
      errs.username = 'Invalid email address. Email must contain "@" (e.g., name@uphsdm.edu.ph).'
    }
    if (!password) {
      errs.password = 'Password is required.'
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters.'
    }
    return errs
  }

  function validateRegister() {
    const errs: Record<string, string> = {}
    if (!regFullName.trim()) errs.fullName = 'Full name is required.'
    if (!regEmail) {
      errs.email = 'Email is required.'
    } else if (!/^[a-zA-Z0-9._%+-]+@uphsdm\.edu\.ph$/.test(regEmail)) {
      errs.email = 'Email must follow the format: name@uphsdm.edu.ph'
    } else {
      const allAccounts = [...DEFAULT_CREDENTIALS, ...getRegisteredAccounts()]
      if (allAccounts.some((a) => a.username === regEmail)) {
        errs.email = 'An account with this email already exists.'
      }
    }
    if (!regPassword) {
      errs.password = 'Password is required.'
    } else if (regPassword.length < 6) {
      errs.password = 'Password must be at least 6 characters.'
    }
    if (!regDepartment) errs.department = 'Please select a department.'
    if (regDepartment === 'College' && !regCollegeType.trim()) {
      errs.collegeType = 'Please specify your College department.'
    }
    return errs
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    const errs = validateLogin()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setLoading(true)
    setTimeout(() => {
      const allAccounts = [...DEFAULT_CREDENTIALS, ...getRegisteredAccounts()]
      const user = allAccounts.find((c) => c.username === username && c.password === password)
      if (user) {
        localStorage.setItem('lms_auth', JSON.stringify({ username: user.username, name: user.name, role: user.role, department: (user as any).department || '' }))
        navigate({ to: '/dashboard' })
      } else {
        setErrors({ general: 'Invalid username or password. Please try again.' })
        setLoading(false)
      }
    }, 600)
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    const errs = validateRegister()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setLoading(true)
    setTimeout(() => {
      const role = regDepartment === 'College' && regCollegeType
        ? `Faculty - ${regCollegeType}`
        : `Faculty - ${regDepartment}`
      const department = regDepartment === 'College' && regCollegeType
        ? regCollegeType
        : regDepartment
      const newAccount = {
        username: regEmail,
        password: regPassword,
        name: regFullName.toUpperCase(),
        role,
        department,
      }
      const accounts = getRegisteredAccounts()
      accounts.push(newAccount)
      saveRegisteredAccounts(accounts)
      setRegSuccess(true)
      setLoading(false)
      setTimeout(() => {
        setMode('login')
        setUsername(regEmail)
        setPassword('')
        setRegSuccess(false)
        setRegFullName('')
        setRegEmail('')
        setRegPassword('')
        setRegDepartment('')
        setRegCollegeType('')
        setErrors({})
      }, 1500)
    }, 600)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4a0b13] via-[#6B0F1A] to-[#4a0b13] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#D4AF37] mb-4 shadow-lg">
            <GraduationCap className="w-8 h-8 text-[#6B0F1A]" />
          </div>
          <h1 className="text-2xl font-bold text-white">UPHSDM TEACHER LMS</h1>
          <p className="text-[#F5E6C8] text-sm mt-1">University of Perpetual Help System DALTA</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {mode === 'login' ? (
            <>
              <div className="bg-[#6B0F1A] px-6 py-4">
                <h2 className="text-white font-semibold text-lg">Faculty Login</h2>
                <p className="text-[#F5E6C8] text-xs mt-0.5">Sign in to access the Learning Management System</p>
              </div>

              <form onSubmit={handleLogin} className="p-6 space-y-5" noValidate>
                {errors.general && (
                  <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" role="alert">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{errors.general}</span>
                  </div>
                )}

                <div>
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1.5">
                    Username (Email)
                    <Tooltip text="Enter your official UPHSD email address. Format: name@uphsdm.edu.ph" position="right" />
                  </label>
                  <input
                    type="email"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); if (errors.username) setErrors((p) => ({ ...p, username: undefined as any })) }}
                    placeholder="name@uphsdm.edu.ph"
                    className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                      errors.username ? 'border-red-400 focus:ring-red-300 bg-red-50' : 'border-gray-300 focus:ring-[#D4AF37] focus:border-[#D4AF37]'
                    }`}
                    autoComplete="username"
                  />
                  {errors.username && (
                    <div className="flex items-start gap-1.5 mt-1.5 text-xs text-red-600" role="alert">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      {errors.username}
                    </div>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1.5">
                    Password
                    <Tooltip text="Enter your account password. Minimum 6 characters required." position="right" />
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: undefined as any })) }}
                      placeholder="Enter password"
                      className={`w-full px-3.5 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                        errors.password ? 'border-red-400 focus:ring-red-300 bg-red-50' : 'border-gray-300 focus:ring-[#D4AF37] focus:border-[#D4AF37]'
                      }`}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <div className="flex items-start gap-1.5 mt-1.5 text-xs text-red-600" role="alert">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      {errors.password}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-[#6B0F1A] hover:bg-[#8B1A2B] disabled:opacity-60 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 text-sm"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setErrors({}); setLoading(false) }}
                    className="text-sm text-[#6B0F1A] hover:text-[#8B1A2B] hover:underline font-medium"
                  >
                    Don't have an account? Register here
                  </button>
                </div>

                <div className="mt-4 p-3 bg-[#FFF8E7] border border-[#D4AF37] rounded-lg text-xs text-[#6B0F1A]">
                  <strong>Demo Account:</strong>
                  <br />
                  Email: <code className="font-mono">prof.essor@uphsdm.edu.ph</code>
                  <br />
                  Password: <code className="font-mono">uphsdm2026</code>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="bg-[#6B0F1A] px-6 py-4">
                <h2 className="text-white font-semibold text-lg">Faculty Registration</h2>
                <p className="text-[#F5E6C8] text-xs mt-0.5">Create your LMS account to get started</p>
              </div>

              <form onSubmit={handleRegister} className="p-6 space-y-4" noValidate>
                {regSuccess && (
                  <div className="flex items-start gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700" role="alert">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Registration successful! Redirecting to login...</span>
                  </div>
                )}

                {/* Full Name */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => { setRegFullName(e.target.value); if (errors.fullName) setErrors((p) => ({ ...p, fullName: undefined as any })) }}
                    placeholder="e.g., Juan Dela Cruz"
                    className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                      errors.fullName ? 'border-red-400 focus:ring-red-300 bg-red-50' : 'border-gray-300 focus:ring-[#D4AF37]'
                    }`}
                  />
                  {errors.fullName && (
                    <div className="flex items-start gap-1.5 mt-1.5 text-xs text-red-600"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{errors.fullName}</div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1.5">
                    Email <span className="text-red-500">*</span>
                    <Tooltip text="Must follow the format: name@uphsdm.edu.ph" position="right" />
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => { setRegEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: undefined as any })) }}
                    placeholder="name@uphsdm.edu.ph"
                    className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                      errors.email ? 'border-red-400 focus:ring-red-300 bg-red-50' : 'border-gray-300 focus:ring-[#D4AF37]'
                    }`}
                    autoComplete="email"
                  />
                  {errors.email && (
                    <div className="flex items-start gap-1.5 mt-1.5 text-xs text-red-600"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{errors.email}</div>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={regShowPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => { setRegPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: undefined as any })) }}
                      placeholder="Minimum 6 characters"
                      className={`w-full px-3.5 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                        errors.password ? 'border-red-400 focus:ring-red-300 bg-red-50' : 'border-gray-300 focus:ring-[#D4AF37]'
                      }`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setRegShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                      aria-label={regShowPassword ? 'Hide password' : 'Show password'}
                    >
                      {regShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <div className="flex items-start gap-1.5 mt-1.5 text-xs text-red-600"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{errors.password}</div>
                  )}
                </div>

                {/* Department */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={regDepartment}
                    onChange={(e) => { setRegDepartment(e.target.value); setRegCollegeType(''); if (errors.department) setErrors((p) => ({ ...p, department: undefined as any })) }}
                    className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 bg-white transition-colors ${
                      errors.department ? 'border-red-400 focus:ring-red-300 bg-red-50' : 'border-gray-300 focus:ring-[#D4AF37]'
                    }`}
                  >
                    <option value="">Select your department...</option>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.department && (
                    <div className="flex items-start gap-1.5 mt-1.5 text-xs text-red-600"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{errors.department}</div>
                  )}
                </div>

                {/* College Department Type (conditional) */}
                {regDepartment === 'College' && (
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1.5">
                      College Department <span className="text-red-500">*</span>
                      <Tooltip text="Specify which College department you teach in (e.g., College of Computer Studies)" position="right" />
                    </label>
                    <input
                      type="text"
                      value={regCollegeType}
                      onChange={(e) => { setRegCollegeType(e.target.value); if (errors.collegeType) setErrors((p) => ({ ...p, collegeType: undefined as any })) }}
                      placeholder="e.g., College of Computer Studies"
                      className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                        errors.collegeType ? 'border-red-400 focus:ring-red-300 bg-red-50' : 'border-gray-300 focus:ring-[#D4AF37]'
                      }`}
                    />
                    {errors.collegeType && (
                      <div className="flex items-start gap-1.5 mt-1.5 text-xs text-red-600"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{errors.collegeType}</div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || regSuccess}
                  className="w-full py-2.5 px-4 bg-[#6B0F1A] hover:bg-[#8B1A2B] disabled:opacity-60 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 text-sm"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating account...
                    </span>
                  ) : (
                    'Register'
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setErrors({}); setLoading(false); setRegSuccess(false) }}
                    className="text-sm text-[#6B0F1A] hover:text-[#8B1A2B] hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-[#F5E6C8] text-xs mt-6">
          &copy; 2026 Group 5 &mdash; HCI Final Project
        </p>
      </div>
    </div>
  )
}
