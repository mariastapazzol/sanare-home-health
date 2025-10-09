import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { CareContextProvider } from "@/hooks/use-care-context";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Welcome from "./pages/Welcome";
import Auth from "./pages/Auth";
import AuthChoice from "./pages/AuthChoice";
import SignupAutocuidado from "./pages/SignupAutocuidado";
import SignupCuidador from "./pages/SignupCuidador";
import SignupDependenteStep from "./pages/SignupDependenteStep";
import Profile from "./pages/Profile";
import MeusDependentes from "./pages/MeusDependentes";
import Medicamentos from "./pages/Medicamentos";
import NovoMedicamento from "./pages/NovoMedicamento";
import Estoque from "./pages/Estoque";
import Diary from "./pages/Diary";
import DiaryWrite from "./pages/DiaryWrite";
import DiaryRecords from "./pages/DiaryRecords";
import DiarySelectMood from "./pages/DiarySelectMood";

import Home from "./pages/Home";
import Lembretes from "./pages/Lembretes";
import NovoLembrete from "./pages/NovoLembrete";
import Sintomas from "./pages/Sintomas";
import NovoSintoma from "./pages/NovoSintoma";
import NovoSinalVital from "./pages/NovoSinalVital";
import ChecklistDiario from "./pages/ChecklistDiario";
import ChecklistHistorico from "./pages/ChecklistHistorico";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CareContextProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/choice" element={<AuthChoice />} />
              <Route path="/auth/signup-autocuidado" element={<SignupAutocuidado />} />
              <Route path="/auth/signup-cuidador" element={<SignupCuidador />} />
              <Route path="/auth/signup-dependente" element={
                <ProtectedRoute>
                  <SignupDependenteStep />
                </ProtectedRoute>
              } />
              
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
              <Route path="/meus-dependentes" element={
                <ProtectedRoute>
                  <MeusDependentes />
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
            <Route path="/medicamentos/editar/:id" element={
              <ProtectedRoute>
                <NovoMedicamento />
              </ProtectedRoute>
            } />
            <Route path="/estoque" element={
              <ProtectedRoute>
                <Estoque />
              </ProtectedRoute>
            } />
            <Route path="/diario" element={
              <ProtectedRoute>
                <Diary />
              </ProtectedRoute>
            } />
            <Route path="/diario/select-mood" element={
              <ProtectedRoute>
                <DiarySelectMood />
              </ProtectedRoute>
            } />
            <Route path="/diario/write" element={
              <ProtectedRoute>
                <DiaryWrite />
              </ProtectedRoute>
            } />
            <Route path="/diario/records" element={
              <ProtectedRoute>
                <DiaryRecords />
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
            <Route path="/sintomas" element={
              <ProtectedRoute>
                <Sintomas />
              </ProtectedRoute>
            } />
            <Route path="/sintomas/novo" element={
              <ProtectedRoute>
                <NovoSintoma />
              </ProtectedRoute>
            } />
            <Route path="/sinais-vitais/novo" element={
              <ProtectedRoute>
                <NovoSinalVital />
              </ProtectedRoute>
            } />
            <Route path="/checklist" element={
              <ProtectedRoute>
                <ChecklistDiario />
              </ProtectedRoute>
            } />
            <Route path="/checklist/historico" element={
              <ProtectedRoute>
                <ChecklistHistorico />
              </ProtectedRoute>
            } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CareContextProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
