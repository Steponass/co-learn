'use client'

import { useRouter } from 'next/navigation'

type Props = {
  userEmail: string
  role: 'admin' | 'facilitator' | 'participant' | null
}

export default function ClientDashboard({ userEmail, role }: Props) {
  const router = useRouter()

  const handleClick = () => {
    router.push('/hostsession')
  }

  return (
    <div>
      <h1>My safe spaaaace.</h1>
      <h2>Welcome, {userEmail}!</h2>

      {role === 'admin' && <p>You DA BIG BOSS!</p>}
      {role === 'facilitator' && <p>You DA FACILITATOR</p>}
      {role === 'participant' && <p>YOU LEARN STUFF, SOMETIMES</p>}

      {role === 'facilitator' && (
        <button onClick={handleClick}>
          Host a session
        </button>
      )}
    </div>
  )
}
