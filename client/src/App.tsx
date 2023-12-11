import React, { ReactNode } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashBoard from "./features/dashboard/DashBoard";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";

interface ProtectedProps {
  children: ReactNode;
  auth: boolean;
}

const Protected: React.FC<ProtectedProps> = ({ children, auth = false }) => {
  const isLoggin = sessionStorage.getItem("user:token");
  if (!isLoggin && auth) {
    return <Navigate to="/login" replace={true} />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <div>
      <Routes>
        <Route
          path="/"
          element={
            <Protected auth={true}>
              <DashBoard />
            </Protected>
          }
        />

        <Route
          path="/login"
          element={
            <Protected auth={false}>
              <LoginPage />
            </Protected>
          }
        />

        <Route
          path="/signup"
          element={
            <Protected auth={false}>
              <SignUpPage />
            </Protected>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
