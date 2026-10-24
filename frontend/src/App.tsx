import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import CenterLayout from './layouts/CenterLayout';
import AdminLayout from './layouts/AdminLayout';
import StudentLayout from './layouts/StudentLayout';

// Public Pages (Code-Split)
const Home = lazy(() => import('./pages/public/Home'));
const About = lazy(() => import('./pages/public/About'));
const Courses = lazy(() => import('./pages/public/Courses'));
const Contact = lazy(() => import('./pages/public/Contact'));
const Centers = lazy(() => import('./pages/public/Centers'));
const Gallery = lazy(() => import('./pages/public/Gallery'));
const StudyMaterialLibrary = lazy(() => import('./pages/public/StudyMaterialLibrary'));
const StudyMaterialPreview = lazy(() => import('./pages/public/StudyMaterialPreview'));
const StudentLogin = lazy(() => import('./pages/public/StudentLogin'));
const CenterLogin = lazy(() => import('./pages/public/CenterLogin'));
const AdminLogin = lazy(() => import('./pages/public/AdminLogin'));
const VerifyStudent = lazy(() => import('./pages/public/VerifyStudent'));
const FranchiseRequirements = lazy(() => import('./pages/public/FranchiseRequirements'));
const FranchiseRegister = lazy(() => import('./pages/public/FranchiseRegister'));
const TermsAndConditions = lazy(() => import('./pages/public/TermsAndConditions'));
const PrivacyPolicy = lazy(() => import('./pages/public/PrivacyPolicy'));
const CandidateTestPortal = lazy(() => import('./pages/public/CandidateTestPortal'));
const TestSeriesPage = lazy(() => import('./pages/public/TestSeriesPage'));

// Center Portal Pages (Code-Split)
const CenterDashboard = lazy(() => import('./pages/center/CenterDashboard'));
const RechargeWallet = lazy(() => import('./pages/center/RechargeWallet'));
const AddCourse = lazy(() => import('./pages/center/AddCourse'));
const CoursesList = lazy(() => import('./pages/center/CoursesList'));
const AddStudent = lazy(() => import('./pages/center/AddStudent'));
const StudentsList = lazy(() => import('./pages/center/StudentsList'));
const ExamsList = lazy(() => import('./pages/center/ExamsList'));
const FreeTestManager = lazy(() => import('./pages/center/FreeTestManager'));
const CenterStudyMaterials = lazy(() => import('./pages/center/CenterStudyMaterials').then(m => ({ default: m.CenterStudyMaterials })));
const TrainingVideos = lazy(() => import('./pages/center/TrainingVideos'));

// Admin Portal Pages (Code-Split)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const HomeSettings = lazy(() => import('./pages/admin/HomeSettings'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const CreateCenter = lazy(() => import('./pages/admin/CreateCenter'));
const WalletRequests = lazy(() => import('./pages/admin/WalletRequests'));
const AdminStudents = lazy(() => import('./pages/admin/AdminStudents'));
const Broadcast = lazy(() => import('./pages/admin/Broadcast'));
const BackupExport = lazy(() => import('./pages/admin/BackupExport'));
const FranchiseRequests = lazy(() => import('./pages/admin/FranchiseRequests'));
const ContactQueries = lazy(() => import('./pages/admin/ContactQueries'));
const TestPricingSettings = lazy(() => import('./pages/admin/TestPricingSettings'));
const TestSeriesManagement = lazy(() => import('./pages/admin/TestSeriesManagement'));
const AdminCourses = lazy(() => import('./pages/admin/AdminCourses'));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'));

// Student Portal Pages (Code-Split)
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const StudentTestSeries = lazy(() => import('./pages/student/StudentTestSeries'));
const StudentWallet = lazy(() => import('./pages/student/StudentWallet'));
const StudentPasses = lazy(() => import('./pages/student/StudentPasses'));
const StudentReferral = lazy(() => import('./pages/student/StudentReferral'));
const StudentExamPortal = lazy(() => import('./pages/student/exam/StudentExamPortal'));

import ScrollToTop from './components/ScrollToTop';
import { ToastContainer } from './components/ui/Toast';
import { Toaster } from 'react-hot-toast';

