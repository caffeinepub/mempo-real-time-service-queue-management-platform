import { useState, useEffect, useRef } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, ShoppingBag, Mail, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { UserRole } from '../backend';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RoleSelectionPageProps {
  onComplete: () => void;
}

export default function RoleSelectionPage({ onComplete }: RoleSelectionPageProps) {
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const { login, loginStatus } = useInternetIdentity();
  const hasTriggeredAuth = useRef(false);

  const isLoggingIn = loginStatus === 'logging-in';

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Automatically trigger authentication when both email and role are selected
  useEffect(() => {
    const triggerAuthentication = async () => {
      // Only trigger once and when both email and role are present
      if (email.trim() && selectedRole && !isLoggingIn && !hasTriggeredAuth.current) {
        if (!validateEmail(email)) {
          toast.error('Masukkan alamat email yang valid');
          setSelectedRole(null); // Reset role selection on invalid email
          return;
        }

        hasTriggeredAuth.current = true;

        try {
          // Store email and role for later use
          localStorage.setItem('mempo_pending_email', email);
          localStorage.setItem('mempo_pending_role', selectedRole);
          
          // Trigger Internet Identity login
          await login();
          
          // On success, complete the flow
          onComplete();
        } catch (error: any) {
          console.error('Login error:', error);
          toast.error('Gagal masuk. Silakan coba lagi.');
          hasTriggeredAuth.current = false; // Allow retry on error
          setSelectedRole(null); // Reset role to allow re-selection
        }
      }
    };

    triggerAuthentication();
  }, [email, selectedRole, isLoggingIn, login, onComplete]);

  // Show unified loading state during authentication
  if (isLoggingIn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4 py-8">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="flex justify-center mb-6">
            <img 
              src="/assets/MEMPO Logo 01.png" 
              alt="MEMPO Logo" 
              className="h-24 w-24 object-contain rounded-2xl animate-pulse"
            />
          </div>
          <div className="space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h2 className="text-2xl font-bold">
              Sedang Masuk...
            </h2>
            <p className="text-muted-foreground">
              {selectedRole === UserRole.businessOwner
                ? 'Mempersiapkan dashboard bisnis Anda...'
                : 'Menghubungkan ke layanan pelanggan...'}
            </p>
            <p className="text-sm text-muted-foreground">
              Mohon tunggu sebentar
            </p>
            <Alert className="mt-6 text-left">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Jendela Internet Identity akan terbuka untuk autentikasi. Gunakan identitas yang sudah terdaftar untuk masuk dengan lancar.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4 py-8">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <img 
              src="/assets/MEMPO Logo 01.png" 
              alt="MEMPO Logo" 
              className="h-20 w-20 sm:h-24 sm:w-24 object-contain rounded-2xl"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Selamat Datang di MEMPO</h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto">
            Pilih peran Anda dan masukkan email untuk memulai
          </p>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>Informasi Akun</CardTitle>
            <CardDescription>
              Masukkan email dan pilih peran Anda untuk melanjutkan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base">Alamat Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@contoh.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    hasTriggeredAuth.current = false; // Reset trigger when email changes
                  }}
                  disabled={isLoggingIn}
                  className="pl-10 h-12 text-base"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base">Pilih Peran Anda</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <Card
                  className={`cursor-pointer transition-all ${
                    selectedRole === UserRole.businessOwner
                      ? 'border-primary ring-2 ring-primary bg-primary/5'
                      : 'hover:border-primary/50 hover:bg-accent/50'
                  } ${isLoggingIn ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => {
                    if (!isLoggingIn) {
                      hasTriggeredAuth.current = false; // Reset trigger when role changes
                      setSelectedRole(UserRole.businessOwner);
                    }
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full p-2 ${
                        selectedRole === UserRole.businessOwner 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-primary/10 text-primary'
                      }`}>
                        <Store className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-base">Pemilik Bisnis</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      Kelola lokasi layanan dan antrian untuk bisnis Anda
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all ${
                    selectedRole === UserRole.customer
                      ? 'border-primary ring-2 ring-primary bg-primary/5'
                      : 'hover:border-primary/50 hover:bg-accent/50'
                  } ${isLoggingIn ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => {
                    if (!isLoggingIn) {
                      hasTriggeredAuth.current = false; // Reset trigger when role changes
                      setSelectedRole(UserRole.customer);
                    }
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full p-2 ${
                        selectedRole === UserRole.customer 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-primary/10 text-primary'
                      }`}>
                        <ShoppingBag className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-base">Pelanggan</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      Bergabung dengan antrian dan lacak waktu tunggu Anda
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Informational text */}
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                {email.trim() && selectedRole && !isLoggingIn && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                <p className="text-sm text-center">
                  {email.trim() && selectedRole && !isLoggingIn
                    ? 'Menghubungkan dengan Internet Identity...'
                    : 'Autentikasi aman dengan Internet Identity'}
                </p>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Dengan melanjutkan, Anda menyetujui untuk menggunakan Internet Identity untuk autentikasi yang aman
              </p>
              <Alert className="mt-2">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Catatan: Jendela Internet Identity akan terbuka untuk autentikasi. Gunakan identitas yang sudah terdaftar untuk pengalaman yang lancar.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
