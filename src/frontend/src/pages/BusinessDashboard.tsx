import { useState } from 'react';
import { useGetMyServices, useCreateNewService, useStartServiceQueue, useDeleteServiceLocation } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Store, Users, Clock, Play, X } from 'lucide-react';
import { toast } from 'sonner';
import ServiceQueueManager from '../components/ServiceQueueManager';
import { Variant_closed_open } from '../backend';

export default function BusinessDashboard() {
  const { data: services, isLoading } = useGetMyServices();
  const createService = useCreateNewService();
  const startQueue = useStartServiceQueue();
  const deleteService = useDeleteServiceLocation();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCapacity, setNewServiceCapacity] = useState('10');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newServiceName.trim()) {
      toast.error('Masukkan nama layanan');
      return;
    }

    const capacity = parseInt(newServiceCapacity);
    if (isNaN(capacity) || capacity < 1) {
      toast.error('Masukkan kapasitas yang valid');
      return;
    }

    try {
      await createService.mutateAsync({
        name: newServiceName.trim(),
        capacity: BigInt(capacity),
      });
      toast.success('Layanan berhasil dibuat!');
      setIsCreateDialogOpen(false);
      setNewServiceName('');
      setNewServiceCapacity('10');
    } catch (error) {
      toast.error('Gagal membuat layanan');
      console.error('Service creation error:', error);
    }
  };

  const handleStartQueue = async (serviceId: string) => {
    try {
      await startQueue.mutateAsync(serviceId);
      toast.success('Antrian berhasil dimulai!');
    } catch (error) {
      toast.error('Gagal memulai antrian');
      console.error('Start queue error:', error);
    }
  };

  const handleDeleteService = async (serviceId: string, serviceName: string) => {
    try {
      await deleteService.mutateAsync(serviceId);
      toast.success(`Layanan "${serviceName}" berhasil dihapus`);
    } catch (error: any) {
      if (error.message?.includes('Can only delete services that are closed')) {
        toast.error('Hanya dapat menghapus layanan yang sudah ditutup');
      } else {
        toast.error('Gagal menghapus layanan');
      }
      console.error('Delete service error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (selectedServiceId) {
    return (
      <ServiceQueueManager
        serviceId={selectedServiceId}
        onBack={() => setSelectedServiceId(null)}
      />
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Bisnis</h2>
          <p className="text-muted-foreground mt-1">
            Kelola lokasi layanan dan antrian Anda
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Layanan Baru
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Buat Layanan Baru</DialogTitle>
              <DialogDescription>
                Tambahkan lokasi layanan baru untuk mengelola antrian
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateService} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="serviceName">Nama Layanan</Label>
                <Input
                  id="serviceName"
                  placeholder="Contoh: Klinik Pusat Kota"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  disabled={createService.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Kapasitas Layanan (pelanggan/jam)</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  placeholder="10"
                  value={newServiceCapacity}
                  onChange={(e) => setNewServiceCapacity(e.target.value)}
                  disabled={createService.isPending}
                />
              </div>
              <Button type="submit" className="w-full" disabled={createService.isPending}>
                {createService.isPending ? 'Membuat...' : 'Buat Layanan'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!services || services.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Store className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Belum ada layanan</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
              Buat lokasi layanan pertama Anda untuk mulai mengelola antrian
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Buat Layanan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.serviceID} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{service.name}</CardTitle>
                    <CardDescription className="mt-1">{service.address}</CardDescription>
                  </div>
                  <Badge variant={service.status === Variant_closed_open.open ? 'default' : 'secondary'}>
                    {service.status === Variant_closed_open.open ? 'Buka' : 'Tutup'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Kapasitas:</span>
                    <span className="font-medium">{service.capacity.toString()}/jam</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Tunggu:</span>
                    <span className="font-medium">{service.estimatedWaitTime.toString()}m</span>
                  </div>
                </div>

                {service.status === Variant_closed_open.closed ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleStartQueue(service.serviceID)}
                      disabled={startQueue.isPending}
                      className="flex-1 gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Mulai Antrian
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="icon"
                          disabled={deleteService.isPending}
                          title="Hapus layanan"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Apakah Anda yakin ingin menghapus layanan ini?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Layanan "{service.name}" akan dihapus secara permanen dari sistem.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteService(service.serviceID, service.name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deleteService.isPending ? 'Menghapus...' : 'Hapus'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setSelectedServiceId(service.serviceID)}
                      variant="outline"
                      className="flex-1"
                    >
                      Kelola Antrian
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled
                      title="Hanya dapat menghapus layanan yang sudah ditutup"
                      className="opacity-50 cursor-not-allowed"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
