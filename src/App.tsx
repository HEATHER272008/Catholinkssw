import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { TranslationProvider } from "@/hooks/useTranslation";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import StudentQRCode from "./pages/StudentQRCode";
import StudentOfflineQR from "./pages/StudentOfflineQR";
import StudentAttendance from "./pages/StudentAttendance";
import StudentProfile from "./pages/StudentProfile";
import AdminScanner from "./pages/AdminScanner";
import AdminAttendance from "./pages/AdminAttendance";
import AdminQRGenerator from "./pages/AdminQRGenerator";
import AdminAttendanceOverview from "./pages/AdminAttendanceOverview";
import StudentAttendanceSummary from "./pages/StudentAttendanceSummary";
import AdminStudentProfiles from "./pages/AdminStudentProfiles";
import LateComers from "./pages/LateComers";
import AppRatings from "./pages/AppRatings";
import AdminRatings from "./pages/AdminRatings";
import AdminTaskManager from "./pages/AdminTaskManager";
import AdminReminderSystem from "./pages/AdminReminderSystem";
import AdminParticipationTracker from "./pages/AdminParticipationTracker";
import AdminGroupOrganizer from "./pages/AdminGroupOrganizer";
import AdminPerformanceAnalytics from "./pages/AdminPerformanceAnalytics";
import AdminLessonMaterials from "./pages/AdminLessonMaterials";
import AdminSubstitutePlan from "./pages/AdminSubstitutePlan";
import StudentTasks from "./pages/StudentTasks";
import StudentMaterials from "./pages/StudentMaterials";
import AdminCalendar from "./pages/AdminCalendar";
import MusicMap from "./pages/MusicMap";
import StudentCalendar from "./pages/StudentCalendar";
import StudentExcuses from "./pages/StudentExcuses";
import AdminExcuses from "./pages/AdminExcuses";
import AdminOnlineUsers from "./pages/AdminOnlineUsers";
import SettingsHelp from "./pages/SettingsHelp";
import SettingsStorage from "./pages/SettingsStorage";
import SettingsAccount from "./pages/SettingsAccount";

import Terms from "./pages/Terms";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import Install from "./pages/Install";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TranslationProvider>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/student/qr-code" element={<StudentQRCode />} />
            <Route path="/student/offline-qr" element={<StudentOfflineQR />} />
            <Route path="/student/attendance" element={<StudentAttendance />} />
            <Route path="/student/attendance-summary" element={<StudentAttendanceSummary />} />
            <Route path="/student/profile" element={<StudentProfile />} />
            <Route path="/admin/scanner" element={<AdminScanner />} />
            <Route path="/admin/attendance" element={<AdminAttendance />} />
            <Route path="/admin/students" element={<AdminStudentProfiles />} />
            <Route path="/admin/qr-generator" element={<AdminQRGenerator />} />
            <Route path="/admin/attendance-overview" element={<AdminAttendanceOverview />} />
            <Route path="/admin/late-comers" element={<LateComers />} />
            <Route path="/ratings" element={<AppRatings />} />
            <Route path="/admin/ratings" element={<AdminRatings />} />
            <Route path="/admin/tasks" element={<AdminTaskManager />} />
            <Route path="/admin/reminders" element={<AdminReminderSystem />} />
            <Route path="/admin/participation" element={<AdminParticipationTracker />} />
            <Route path="/admin/groups" element={<AdminGroupOrganizer />} />
            <Route path="/admin/performance" element={<AdminPerformanceAnalytics />} />
            <Route path="/admin/materials" element={<AdminLessonMaterials />} />
            <Route path="/admin/substitute" element={<AdminSubstitutePlan />} />
            <Route path="/student/tasks" element={<StudentTasks />} />
            <Route path="/student/materials" element={<StudentMaterials />} />
            <Route path="/admin/calendar" element={<AdminCalendar />} />
            <Route path="/student/calendar" element={<StudentCalendar />} />
            <Route path="/student/excuses" element={<StudentExcuses />} />
            <Route path="/admin/excuses" element={<AdminExcuses />} />
            <Route path="/admin/online" element={<AdminOnlineUsers />} />
            <Route path="/settings/help" element={<SettingsHelp />} />
            <Route path="/settings/storage" element={<SettingsStorage />} />
            <Route path="/settings/account" element={<SettingsAccount />} />
            <Route path="/music-map" element={<MusicMap />} />
            
            <Route path="/terms" element={<Terms />} />
            <Route path="/about" element={<About />} />
            <Route path="/install" element={<Install />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </TranslationProvider>
  </QueryClientProvider>
);

export default App;
