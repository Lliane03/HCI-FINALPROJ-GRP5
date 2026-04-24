import { Link, useLocation } from '@tanstack/react-router'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ClipboardList,
  HelpCircle,
  LogOut,
  X,
  GraduationCap,
  FileText,
  UserCircle,
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/classes', icon: BookOpen, label: 'Classes' },
  { to: '/students', icon: Users, label: 'Students' },
  { to: '/activities', icon: ClipboardList, label: 'Activities' },
  { to: '/exams', icon: HelpCircle, label: 'Exams' },
]

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation()

  function handleLogout() {
    localStorage.removeItem('lms_auth')
    window.location.href = '/login'
  }

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('lms_auth') || '{}')
    } catch {
      return {}
    }
  })()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#6d1a2e] text-[#f5efdc] h-full flex-shrink-0">
        <SidebarContent
          location={location}
          user={user}
          onLogout={handleLogout}
          onClose={onClose}
          showClose={false}
        />
      </aside>

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col w-64 bg-[#6d1a2e] text-[#f5efdc] transform transition-transform duration-300 lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent
          location={location}
          user={user}
          onLogout={handleLogout}
          onClose={onClose}
          showClose={true}
        />
      </aside>
    </>
  )
}

function SidebarContent({
  location,
  user,
  onLogout,
  onClose,
  showClose,
}: {
  location: { pathname: string }
  user: { name?: string; role?: string; department?: string }
  onLogout: () => void
  onClose: () => void
  showClose: boolean
}) {
  const department = user.department || 'Faculty Department'
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-[#4a0f1c]">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-[#d4af37] flex-shrink-0" />
          <div>
            <div className="font-bold text-sm leading-tight text-[#f5efdc]">UPHSDM TEACHER LMS</div>
            <div className="text-xs text-[#d4c79e] leading-tight">{department}</div>
          </div>
        </div>
        {showClose && (
          <button onClick={onClose} className="p-1 rounded hover:bg-[#8b2338]">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* User info */}
      <Link
        to="/profile"
        onClick={onClose}
        className={`block px-4 py-3 border-b border-[#4a0f1c] transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#d4af37] ${
          location.pathname === '/profile'
            ? 'bg-[#d4af37]/20'
            : 'bg-[#4a0f1c]/40 hover:bg-[#8b2338]/50'
        }`}
        aria-label="Open profile"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs text-[#d4c79e] uppercase tracking-wider mb-1">Logged in as</div>
            <div className="font-semibold text-sm truncate text-[#f5efdc]">{user.name || 'Faculty'}</div>
            <div className="text-xs text-[#d4c79e] truncate">{user.role || 'Teacher'}</div>
          </div>
          <UserCircle className="w-5 h-5 text-[#d4af37] flex-shrink-0" />
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to || location.pathname.startsWith(to + '/')
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#d4af37] text-[#4a0f1c]'
                  : 'text-[#f5efdc] hover:bg-[#8b2338] hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-[#4a0f1c]">
        <Link
          to="/hci-help"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#d4c79e] hover:bg-[#8b2338] hover:text-[#f5efdc] transition-colors"
        >
          <FileText className="w-4 h-4" />
          Help & Guide
        </Link>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#e6c46a] hover:bg-[#8b2338] hover:text-[#d4af37] transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
