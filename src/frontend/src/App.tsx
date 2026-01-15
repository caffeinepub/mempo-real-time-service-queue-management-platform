import { useState, useEffect } from 'react';
import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import Header from './components/Header';
import Footer from './components/Footer';
import ProfileSetupModal from './components/ProfileSetupModal';
import BusinessDashboard from './pages/BusinessDashboard';
import CustomerView from './pages/CustomerView';
import SplashScreen from './components/SplashScreen';
import RoleSelectionPage from './pages/RoleSelectionPage';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { UserRole } from './backend';

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}

function MainPage() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const queryClient = useQueryClient();
  const [showSplash, setShowSplash] = useState(true);
  const [showRoleSelection, setShowRoleSelection] = useState(false);

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      if (!isAuthenticated && !isInitializing) {
        setShowRoleSelection(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isInitializing]);

  useEffect(() => {
    if (!isAuthenticated && !isInitializing && !showSplash) {
      setShowRoleSelection(true);
    } else if (isAuthenticated) {
      setShowRoleSelection(false);
    }
  }, [isAuthenticated, isInitializing, showSplash]);

  const handleProfileComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
  };

  const handleRoleSelectionComplete = () => {
    setShowRoleSelection(false);
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  if (showRoleSelection && !isAuthenticated) {
    return <RoleSelectionPage onComplete={handleRoleSelectionComplete} />;
  }

  if (!isAuthenticated) {
    return <RoleSelectionPage onComplete={handleRoleSelectionComplete} />;
  }

  return (
    <Layout>
      {isAuthenticated && userProfile?.role === UserRole.businessOwner ? (
        <BusinessDashboard />
      ) : (
        <CustomerView />
      )}
      <ProfileSetupModal open={showProfileSetup} onComplete={handleProfileComplete} />
    </Layout>
  );
}

function RootComponent() {
  const { isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Memuat MEMPO...</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

function IndexComponent() {
  return <MainPage />;
}

const rootRoute = createRootRoute({
  component: RootComponent,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexComponent,
});

const routeTree = rootRoute.addChildren([indexRoute]);

const router = createRouter({ routeTree });

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
