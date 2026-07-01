import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import GuestLayout from '../components/layouts/GuestLayout';
import AdminLayout from '../components/layouts/AdminLayout';
import ManagerLayout from '../components/layouts/ManagerLayout';
import EngineerLayout from '../components/layouts/EngineerLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';

import Home from '../pages/guest/Home';
import Login from '../pages/guest/Login';
import Register from '../pages/guest/Register';
import ForgotPassword from '../pages/guest/ForgotPassword';
import ResetPassword from '../pages/guest/ResetPassword';
import VerifyEmail from '../pages/guest/VerifyEmail';
import Legal from '../pages/guest/Legal';
import AdminDashboard from '../pages/admin/Dashboard';
import AdminUsers from '../pages/admin/Users';
import ManagerProjects from '../pages/manager/Projects';
import AssignTasks from '../pages/manager/AssignTasks';
import EngineerTasks from '../pages/engineer/MyTasks';
import Settings from '../pages/shared/Settings';
import Reports from '../pages/shared/Reports';
import Forbidden from '../pages/shared/Forbidden';
import Account from '../pages/shared/Account';
import ActivityLogs from '../pages/admin/ActivityLogs';
import Contacts from '../pages/admin/Contacts';
import EngineerDashboard from '../pages/engineer/Dashboard';
import TaskCalendar from '../pages/engineer/Calendar';
import TaskRequests from '../pages/shared/TaskRequests';
import Incidents from '../pages/shared/Incidents';
import Documents from '../pages/shared/Documents';
import ManagerDashboard from '../pages/manager/Dashboard';
import ManagerSchedule from '../pages/manager/Schedule';
import ManagerAnalytics from '../pages/manager/Analytics';
import ProjectWorkspace from '../pages/manager/ProjectWorkspace';
import AwsServices from '../pages/admin/AwsServices';
import DeletedUsers from '../pages/admin/DeletedUsers';
import ManagerAssignments from '../pages/shared/ManagerAssignments';
import UserDeletionRequests from '../pages/manager/UserDeletionRequests';

function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Guest routes */}
                <Route element={<GuestLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/terms" element={<Legal type="terms" />} />
                    <Route path="/privacy" element={<Legal type="privacy" />} />
                </Route>

                {/* Admin routes */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <AdminLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="projects" element={<ManagerProjects />} />
                    <Route path="tasks" element={<AssignTasks />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="requests" element={<TaskRequests />} />
                    <Route path="incidents" element={<Incidents />} />
                    <Route path="documents" element={<Documents />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="activity" element={<ActivityLogs />} />
                    <Route path="contacts" element={<Contacts />} />
                    <Route path="aws" element={<AwsServices />} />
                    <Route path="manager-assignments" element={<ManagerAssignments />} />
                    <Route path="deleted-users" element={<DeletedUsers />} />
                    <Route path="account" element={<Account />} />
                    <Route path="settings" element={<Settings />} />
                    <Route index element={<Navigate to="dashboard" replace />} />
                </Route>

                {/* Manager routes */}
                <Route
                    path="/manager"
                    element={
                        <ProtectedRoute allowedRoles={['manager']}>
                            <ManagerLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="dashboard" element={<ManagerDashboard />} />
                    <Route path="projects" element={<ManagerProjects />} />
                    <Route path="projects/:id" element={<ProjectWorkspace />} />
                    <Route path="tasks" element={<AssignTasks />} />
                    <Route path="schedule" element={<ManagerSchedule />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="requests" element={<TaskRequests />} />
                    <Route path="incidents" element={<Incidents />} />
                    <Route path="documents" element={<Documents />} />
                    <Route path="analytics" element={<ManagerAnalytics />} />
                    <Route path="assignments" element={<ManagerAssignments />} />
                    <Route path="user-deletions" element={<UserDeletionRequests />} />
                    <Route path="account" element={<Account />} />
                    <Route path="settings" element={<Settings />} />
                    <Route index element={<Navigate to="dashboard" replace />} />
                </Route>

                {/* Engineer routes */}
                <Route
                    path="/engineer"
                    element={
                        <ProtectedRoute allowedRoles={['engineer']}>
                            <EngineerLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="dashboard" element={<EngineerDashboard />} />
                    <Route path="tasks" element={<EngineerTasks />} />
                    <Route path="calendar" element={<TaskCalendar />} />
                    <Route path="requests" element={<TaskRequests />} />
                    <Route path="incidents" element={<Incidents />} />
                    <Route path="documents" element={<Documents />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="account" element={<Account />} />
                    <Route path="settings" element={<Settings />} />
                    <Route index element={<Navigate to="dashboard" replace />} />
                </Route>

                <Route path="/403" element={<Forbidden />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRouter;
