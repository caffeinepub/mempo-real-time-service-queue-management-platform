import { useState, useEffect } from 'react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { UserRole } from '../backend';

interface ProfileSetupModalProps {
  open: boolean;
  onComplete: () => void;
}

export default function ProfileSetupModal({ open, onComplete }: ProfileSetupModalProps) {
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const saveProfile = useSaveCallerUserProfile();

  useEffect(() => {
    if (open) {
      const pendingRole = localStorage.getItem('mempo_pending_role') as UserRole | null;
      if (pendingRole) {
        setSelectedRole(pendingRole);
      }
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Masukkan nama Anda');
      return;
    }

    if (!selectedRole) {
      toast.error('Pilih peran');
      return;
    }

    try {
      await saveProfile.mutateAsync({
        name: name.trim(),
        role: selectedRole,
      });
      
      localStorage.removeItem('mempo_pending_email');
      localStorage.removeItem('mempo_pending_role');
      
      toast.success('Profil berhasil dibuat!');
      onComplete();
    } catch (error) {
      toast.error('Gagal membuat profil');
      console.error('Profile creation error:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Lengkapi Profil Anda</DialogTitle>
          <DialogDescription>
            Masukkan nama Anda untuk menyelesaikan pendaftaran
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Anda</Label>
            <Input
              id="name"
              placeholder="Masukkan nama lengkap Anda"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saveProfile.isPending}
            />
          </div>

          <div className="space-y-3">
            <Label>Peran Anda</Label>
            <div className="grid gap-3">
              <Card
                className={`cursor-pointer transition-all ${
                  selectedRole === UserRole.businessOwner
                    ? 'border-primary ring-2 ring-primary'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedRole(UserRole.businessOwner)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Store className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">Pemilik Bisnis</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Kelola lokasi layanan dan antrian untuk bisnis Anda
                  </CardDescription>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${
                  selectedRole === UserRole.customer
                    ? 'border-primary ring-2 ring-primary'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedRole(UserRole.customer)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <ShoppingBag className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">Pelanggan</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Bergabung dengan antrian dan lacak waktu tunggu Anda
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={saveProfile.isPending}>
            {saveProfile.isPending ? 'Membuat Profil...' : 'Buat Profil'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
