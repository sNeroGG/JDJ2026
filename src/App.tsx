import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ContentProvider } from "./context/ContentContext";
import { AdminPage } from "./pages/AdminPage";
import { LandingPage } from "./pages/LandingPage";

function App() {
  return (
    <ContentProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ContentProvider>
  );
}

export default App;
