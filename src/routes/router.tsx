import { Route, Routes } from "react-router";
import {  authRoutes, publicRoutes } from "./router.link";
import MainLayout from "../layouts/adminLayout";
import AuthLayout from "../layouts/authLayout";


const ALLRoutes: React.FC = () => {
  return (
    <>
      <Routes>
        <Route element={<MainLayout />}>
          {publicRoutes.map((route, idx) => (
            <Route path={route.path} element={route.element} key={idx} />
          ))}
        </Route>

        <Route element={<AuthLayout />}>
          {authRoutes.map((route, idx) => (
            <Route path={route.path} element={route.element} key={idx} />
          ))}
        </Route>
      </Routes>
    </>
  );
};

export default ALLRoutes;
