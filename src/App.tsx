import { Analytics } from "@vercel/analytics/react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { PreviewBanner } from "./components/PreviewBanner";
import { ContentProvider, useContent } from "./context/ContentContext";
import { TeamProvider, useTeam } from "./context/TeamContext";
import { AdminPage } from "./pages/AdminPage";
import { AlbumPage } from "./pages/AlbumPage";
import { CatechesisPage } from "./pages/CatechesisPage";
import { ComingSoonPage } from "./pages/ComingSoonPage";
import { DonatePage } from "./pages/DonatePage";
import { DonateThanksPage } from "./pages/DonateThanksPage";
import { LandingPage } from "./pages/LandingPage";
import { SedeTopicPage } from "./pages/SedeTopicPage";
import { StorePage } from "./pages/StorePage";
import { TeamGatePage } from "./pages/TeamGatePage";
import { ADMIN_ROUTE, isAdminPath } from "./utils/adminRoute";
import {
  isComingSoonActive,
  isPublicSiteLocked,
  shouldShowPreviewBanner,
  useComingSoonClock,
} from "./utils/comingSoon";
import { SEDE_TOPICS } from "./utils/sedeTopics";
import { TEAM_ROUTE, isTeamPath } from "./utils/teamAccess";

function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      {SEDE_TOPICS.map((topic) => (
        <Route
          key={topic.path}
          path={topic.path}
          element={<SedeTopicPage />}
        />
      ))}
      <Route path="/catequesis" element={<CatechesisPage />} />
      <Route path="/recuerdos" element={<AlbumPage />} />
      <Route path="/tienda" element={<StorePage />} />
      <Route path="/donar" element={<DonatePage />} />
      <Route path="/donar/gracias" element={<DonateThanksPage />} />
      <Route path="/admin" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useContent();
  const { isTeamAuthenticated, viewingAsPublic, setViewingAsPublic } = useTeam();
  const { pathname, search } = useLocation();
  const comingSoon = isComingSoonActive();
  const now = useComingSoonClock(comingSoon);
  const stillComingSoon = isComingSoonActive(now);
  const locked =
    (viewingAsPublic && stillComingSoon) ||
    isPublicSiteLocked(isAuthenticated, isTeamAuthenticated, now);

  if (isAdminPath(pathname)) {
    return (
      <Routes>
        <Route path={ADMIN_ROUTE} element={<AdminPage />} />
        <Route path="/admin" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (isTeamPath(pathname)) {
    return (
      <Routes>
        <Route path={TEAM_ROUTE} element={<TeamGatePage />} />
      </Routes>
    );
  }

  if (locked) {
    if (pathname !== "/") {
      return <Navigate to={{ pathname: "/", search }} replace />;
    }
    return (
      <ComingSoonPage
        onBackToInternal={
          viewingAsPublic ? () => setViewingAsPublic(false) : undefined
        }
      />
    );
  }

  return (
    <>
      {shouldShowPreviewBanner(isAuthenticated, isTeamAuthenticated, now) ? (
        <PreviewBanner />
      ) : null}
      <PublicRoutes />
    </>
  );
}

function App() {
  return (
    <ContentProvider>
      <TeamProvider>
        <BrowserRouter>
          <AppRoutes />
          <Analytics
            beforeSend={(event) =>
              isAdminPath(event.url) || isTeamPath(event.url) ? null : event
            }
          />
        </BrowserRouter>
      </TeamProvider>
    </ContentProvider>
  );
}

export default App;
