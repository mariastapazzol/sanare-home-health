import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Welcome from "./pages/Welcome";
import Auth from "./pages/Auth";
import AuthSignup from "./pages/AuthSignup";
import AuthSignupPersonal from "./pages/AuthSignupPersonal";
import AuthSignupCaregiver from "./pages/AuthSignupCaregiver";
import Profile from "./pages/Profile";
import Medicamentos from "./pages/Medicamentos";
import NovoMedicamento from "./pages/NovoMedicamento";

import Home from "./pages/Home";
import Lembretes from "./pages/Lembretes";
import NovoLembrete from "./pages/NovoLembrete";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/signup" element={<AuthSignup />} />
            <Route path="/auth/signup/personal" element={<AuthSignupPersonal />} />
            <Route path="/auth/signup/caregiver" element={<AuthSignupCaregiver />} />
            
            <Route path="/home" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/medicamentos" element={
              <ProtectedRoute>
                <Medicamentos />
              </ProtectedRoute>
            } />
            <Route path="/medicamentos/novo" element={
              <ProtectedRoute>
                <NovoMedicamento />
              </ProtectedRoute>
            } />
            <Route path="/lembretes" element={
              <ProtectedRoute>
                <Lembretes />
              </ProtectedRoute>
            } />
            <Route path="/lembretes/novo" element={
              <ProtectedRoute>
                <NovoLembrete />
              </ProtectedRoute>
            } />
            <Route path="/lembretes/editar/:id" element={
              <ProtectedRoute>
                <NovoLembrete />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
