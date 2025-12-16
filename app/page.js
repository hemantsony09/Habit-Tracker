'use client'

import { useAuth } from '@/src/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import HabitTracker from '@/src/components/HabitTracker'
import TaskList from '@/src/components/TaskList'
import '@/src/App.css'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('habits')
  const { logout, currentUser, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login')
    }
  }, [currentUser, loading, router])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="App">
      <div className="app-header">
        <div className="tab-navigation">
          <button 
            className={activeTab === 'habits' ? 'active' : ''}
            onClick={() => setActiveTab('habits')}
          >
            Habit Tracker
          </button>
          <button 
            className={activeTab === 'tasks' ? 'active' : ''}
            onClick={() => setActiveTab('tasks')}
          >
            Task List
          </button>
        </div>
        <div className="user-info">
          <span className="user-name">{currentUser?.displayName || currentUser?.email}</span>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
      <div className="content">
        {activeTab === 'habits' ? <HabitTracker /> : <TaskList />}
      </div>
    </div>
  )
}

