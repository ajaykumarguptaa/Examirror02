import { Routes, Route } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import CenterLayout from './layouts/CenterLayout';
import AdminLayout from './layouts/AdminLayout';

import Home from './pages/public/Home';
import About from './pages/public/About';
import Courses from './pages/public/Courses';
import Contact from './pages/public/Contact';
import Centers from './pages/public/Centers';
import Gallery from './pages/public/Gallery';
import StudyMaterialLibrary from './pages/public/StudyMaterialLibrary';
import StudyMaterialPreview from './pages/public/StudyMaterialPreview';
import StudentLogin from "./pages/public/StudentLogin";
import StudentLayout from "./layouts/StudentLayout";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentExamPortal from "./pages/student/exam/StudentExamPortal";


import CenterLogin from './pages/public/CenterLogin';
import AdminLogin from './pages/public/AdminLogin';
import VerifyStudent from './pages/public/VerifyStudent';
import FranchiseRequirements from './pages/public/FranchiseRequirements';
import FranchiseRegister from './pages/public/FranchiseRegister';
import TermsAndConditions from './pages/public/TermsAndConditions';
import PrivacyPolicy from './pages/public/PrivacyPolicy';

import CenterDashboard from './pages/center/CenterDashboard';
import RechargeWallet from './pages/center/RechargeWallet';
import AddCourse from './pages/center/AddCourse';
import AdminCourses from './pages/admin/AdminCourses';
import CoursesList from './pages/center/CoursesList';
import AddStudent from './pages/center/AddStudent';
import StudentsList from './pages/center/StudentsList';
import ExamsList from './pages/center/ExamsList';
import FreeTestManager from './pages/center/FreeTestManager';
import { CenterStudyMaterials } from './pages/center/CenterStudyMaterials';
import TrainingVideos from './pages/center/TrainingVideos';
import CandidateTestPortal from './pages/public/CandidateTestPortal';

import AdminDashboard from './pages/admin/AdminDashboard';
import HomeSettings from './pages/admin/HomeSettings';
import AdminCategories from "./pages/admin/AdminCategories";
import CreateCenter from './pages/admin/CreateCenter';
import WalletRequests from './pages/admin/WalletRequests';
import AdminStudents from './pages/admin/AdminStudents';
import Broadcast from './pages/admin/Broadcast';
import BackupExport from './pages/admin/BackupExport';
import FranchiseRequests from './pages/admin/FranchiseRequests';
import ContactQueries from './pages/admin/ContactQueries';
import TestPricingSettings from './pages/admin/TestPricingSettings';
import TestSeriesManagement from './pages/admin/TestSeriesManagement';
import StudentTestSeries from './pages/student/StudentTestSeries';
import ScrollToTop from './components/ScrollToTop';
import { ToastContainer } from './components/ui/Toast';
import { Toaster } from 'react-hot-toast';

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
      <Routes>
        {/* Public Routes */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="courses" element={<Courses />} />
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
        <Route path="settings/home" element={<HomeSettings />} />
      </Route>

      {/* Student Routes */}
      <Route path="/student" element={<StudentLayout />}>
        <Route index element={<StudentDashboard />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="test-series" element={<StudentTestSeries />} />
        <Route path="exam/:examId" element={<StudentExamPortal />} />
      </Route>
    </Routes>
    </>
  );
}

export default App;
