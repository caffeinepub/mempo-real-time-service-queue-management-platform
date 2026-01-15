import { useState } from 'react';
import { useUpdateUserRole, useGetCallerUserProfile } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { UserRole } from '../backend';

interface ChangeRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChangeRoleModal({ open, onOpenChange }: ChangeRoleModalProps) {
  const { data: userProfile } = useGetCallerUserProfile();
  const updateRole = useUpdateUserRole();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleChangeRole = async () => {
    if (!selectedRole) {
      toast.error('Pilih peran');
      return;
    }

    if (selectedRole === userProfile?.role) {
      toast.info('Anda sudah memiliki peran ini');
      onOpenChange(false);
      return;
    }

    try {
      await updateRole.mutateAsync(selectedRole);
      toast.success('Peran berhasil diubah!');
      onOpenChange(false);
    } catch (error) {
      toast.error('Gagal mengubah peran');
      console.error('Role change error:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ubah Peran Anda</DialogTitle>
          <DialogDescription>
            Pilih peran baru untuk mengubah tampilan dashboard Anda
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="grid gap-3">
              <Card
                className={`cursor-pointer transition-all ${
                  selectedRole === UserRole.businessOwner
                    ? 'border-primary ring-2 ring-primary'
                    : 'hover:border-primary/50'
                } ${userProfile?.role === UserRole.businessOwner ? 'bg-muted/50' : ''}`}
                onClick={() => setSelectedRole(UserRole.businessOwner)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Store className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">Pemilik Bisnis</CardTitle>
                      {userProfile?.role === UserRole.businessOwner && (
                        <p className="text-xs text-muted-foreground mt-1">Peran saat ini</p>
                      )}
                    </div>
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
                } ${userProfile?.role === UserRole.customer ? 'bg-muted/50' : ''}`}
                onClick={() => setSelectedRole(UserRole.customer)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <ShoppingBag className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">Pelanggan</CardTitle>
                      {userProfile?.role === UserRole.customer && (
                        <p className="text-xs text-muted-foreground mt-1">Peran saat ini</p>
                      )}
                    </div>
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

          <Button
            onClick={handleChangeRole}
            className="w-full"
            disabled={updateRole.isPending || !selectedRole}
          >
            {updateRole.isPending ? 'Mengubah Peran...' : 'Ubah Peran'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
