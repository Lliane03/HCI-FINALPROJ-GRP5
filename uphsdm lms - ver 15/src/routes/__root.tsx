import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useLocation,
  useNavigate,
} from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Menu, GraduationCap } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { initSampleData } from '../lib/store'
import { applyHciSettings, loadHciSettings } from '../lib/hci'
import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'UPHSDM TEACHER LMS - Learning Management System' },
    ],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
})

function RootLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isLoginPage = location.pathname === '/login'
  const isHelpPage = location.pathname === '/hci-help'

  useEffect(() => {
    initSampleData()
    applyHciSettings(loadHciSettings())
    const auth = localStorage.getItem('lms_auth')
    if (!auth && !isLoginPage && !isHelpPage) {
      navigate({ to: '/login' })
    }
    if (auth && (location.pathname === '/' || isLoginPage)) {
      navigate({ to: '/dashboard' })
    }
  }, [location.pathname])

  if (isLoginPage) {
    return <Outlet />
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center h-14 px-4 bg-[#6d1a2e] text-[#f5efdc] gap-3 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded hover:bg-[#8b2338]"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <GraduationCap className="w-5 h-5 text-[#d4af37]" />
          <span className="font-bold text-sm">UPHSDM TEACHER LMS</span>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
