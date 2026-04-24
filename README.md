# UPHSDM Teacher Learning Management System

A fully functional Learning Management System (LMS) for the **University of Perpetual Help System DALTA — Molino Campus**, built as a high-fidelity interactive prototype following HCI principles and the institution's grading framework.

## Features

### Grading System
Implements the exact grading formula from the Grade Report for FINALE:
- **CLASS PERFORMANCE (70%)** = Attendance×10% + Class Participation×10% + Quizzes Avg×30% + RA/Research Avg×50%
- **FINALE GRADE** = CLASS PERFORMANCE × 70% + Major Exam TPS × 30%
- Automatic GWA transmutation (1.00–5.00 Philippine grading scale)
- Color-coded: yellow = input fields, purple = computed fields, blue = final grades

### HCI Compliance
- **Login page** with eye icon to toggle password visibility
- **Inline error messages** with alert icons and highlighted fields
- **Email validation** with specific error message when `@` is missing
- **Question mark (?) tooltips** on every field explaining its purpose
- **Responsive design** — works on desktop, tablet, and mobile
- **Breadcrumb navigation** and clear back buttons

### Management Modules
- **Dashboard** — stats overview, grade distribution charts (Bar + Doughnut), class list
- **Classes** — create, edit, delete classes; grid and list views
- **Grade Sheet** — full tabular grade entry per class; auto-computed grades; individual score cards with expandable detail
- **Students** — enroll, edit, remove students; grid and list views with grade summary
- **Activities** — manage assignments, research tasks, projects, quizzes; filter by type and status
- **Exams** — dedicated view for exam management

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start (React 19) |
| Routing | TanStack Router v1 (file-based) |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| Charts | Chart.js + react-chartjs-2 |
| Icons | Lucide React |
| Deployment | Netlify |
| Data | localStorage (client-side persistence) |

## Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The dev server runs at `http://localhost:3000`.

## Demo Login

| Field | Value |
|-------|-------|
| Email | `homer.favenir@uphsd.edu.ph` |
| Password | `uphsd2025` |

## Grading Formula Reference

```
Attendance Grade = (present weeks / 6) × 100

CLASS PERFORMANCE =
  (Attendance Grade × 0.10) +
  (Class Participation × 0.10) +
  (Quiz Average [QE1–QE4] × 0.30) +
  (RA/Research Average [RA1–RA4] × 0.50)

FINALE GRADE = round(CLASS PERFORMANCE × 0.70 + Major Exam TPS × 0.30)
```

GWA Transmutation: 97–100→1.00, 94–96→1.25, 91–93→1.50, 88–90→1.75, 85–87→2.00, 82–84→2.25, 79–81→2.50, 76–78→2.75, 75→3.00, below 75→5.00 (Failed)
