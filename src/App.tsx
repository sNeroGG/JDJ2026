import { Analytics } from "@vercel/analytics/react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ContentProvider } from "./context/ContentContext";
import { AdminPage } from "./pages/AdminPage";
import { CatechesisPage } from "./pages/CatechesisPage";
import { DonatePage } from "./pages/DonatePage";
import { DonateThanksPage } from "./pages/DonateThanksPage";
import { LandingPage } from "./pages/LandingPage";
import { StorePage } from "./pages/StorePage";

function App() {
  return (
    <ContentProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/catequesis" element={<CatechesisPage />} />
          <Route path="/tienda" element={<StorePage />} />
          <Route path="/donar" element={<DonatePage />} />
          <Route path="/donar/gracias" element={<DonateThanksPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Analytics
          beforeSend={(event) =>
            event.url.includes("/admin") ? null : event
          }
        />
      </BrowserRouter>
    </ContentProvider>
  );
}

export default App;
