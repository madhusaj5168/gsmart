import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Marketplace from "./pages/Marketplace";
import CourseDetail from "./pages/CourseDetail";
import Payment from "./pages/Payment";
import PaymentStatus from "./pages/PaymentStatus";
import StudentDashboard from "./pages/StudentDashboard";
import LearningPlayer from "./pages/LearningPlayer";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCourseEditor from "./pages/AdminCourseEditor";
import AdminTestSeries from "./pages/AdminTestSeries";
import AdminTestEditor from "./pages/AdminTestEditor";
import StudentTests from "./pages/StudentTests";
import TakeTest from "./pages/TakeTest";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/courses" element={<Marketplace />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="/pay/:id" element={<ProtectedRoute role="student"><Payment /></ProtectedRoute>} />
            <Route path="/pay/:id/status" element={<ProtectedRoute role="student"><PaymentStatus /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
            <Route path="/learn/:id" element={<ProtectedRoute role="student"><LearningPlayer /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/courses/:id" element={<ProtectedRoute role="admin"><AdminCourseEditor /></ProtectedRoute>} />
            <Route path="/admin/tests" element={<ProtectedRoute role="admin"><AdminTestSeries /></ProtectedRoute>} />
            <Route path="/admin/tests/:id" element={<ProtectedRoute role="admin"><AdminTestEditor /></ProtectedRoute>} />
            <Route path="/tests" element={<ProtectedRoute role="student"><StudentTests /></ProtectedRoute>} />
            <Route path="/tests/:id" element={<ProtectedRoute role="student"><TakeTest /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
