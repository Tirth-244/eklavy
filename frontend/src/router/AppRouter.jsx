import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'
import RoleRoute from '../components/RoleRoute'

import Login from '../pages/auth/Login'
import Signup from '../pages/auth/Signup'
import Home from '../pages/home/Home'
import UserHome from '../pages/home/UserHome'
import CoursePage from '../pages/course/CoursePage'
import DemoPage from '../pages/course/DemoPage'
import StudentDashboard from '../pages/dashboard/StudentDashboard'
import TeacherDashboard from '../pages/dashboard/TeacherDashboard'
import PaymentSuccess from '../pages/payment/PaymentSuccess'

const AppRouter = () => (
  <Routes>
    {/* ── Public routes (no login required) ── */}
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />

    {/* ── Protected user home ── */}
    <Route path="/home" element={
      <ProtectedRoute>
        <UserHome />
      </ProtectedRoute>
    } />

    {/* ── Public demo lecture pages ── */}
    <Route path="/course/:subject/demo" element={<DemoPage />} />

    {/* ── Protected routes (any authenticated user) ── */}
    <Route element={<ProtectedRoute />}>
      <Route path="/course/:subject" element={<CoursePage />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
    </Route>

    {/* ── Student dashboard at /user ── */}
    <Route element={<ProtectedRoute />}>
      <Route element={<RoleRoute role="student" />}>
        <Route path="/user" element={<StudentDashboard />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
      </Route>
    </Route>

    {/* ── Teacher-only routes ── */}
    <Route element={<ProtectedRoute />}>
      <Route element={<RoleRoute role="teacher" fallback="/" />}>
        <Route path="/admin/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>
    </Route>

    {/* ── 404 fallback ── */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
)

export default AppRouter
