'use client'

import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    if (window.location.pathname === '/') {
      window.location.replace('/index.html')
    }
  }, [])

  return null
}