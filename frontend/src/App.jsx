import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import OnboardingGuide from './components/OnboardingGuide'
import { Analytics } from '@vercel/analytics/react'

function analyticsBeforeSend(event) {
  const url = new URL(event.url)
  if (url.pathname.startsWith('/reset-password/')) return null
  url.search = ''
  url.hash = ''
  return { ...event, url: url.toString() }
}

import ResidentLayout from './components/ResidentLayout'
import ResidentDashboard from './pages/ResidentDashboard'
import Notifications from './pages/Notifications'
import Landing from './pages/Landing'
import PasswordReset from './pages/PasswordReset'
import Login from './pages/Login'
import Register from './pages/Register'

import GuardDashboard from './pages/GuardDashboard'
import AdminDashboard from './pages/AdminDashboard'

import Community from './pages/Community'
import Services from './pages/Services'
import Gate from './pages/Gate'
import Estate from './pages/Estate'
import Profile from './pages/Profile'

import PostTask from './pages/PostTask'
import JobDetails from './pages/JobDetails'
import MyTasks from './pages/MyTasks'
import MyWork from './pages/MyWork'

function DashboardRouter() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />

  if (user.role === 'GATE_SECURITY') {
    return <GuardDashboard />
  }
  if (user.role === 'ESTATE_ADMIN') {
    return <AdminDashboard />
  }
  return <ResidentLayout />
}

function App() {
  return (
    <BrowserRouter>
      {import.meta.env.PROD && <Analytics beforeSend={analyticsBeforeSend} />}
      <AuthProvider>
        <OnboardingGuide />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<PasswordReset />} />
          <Route path="/reset-password" element={<PasswordReset />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>}>
            <Route path="/dashboard" element={<ResidentDashboard />} />
          </Route>
          <Route element={<ProtectedRoute><ResidentLayout /></ProtectedRoute>}>
            <Route path="/community" element={<Community />} />
            <Route path="/services" element={<Services />} />
            <Route path="/gate" element={<Gate />} />
            <Route path="/estate" element={<Estate />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
          </Route>

          {/* Dedicated Dashboards */}
          <Route
            path="/guard-dashboard"
            element={
              <ProtectedRoute roles={['GATE_SECURITY']}>
                <GuardDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute roles={['ESTATE_ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Helpers */}
          <Route path="/home" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/post-task"
            element={
              <ProtectedRoute>
                <PostTask />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/:id"
            element={
              <ProtectedRoute>
                <JobDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-tasks"
            element={
              <ProtectedRoute>
                <MyTasks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-work"
            element={
              <ProtectedRoute>
                <MyWork />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
