import { Navigate, Route } from "react-router";
import { all_routes } from "./all_routes";
import { lazy, Suspense } from "react";
const AdminDashboard = lazy(() => import("../pages/dashboard"));
const AdminLogin = lazy(() => import("../pages/login"));
const AdminBusinesses = lazy(() => import("../pages/businesses"));
const AdminSpecialities = lazy(() => import("../pages/policies"));
const AdminAgents = lazy(() => import("../pages/agents"));
const AdminClients = lazy(() => import("../pages/clients"));
const AdminSettings = lazy(() => import("../pages/settings"));
const AdminProfile = lazy(() => import("../pages/profile/Profile"));
const AdminRegister = lazy(() => import("../pages/register"));
const AdminForgotPassword = lazy(() => import("../pages/forgotpassword"));
const AdminLockscreen = lazy(() => import("../pages/lockscreen"));

const AdminOTP = lazy(() => import("../pages/otp"));
const AdminWhitelist = lazy(() => import("../pages/whitelist"));
const AdminResetPassword = lazy(() => import("../pages/reset-password"));

const route = all_routes;

const suspenseFallback = <div></div>;

export const publicRoutes = [
  {
    path: "/",
    name: "Root",
    element: <Navigate to={route.adminDashboard} />,
    route: Route,
  },
  {
    id: "1",
    path: route.adminDashboard,
    element: (
      <Suspense fallback={suspenseFallback}>
        <AdminDashboard />
      </Suspense>
    ),
    route: Route,
  },
  {
  path: "/businesses",
  element: (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminBusinesses />
    </Suspense>
  ),
  route: Route,
  meta_title: "businesses",
},
  {
    id: "3",
    path: route.adminspecialities,
    element: (
      <Suspense fallback={suspenseFallback}>
        <AdminSpecialities />
      </Suspense>
    ),
    route: Route,
  },
  {
  path: "/agents",
  element: (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminAgents />
    </Suspense>
  ),
  route: Route,
  meta_title: "Agents",
},
  {
  path: "/clients",
  element: (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminClients />
    </Suspense>
  ),
  route: Route,
  meta_title: "clients",
},
  {
    id: "8",
    path: route.adminSettings,
    element: (
      <Suspense fallback={suspenseFallback}>
        <AdminSettings />
      </Suspense>
    ),
    route: Route,
  },
  {
    id: "10",
    path: route.adminProfile,
    element: (
      <Suspense fallback={suspenseFallback}>
        <AdminProfile />
      </Suspense>
    ),
    route: Route,
  },
  {
  id: "whitelist",
  path: "/whitelist",
  element: (
    <Suspense fallback={suspenseFallback}>
      <AdminWhitelist />
    </Suspense>
  ),
  route: Route,
  meta_title: "Whitelist Management",
},
];

export const authRoutes = [
  {
    id: "1",
    path: route.adminLogin,
    element: (
      <Suspense fallback={suspenseFallback}>
        <AdminLogin />
      </Suspense>
    ),
    route: Route,
  },
  
  {
    id: "2",
    path: route.adminRegister,
    element: (
      <Suspense fallback={suspenseFallback}>
        <AdminRegister />
      </Suspense>
    ),
    route: Route,
  },
  {
    id: "3",
    path: route.adminForgotPassword,
    element: (
      <Suspense fallback={suspenseFallback}>
        <AdminForgotPassword />
      </Suspense>
    ),
    route: Route,
  },
  {
    id: "5",
    path: route.adminLockscreen,
    element: (
      <Suspense fallback={suspenseFallback}>
        <AdminLockscreen />
      </Suspense>
    ),
    route: Route,
  },
  {
    id: "otp",
    path: "/otp",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <AdminOTP />
      </Suspense>
    ),
    route: Route,
  },

  {
  id: "reset-password",
  path: "/reset-password",
  element: (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminResetPassword />
    </Suspense>
  ),
  route: Route,
},
];
