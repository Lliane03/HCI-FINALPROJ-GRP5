import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  const navigate = useNavigate()
  useEffect(() => {
    const auth = localStorage.getItem('lms_auth')
    if (auth) {
      navigate({ to: '/dashboard' })
    } else {
      navigate({ to: '/login' })
    }
  }, [])
  return null
}