// Modern Route Loading Skeleton Fallback
const PageLoadingFallback = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-3">
    <div className="w-10 h-10 border-3 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
    <span className="text-xs font-bold text-slate-500 tracking-wide uppercase">Loading Page...</span>
  </div>
);

function App() {
  return (
    <>
      <ScrollToTop />
      <ToastContainer />
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={10}
        toastOptions={{
          duration: 3500,
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            padding: '12px 18px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '600',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.25)',
          },
          success: {
            duration: 3500,
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
            style: {
              background: '#064e3b',
              border: '1px solid #059669',
              color: '#ecfdf5',
            },
          },
          error: {
            duration: 4500,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
            style: {
              background: '#4c0519',
              border: '1px solid #e11d48',
              color: '#fff1f2',
            },
          },
        }}
      />
      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          {/* Public Routes */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="courses" element={<Courses />} />
          <Route path="test-series" element={<TestSeriesPage />} />
          <Route path="centers" element={<Centers />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="notes" element={<StudyMaterialLibrary />} />
          <Route path="notes/:id" element={<StudyMaterialPreview />} />
          <Route path="contact" element={<Contact />} />
          <Route path="terms" element={<TermsAndConditions />} />
          <Route path="terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="privacy" element={<PrivacyPolicy />} />
          <Route path="privacy-policy" element={<PrivacyPolicy />} />
          <Route path="franchise/requirements" element={<FranchiseRequirements />} />
          <Route path="login/student" element={<StudentLogin />} />

          <Route path="franchise/register" element={<FranchiseRegister />} />
          <Route path="franchise" element={<FranchiseRequirements />} />
          <Route path="login/center" element={<CenterLogin />} />
          <Route path="login/admin" element={<AdminLogin />} />
          <Route path="verify" element={<VerifyStudent />} />
          <Route path="verify/:identifier" element={<VerifyStudent />} />
          <Route path="verify/student" element={<VerifyStudent />} />
          <Route path="verify/student/:identifier" element={<VerifyStudent />} />
          <Route path="student/verify/:identifier" element={<VerifyStudent />} />
          <Route path="verify/certificate" element={<VerifyStudent />} />
          <Route path="verify/certificate/:identifier" element={<VerifyStudent />} />
          <Route path="verify/center" element={<Centers />} />
          <Route path="verify/center/:identifier" element={<Centers />} />
        </Route>

        {/* Candidate Live Online Test Portal */}
        <Route path="/test/:uid" element={<CandidateTestPortal />} />
        <Route path="/test/live/:uid" element={<CandidateTestPortal />} />

        {/* Center Dashboard Routes */}
        <Route path="/center" element={<CenterLayout />}>
          <Route index element={<CenterDashboard />} />
          <Route path="wallet" element={<RechargeWallet />} />
          <Route path="add-course" element={<AddCourse />} />
          <Route path="courses" element={<CoursesList />} />
          <Route path="add-student" element={<AddStudent />} />
          <Route path="students" element={<StudentsList />} />
          <Route path="exams" element={<ExamsList />} />
          <Route path="free-tests" element={<FreeTestManager />} />
          <Route path="study-materials" element={<CenterStudyMaterials />} />
          <Route path="videos" element={<TrainingVideos />} />
        </Route>


        {/* Super Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="franchise-requests" element={<FranchiseRequests />} />
          <Route path="contact-queries" element={<ContactQueries />} />
          <Route path="centers/create" element={<CreateCenter />} />
          <Route path="wallet-requests" element={<WalletRequests />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="broadcast" element={<Broadcast />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="test-series" element={<TestSeriesManagement />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="test-pricing" element={<TestPricingSettings />} />
          <Route path="backup-export" element={<BackupExport />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="settings/home" element={<HomeSettings />} />
        </Route>

        {/* Student Routes */}
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<StudentDashboard />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="test-series" element={<StudentTestSeries />} />
          <Route path="passes" element={<StudentPasses />} />
          <Route path="wallet" element={<StudentWallet />} />
          <Route path="refer" element={<StudentReferral />} />
          <Route path="notes" element={<StudyMaterialLibrary />} />
          <Route path="notes/:id" element={<StudyMaterialPreview />} />
          <Route path="exam/:examId" element={<StudentExamPortal />} />
        </Route>
      </Routes>
    </Suspense>
    </>
  );
}

export default App;
