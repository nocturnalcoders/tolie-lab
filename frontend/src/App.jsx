import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Course from './pages/Course.jsx';
import Login from './pages/Login.jsx';
import MyCourses from './pages/MyCourses.jsx';
import Verify from './pages/Verify.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import NotFound from './pages/NotFound.jsx';
import CertificatePage, { CertificateLookup } from './pages/Certificate.jsx';
import AdminGuard from './pages/admin/AdminGuard.jsx';
import AdminHome from './pages/admin/AdminHome.jsx';
import CourseAdmin from './pages/admin/CourseAdmin.jsx';
import LessonAdmin from './pages/admin/LessonAdmin.jsx';
import Layout from './components/Layout.jsx';

// The lesson page carries the code editor, so it is loaded only when a lesson is opened.
const Lesson = lazy(() => import('./pages/Lesson.jsx'));

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/kursus/:course" element={<Course />} />
      <Route
        path="/kursus/:course/:lesson"
        element={
          <Suspense fallback={<Layout><p className="note">Memuat pelajaran…</p></Layout>}>
            <Lesson />
          </Suspense>
        }
      />
      <Route path="/masuk" element={<Login />} />
      <Route path="/belajar" element={<MyCourses />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/lupa-password" element={<ForgotPassword />} />
      <Route path="/reset" element={<ResetPassword />} />
      <Route path="/verifikasi" element={<CertificateLookup />} />
      <Route path="/verifikasi/:id" element={<CertificatePage />} />
      <Route path="/admin" element={<AdminGuard><AdminHome /></AdminGuard>} />
      <Route path="/admin/kursus/:id" element={<AdminGuard><CourseAdmin /></AdminGuard>} />
      <Route path="/admin/pelajaran/:id" element={<AdminGuard><LessonAdmin /></AdminGuard>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
