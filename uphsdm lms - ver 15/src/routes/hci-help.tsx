import { createFileRoute, Link } from '@tanstack/react-router'
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Users,
  ClipboardList,
  HelpCircle,
  LogIn,
  UserPlus,
  FileText,
  Lightbulb,
  ArrowLeft,
  Mail,
  BookMarked,
  CheckCircle2,
  UserCog,
} from 'lucide-react'

export const Route = createFileRoute('/hci-help')({
  component: HelpGuide,
})

function HelpGuide() {
  const isAuthed = (() => {
    if (typeof window === 'undefined') return false
    return !!localStorage.getItem('lms_auth')
  })()

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'classes', label: 'Classes' },
    { id: 'students', label: 'Students' },
    { id: 'assignments', label: 'Assignments' },
    { id: 'quizzes', label: 'Quizzes' },
    { id: 'grading', label: 'Grading System' },
    { id: 'profile', label: 'Profile & Settings' },
    { id: 'faq', label: 'FAQ & Support' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f9f5ea] via-white to-[#f9f5ea]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#4a0b13] via-[#6B0F1A] to-[#4a0b13] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#D4AF37] shadow-lg">
              <GraduationCap className="w-6 h-6 text-[#6B0F1A]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Help & Guide</h1>
              <p className="text-[#F5E6C8] text-sm">UPHSDM Teacher LMS &mdash; User Manual</p>
            </div>
          </div>
          <p className="text-[#F5E6C8] max-w-2xl text-sm sm:text-base leading-relaxed">
            Welcome, Faculty! This guide walks you through every feature of the Learning Management
            System &mdash; from signing in to managing classes, students, assignments, quizzes, and grades.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={isAuthed ? '/dashboard' : '/login'}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#e6c46a] text-[#4a0b13] font-semibold rounded-lg text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {isAuthed ? 'Back to Dashboard' : 'Back to Login'}
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Table of Contents */}
        <div className="bg-white rounded-xl border border-[#d4af37]/30 shadow-sm p-5 mb-8">
          <h2 className="font-semibold text-[#6B0F1A] mb-3 flex items-center gap-2">
            <BookMarked className="w-4 h-4" />
            On this page
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="text-[#6B0F1A] hover:text-[#8B1A2B] hover:underline"
              >
                &rsaquo; {s.label}
              </a>
            ))}
          </div>
        </div>

        {/* Overview */}
        <Section id="overview" icon={<Lightbulb className="w-5 h-5" />} title="Overview">
          <p>
            The UPHSDM Teacher LMS is a web-based learning management platform built for faculty of
            the University of Perpetual Help System DALTA. It centralizes the tools you need to run
            a class &mdash; rosters, graded activities, quizzes, and performance analytics &mdash; in one place.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Manage multiple classes across semesters and sections.</li>
            <li>Track students, their grades, attendance inputs, and overall performance.</li>
            <li>Create assignments and quizzes, then record scores for each student.</li>
            <li>See real-time analytics on the dashboard (pass/fail, averages, distribution).</li>
          </ul>
        </Section>

        {/* Getting Started */}
        <Section id="getting-started" icon={<LogIn className="w-5 h-5" />} title="Getting Started">
          <h3 className="font-semibold text-gray-800 mt-2">1. Registering an account</h3>
          <p>
            On the Login screen, click <em>&ldquo;Don&rsquo;t have an account? Register here&rdquo;</em>.
            Provide your full name, UPHSD email (<code className="bg-gray-100 px-1 rounded">name@uphsdm.edu.ph</code>),
            a password of at least 6 characters, and select your department. If you belong to the
            College department, additionally specify your college (e.g., College of Computer Studies).
          </p>

          <h3 className="font-semibold text-gray-800 mt-4">2. Signing in</h3>
          <p>
            Enter your registered email and password on the Login screen. A demo account is also
            available for quick access:
          </p>
          <div className="bg-[#FFF8E7] border border-[#D4AF37] rounded-lg p-3 text-sm">
            <strong className="text-[#6B0F1A]">Demo Faculty Account</strong>
            <br />
            Email: <code className="font-mono">prof.essor@uphsdm.edu.ph</code>
            <br />
            Password: <code className="font-mono">uphsdm2026</code>
          </div>

          <h3 className="font-semibold text-gray-800 mt-4">3. Navigating the app</h3>
          <p>
            Use the sidebar on the left (or the menu icon on mobile) to move between Dashboard,
            Classes, Students, Assignments, and Quizzes. Click your avatar or name at the top of
            the sidebar to open your <strong>Profile</strong>, where you can update your details
            and adjust app preferences. The <strong>Sign Out</strong> button at the bottom of the
            sidebar ends your session.
          </p>
        </Section>

        {/* Dashboard */}
        <Section id="dashboard" icon={<LayoutDashboard className="w-5 h-5" />} title="Dashboard">
          <p>
            The Dashboard is your landing page after logging in. It shows a snapshot of your
            teaching workload and student performance.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Stat cards</strong> &mdash; totals for classes, students, assignments, and class average.</li>
            <li><strong>Performance indicators</strong> &mdash; counts of passed, failed, and excellent (90+) students.</li>
            <li><strong>Grade Distribution</strong> &mdash; a bar chart showing how students are spread across grade labels (1.00 to 5.00).</li>
            <li><strong>Pass/Fail Overview</strong> &mdash; a doughnut chart summarizing pass vs. fail.</li>
            <li><strong>My Classes</strong> &mdash; a shortlist linking straight into each class page.</li>
          </ul>
        </Section>

        {/* Classes */}
        <Section id="classes" icon={<BookOpen className="w-5 h-5" />} title="Classes">
          <p>
            The Classes section lets you create and organize the classes you teach. Each class has
            a name, section, semester, and associated roster of students.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Click <strong>Add Class</strong> to register a new class.</li>
            <li>Open any class card to see its details, enrolled students, and activities.</li>
            <li>Edit or remove a class using the action controls on its page.</li>
          </ul>
        </Section>

        {/* Students */}
        <Section id="students" icon={<Users className="w-5 h-5" />} title="Students">
          <p>
            Use the Students section to maintain your roster. You can enroll students into a
            specific class and view their academic record.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Add a student by filling in their name, student ID, and assigned class.</li>
            <li>Open a student profile to view or update grade components (Quizzes, Assignments, Class Participation, Major Exam).</li>
            <li>The system automatically computes the final grade and equivalent grade label (transmuted).</li>
          </ul>
        </Section>

        {/* Assignments */}
        <Section id="assignments" icon={<ClipboardList className="w-5 h-5" />} title="Assignments">
          <p>
            Create and manage graded coursework in the Assignments section.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Add a new assignment with a title, description, class, due date, and total points.</li>
            <li>Mark assignments as <strong>Active</strong> while they&rsquo;re open for submissions, or <strong>Closed</strong> once grading is complete.</li>
            <li>Record individual student scores directly from the assignment detail page.</li>
          </ul>
        </Section>

        {/* Quizzes */}
        <Section id="quizzes" icon={<HelpCircle className="w-5 h-5" />} title="Quizzes">
          <p>
            The Quizzes section works similarly to Assignments but is dedicated to short graded
            assessments.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Create a quiz tied to a specific class and set its total points.</li>
            <li>Enter scores for each student; the dashboard and student profile update automatically.</li>
            <li>Use quizzes to track formative progress between major exams.</li>
          </ul>
        </Section>

        {/* Grading */}
        <Section id="grading" icon={<FileText className="w-5 h-5" />} title="Grading System">
          <p>
            Final grades are computed from weighted components and then transmuted to the UPHSD
            grade scale. The system handles the math for you &mdash; you only enter raw scores.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg">
              <thead className="bg-[#6B0F1A] text-white">
                <tr>
                  <th className="text-left px-3 py-2">Numeric Grade</th>
                  <th className="text-left px-3 py-2">Label</th>
                  <th className="text-left px-3 py-2">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ['97 &ndash; 100', '1.00', 'Excellent'],
                  ['94 &ndash; 96', '1.25', 'Superior'],
                  ['91 &ndash; 93', '1.50', 'Very Good'],
                  ['88 &ndash; 90', '1.75', 'Good'],
                  ['85 &ndash; 87', '2.00', 'Very Satisfactory'],
                  ['82 &ndash; 84', '2.25', 'Satisfactory'],
                  ['79 &ndash; 81', '2.50', 'Fair'],
                  ['76 &ndash; 78', '2.75', 'Passing'],
                  ['75', '3.00', 'Lowest Passing'],
                  ['Below 75', '5.00', 'Failed'],
                ].map(([range, label, remark]) => (
                  <tr key={label} className="odd:bg-white even:bg-[#fdf8ec]">
                    <td className="px-3 py-2" dangerouslySetInnerHTML={{ __html: range }} />
                    <td className="px-3 py-2 font-semibold">{label}</td>
                    <td className="px-3 py-2 text-gray-600">{remark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500">
            Labels at or above 3.00 are counted as passed; 5.00 is failing.
          </p>
        </Section>

        {/* Profile & Settings */}
        <Section id="profile" icon={<UserCog className="w-5 h-5" />} title="Profile & Settings">
          <p>
            Open your <strong>Profile</strong> from the sidebar (click your avatar or name) to
            review and update your faculty account, change your password, and personalize how the
            LMS looks and feels. Changes are saved to your device and applied instantly.
          </p>

          <h3 className="font-semibold text-gray-800 mt-2">Editing your profile</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Avatar</strong> &mdash; upload a PNG or JPG (up to 2 MB) using the camera button, or click <em>Remove</em> to clear it.</li>
            <li><strong>Account details</strong> &mdash; update your full name and contact number. Email and department are locked to keep your identity consistent.</li>
            <li><strong>Addresses</strong> &mdash; fill in your current address, then tick <em>&ldquo;Permanent address is the same as current address&rdquo;</em> to copy it, or untick to enter a different one.</li>
            <li><strong>Change password</strong> &mdash; enter your current password and a new one of at least 6 characters. Leave these fields blank if you only want to update your info.</li>
            <li>Click <strong>Save Changes</strong> at the bottom of the form. A green confirmation appears when the update is successful; red hints point out anything that needs fixing.</li>
          </ul>

          <h3 className="font-semibold text-gray-800 mt-4">Preferences</h3>
          <p>
            Toggle these on or off at any time &mdash; each switch takes effect immediately.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Compact sidebar</strong> &mdash; condenses the navigation for a roomier main area.</li>
            <li><strong>Email notifications</strong> &mdash; opt in to announcements about assignments and grading.</li>
            <li><strong>Auto-save grades</strong> &mdash; persists grade edits automatically after each change.</li>
            <li><strong>Show grade hints</strong> &mdash; keeps scoring tips and transmutation guidance visible.</li>
          </ul>

          <h3 className="font-semibold text-gray-800 mt-4">Display &amp; accessibility</h3>
          <p>
            Human-computer interaction modes that adjust how the LMS looks and feels so it fits
            your eyes and environment.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Dark mode</strong> &mdash; a dim, low-glare palette that is easier on the eyes in low light.</li>
            <li><strong>High contrast</strong> &mdash; boosts text and border contrast for improved legibility.</li>
            <li><strong>Reduce motion</strong> &mdash; disables transitions and animations for a calmer interface.</li>
            <li><strong>Larger text</strong> &mdash; increases the base font size for easier reading.</li>
            <li><strong>Dyslexia-friendly font</strong> &mdash; switches to a rounded, evenly-spaced typeface that can aid reading.</li>
          </ul>

          <h3 className="font-semibold text-gray-800 mt-4">Data</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Export all data</strong> &mdash; downloads a structured PDF containing your profile, preferences, classes, students, assignments, quizzes, and per-class grade sheets.</li>
            <li><strong>Reset LMS data</strong> &mdash; clears classes, students, and assignments stored on this device after a confirmation prompt. Your account and login are preserved. This action cannot be undone, so export first if you want a backup.</li>
          </ul>
        </Section>

        {/* FAQ */}
        <Section id="faq" icon={<CheckCircle2 className="w-5 h-5" />} title="FAQ & Support">
          <FAQ
            q="I forgot my password. What do I do?"
            a="Accounts are stored locally for this demo. If you are still signed in, open your Profile and use the Change Password section to set a new one. Otherwise, re-register using the same email or use the demo faculty account on the login screen."
          />
          <FAQ
            q="Why am I redirected to the login page?"
            a="Most sections require authentication. Sign in with your account to access the Dashboard, Classes, Students, Assignments, Quizzes, and Profile."
          />
          <FAQ
            q="How do I update my name, contact number, or avatar?"
            a="Open your Profile from the sidebar. Update the fields you want to change and click Save Changes. Use the camera button on the avatar to upload a new photo or Remove to clear it."
          />
          <FAQ
            q="My grade calculation looks off."
            a="Double-check the individual component scores for the student. Final grades are derived from Quizzes, Assignments, Class Participation, and the Major Exam."
          />
          <FAQ
            q="Can I use this on mobile?"
            a="Yes. The layout is responsive. Tap the menu icon in the top bar to open the sidebar on smaller screens."
          />

          <div className="mt-5 p-4 bg-[#FFF8E7] border border-[#D4AF37] rounded-lg text-sm text-[#6B0F1A] flex items-start gap-3">
            <Mail className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Still need help?</strong> Contact your department&rsquo;s LMS administrator, or
              reach out to the College of Computer Studies HCI project team for support.
            </div>
          </div>
        </Section>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-[#d4af37]/30 text-sm text-gray-500">
          <span>&copy; 2026 Group 5 &mdash; HCI Final Project</span>
          <Link
            to={isAuthed ? '/dashboard' : '/login'}
            className="inline-flex items-center gap-2 text-[#6B0F1A] hover:text-[#8B1A2B] font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            {isAuthed ? 'Back to Dashboard' : 'Back to Login'}
          </Link>
        </div>
      </div>
    </div>
  )
}

function Section({
  id,
  icon,
  title,
  children,
}: {
  id: string
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20 mb-8">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold text-[#6B0F1A] mb-3">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#FFF8E7] text-[#6B0F1A]">
            {icon}
          </span>
          {title}
        </h2>
        <div className="text-gray-700 text-sm sm:text-[15px] leading-relaxed space-y-3">
          {children}
        </div>
      </div>
    </section>
  )
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border border-gray-200 rounded-lg mb-2 open:bg-[#fdf8ec]">
      <summary className="cursor-pointer list-none px-4 py-3 font-medium text-[#6B0F1A] flex items-center justify-between hover:bg-[#fdf8ec] rounded-lg">
        <span className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 opacity-0" />
          {q}
        </span>
        <span className="text-[#D4AF37] group-open:rotate-45 transition-transform text-xl leading-none">+</span>
      </summary>
      <div className="px-4 pb-4 pt-1 text-gray-700 text-sm">{a}</div>
    </details>
  )
}
