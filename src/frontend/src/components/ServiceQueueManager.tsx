import { useGetMyServices, useGetActiveQueueId, useStopServiceQueue, useResumeServiceQueue, usePauseServiceQueue, useGetCompleteQueueInfo, useUpdateCurrentServingNumber, useSetEstimatedTimePerCustomer, useGetEstimatedTimePerCustomer, useGetServiceHours, useSetWeekdayServiceHours, useSetWeekendServiceHours, useDeleteServiceLocation } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Square, Play, Users, Clock, RefreshCw, Hash, ChevronRight, Pause, Timer, CalendarClock, X } from 'lucide-react';
import { toast } from 'sonner';
import { Variant_active_stopped_paused, Variant_closed_open } from '../backend';
import { useEffect, useRef, useState } from 'react';

interface ServiceQueueManagerProps {
  serviceId: string;
  onBack: () => void;
}

export default function ServiceQueueManager({ serviceId, onBack }: ServiceQueueManagerProps) {
  const { data: services } = useGetMyServices();
  const { data: activeQueueId } = useGetActiveQueueId(serviceId);
  const { data: queueInfo, isLoading: infoLoading, isFetching: infoFetching } = useGetCompleteQueueInfo(activeQueueId || null);
  const { data: estimatedTime } = useGetEstimatedTimePerCustomer(serviceId);
  const { data: serviceHours } = useGetServiceHours(serviceId);
  const stopQueue = useStopServiceQueue();
  const resumeQueue = useResumeServiceQueue();
  const pauseQueue = usePauseServiceQueue();
  const updateServingNumber = useUpdateCurrentServingNumber();
  const setEstimatedTime = useSetEstimatedTimePerCustomer();
  const setWeekdayHours = useSetWeekdayServiceHours();
  const setWeekendHours = useSetWeekendServiceHours();
  const deleteService = useDeleteServiceLocation();

  const service = services?.find((s) => s.serviceID === serviceId);
  const lastFetchTimeRef = useRef<number>(Date.now());

  const [isEstimatedTimeDialogOpen, setIsEstimatedTimeDialogOpen] = useState(false);
  const [estimatedTimeInput, setEstimatedTimeInput] = useState('');

  const [isServiceHoursDialogOpen, setIsServiceHoursDialogOpen] = useState(false);
  const [weekdayStartHour, setWeekdayStartHour] = useState('8');
  const [weekdayEndHour, setWeekdayEndHour] = useState('17');
  const [weekendStartHour, setWeekendStartHour] = useState('10');
  const [weekendEndHour, setWeekendEndHour] = useState('15');

  useEffect(() => {
    if (estimatedTime !== null && estimatedTime !== undefined) {
      setEstimatedTimeInput(estimatedTime.toString());
    }
  }, [estimatedTime]);

  useEffect(() => {
    if (serviceHours) {
      if (serviceHours.weekdayServiceHours) {
        setWeekdayStartHour(serviceHours.weekdayServiceHours.startHour.toString());
        setWeekdayEndHour(serviceHours.weekdayServiceHours.endHour.toString());
      }
      if (serviceHours.weekendServiceHours) {
        setWeekendStartHour(serviceHours.weekendServiceHours.startHour.toString());
        setWeekendEndHour(serviceHours.weekendServiceHours.endHour.toString());
      }
    }
  }, [serviceHours]);

  useEffect(() => {
    if (infoFetching) {
      lastFetchTimeRef.current = Date.now();
    }
  }, [infoFetching]);

  const showLoadingIndicator = infoFetching && (Date.now() - lastFetchTimeRef.current > 500);

  const handleStopQueue = async () => {
    if (!activeQueueId) return;

    try {
      await stopQueue.mutateAsync(activeQueueId);
      toast.success('Antrian berhasil dihentikan');
      onBack();
    } catch (error) {
      toast.error('Gagal menghentikan antrian');
      console.error('Stop queue error:', error);
    }
  };

  const handlePauseQueue = async () => {
    if (!activeQueueId) return;

    try {
      await pauseQueue.mutateAsync(activeQueueId);
      toast.success('Antrian berhasil dijeda');
    } catch (error) {
      toast.error('Gagal menjeda antrian');
      console.error('Pause queue error:', error);
    }
  };

  const handleResumeQueue = async () => {
    if (!activeQueueId) return;

    try {
      await resumeQueue.mutateAsync(activeQueueId);
      toast.success('Antrian berhasil dilanjutkan');
    } catch (error) {
      toast.error('Gagal melanjutkan antrian');
      console.error('Resume queue error:', error);
    }
  };

  const handleNextServingNumber = async () => {
    if (!activeQueueId || !queueInfo) return;

    const currentNumber = Number(queueInfo.currentServingNumber);
    const nextNumber = currentNumber + 1;

    try {
      await updateServingNumber.mutateAsync({
        queueId: activeQueueId,
        newNumber: BigInt(nextNumber),
      });
      toast.success(`Sekarang melayani: #${nextNumber}`);
    } catch (error) {
      toast.error('Gagal memperbarui nomor layanan');
      console.error('Update serving number error:', error);
    }
  };

  const handleSaveEstimatedTime = async (e: React.FormEvent) => {
    e.preventDefault();

    const timeValue = parseInt(estimatedTimeInput);
    if (isNaN(timeValue) || timeValue < 1) {
      toast.error('Masukkan waktu yang valid (minimal 1 menit)');
      return;
    }

    try {
      await setEstimatedTime.mutateAsync({
        serviceId,
        timeInMinutes: BigInt(timeValue),
      });
      toast.success('Waktu estimasi berhasil diperbarui');
      setIsEstimatedTimeDialogOpen(false);
    } catch (error) {
      toast.error('Gagal memperbarui waktu estimasi');
      console.error('Set estimated time error:', error);
    }
  };

  const handleSaveServiceHours = async (e: React.FormEvent) => {
    e.preventDefault();

    const wdStart = parseInt(weekdayStartHour);
    const wdEnd = parseInt(weekdayEndHour);
    const weStart = parseInt(weekendStartHour);
    const weEnd = parseInt(weekendEndHour);

    if (isNaN(wdStart) || isNaN(wdEnd) || wdStart < 0 || wdStart > 23 || wdEnd < 0 || wdEnd > 23) {
      toast.error('Jam hari kerja tidak valid (0-23)');
      return;
    }

    if (wdEnd <= wdStart) {
      toast.error('Jam tutup hari kerja harus lebih besar dari jam buka');
      return;
    }

    if (isNaN(weStart) || isNaN(weEnd) || weStart < 0 || weStart > 23 || weEnd < 0 || weEnd > 23) {
      toast.error('Jam akhir pekan tidak valid (0-23)');
      return;
    }

    if (weEnd <= weStart) {
      toast.error('Jam tutup akhir pekan harus lebih besar dari jam buka');
      return;
    }

    try {
      await setWeekdayHours.mutateAsync({
        serviceId,
        startHour: BigInt(wdStart),
        endHour: BigInt(wdEnd),
      });
      await setWeekendHours.mutateAsync({
        serviceId,
        startHour: BigInt(weStart),
        endHour: BigInt(weEnd),
      });
      toast.success('Waktu pelayanan berhasil diperbarui');
      setIsServiceHoursDialogOpen(false);
    } catch (error: any) {
      if (error.message?.includes('End time must be later than start time')) {
        toast.error('Jam tutup harus lebih besar dari jam buka');
      } else {
        toast.error('Gagal memperbarui waktu pelayanan');
      }
      console.error('Set service hours error:', error);
    }
  };

  const handleDeleteService = async () => {
    try {
      await deleteService.mutateAsync(serviceId);
      toast.success('Layanan berhasil dihapus');
      onBack();
    } catch (error: any) {
      if (error.message?.includes('Can only delete services that are closed')) {
        toast.error('Hanya dapat menghapus layanan yang sudah ditutup');
      } else {
        toast.error('Gagal menghapus layanan');
      }
      console.error('Delete service error:', error);
    }
  };

  if (!service) {
    return (
      <div className="container py-8">
        <Skeleton className="h-64" />
      </div>
    );
  }

  const isActive = queueInfo?.status === Variant_active_stopped_paused.active;
  const isPaused = queueInfo?.status === Variant_active_stopped_paused.paused;
  const isStopped = queueInfo?.status === Variant_active_stopped_paused.stopped;
  const isClosed = service.status === Variant_closed_open.closed;

  const weekdayHours = serviceHours?.weekdayServiceHours;
  const weekendHours = serviceHours?.weekendServiceHours;

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={onBack} className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Dashboard
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{service.name}</h2>
            <p className="text-muted-foreground mt-1">{service.address}</p>
          </div>
          <div className="flex items-center gap-3">
            {showLoadingIndicator && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Memperbarui...</span>
              </div>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="default"
                  disabled={!isClosed || deleteService.isPending}
                  title={isClosed ? 'Hapus layanan' : 'Hanya dapat menghapus layanan yang sudah ditutup'}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Hapus Layanan
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
                    onClick={handleDeleteService}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteService.isPending ? 'Menghapus...' : 'Hapus'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Badge 
              variant={isActive ? 'default' : 'secondary'} 
              className="text-base px-4 py-2"
            >
              {isActive ? 'Aktif' : isPaused ? 'Dijeda' : 'Berhenti'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Panjang Antrian</CardDescription>
            <CardTitle className="text-3xl">{queueInfo?.entries.length || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              pelanggan menunggu
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Sedang Dilayani</CardDescription>
            <CardTitle className="text-3xl">#{queueInfo?.currentServingNumber.toString() || '0'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Hash className="h-4 w-4" />
              nomor saat ini
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Waktu Estimasi</CardDescription>
            <CardTitle className="text-3xl">{estimatedTime?.toString() || '0'}m</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              per pelanggan
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Kapasitas Layanan</CardDescription>
            <CardTitle className="text-3xl">{service.capacity.toString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              pelanggan per jam
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Kontrol Antrian</CardTitle>
            <CardDescription>Kelola status dan operasi antrian</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isStopped || !activeQueueId ? (
              <div className="text-sm text-muted-foreground">
                Antrian dihentikan. Mulai antrian baru dari dashboard.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {isActive && (
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handlePauseQueue}
                      disabled={pauseQueue.isPending}
                      className="flex-1 gap-2"
                    >
                      {pauseQueue.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Menjeda...
                        </>
                      ) : (
                        <>
                          <Pause className="h-4 w-4" />
                          Jeda Antrian
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleStopQueue}
                      disabled={stopQueue.isPending}
                      className="flex-1 gap-2"
                    >
                      {stopQueue.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Menghentikan...
                        </>
                      ) : (
                        <>
                          <Square className="h-4 w-4" />
                          Hentikan Antrian
                        </>
                      )}
                    </Button>
                  </div>
                )}
                {isPaused && (
                  <div className="flex gap-3">
                    <Button
                      onClick={handleResumeQueue}
                      disabled={resumeQueue.isPending}
                      className="flex-1 gap-2"
                    >
                      {resumeQueue.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Melanjutkan...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Lanjutkan Antrian
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleStopQueue}
                      disabled={stopQueue.isPending}
                      className="flex-1 gap-2"
                    >
                      {stopQueue.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Menghentikan...
                        </>
                      ) : (
                        <>
                          <Square className="h-4 w-4" />
                          Hentikan Antrian
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
            <Dialog open={isEstimatedTimeDialogOpen} onOpenChange={setIsEstimatedTimeDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full gap-2">
                  <Timer className="h-4 w-4" />
                  Atur Waktu Estimasi
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Atur Waktu Estimasi per Pelanggan</DialogTitle>
                  <DialogDescription>
                    Masukkan rata-rata waktu layanan per pelanggan dalam menit
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveEstimatedTime} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="estimatedTime">Waktu Estimasi (menit)</Label>
                    <Input
                      id="estimatedTime"
                      type="number"
                      min="1"
                      placeholder="Contoh: 5"
                      value={estimatedTimeInput}
                      onChange={(e) => setEstimatedTimeInput(e.target.value)}
                      disabled={setEstimatedTime.isPending}
                    />
                    <p className="text-xs text-muted-foreground">
                      Waktu ini akan digunakan untuk menghitung estimasi tunggu pelanggan
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={setEstimatedTime.isPending}>
                    {setEstimatedTime.isPending ? 'Menyimpan...' : 'Simpan Waktu Estimasi'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={isServiceHoursDialogOpen} onOpenChange={setIsServiceHoursDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full gap-2">
                  <CalendarClock className="h-4 w-4" />
                  Waktu Pelayanan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Atur Waktu Pelayanan</DialogTitle>
                  <DialogDescription>
                    Tentukan jam buka dan tutup untuk hari kerja dan akhir pekan
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveServiceHours} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Hari Kerja (Senin - Jumat)</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="weekdayStart" className="text-sm">Jam Buka</Label>
                          <Input
                            id="weekdayStart"
                            type="number"
                            min="0"
                            max="23"
                            placeholder="8"
                            value={weekdayStartHour}
                            onChange={(e) => setWeekdayStartHour(e.target.value)}
                            disabled={setWeekdayHours.isPending || setWeekendHours.isPending}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="weekdayEnd" className="text-sm">Jam Tutup</Label>
                          <Input
                            id="weekdayEnd"
                            type="number"
                            min="0"
                            max="23"
                            placeholder="17"
                            value={weekdayEndHour}
                            onChange={(e) => setWeekdayEndHour(e.target.value)}
                            disabled={setWeekdayHours.isPending || setWeekendHours.isPending}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Contoh: 8 (08:00) - 17 (17:00)
                      </p>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Akhir Pekan (Sabtu - Minggu)</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="weekendStart" className="text-sm">Jam Buka</Label>
                          <Input
                            id="weekendStart"
                            type="number"
                            min="0"
                            max="23"
                            placeholder="10"
                            value={weekendStartHour}
                            onChange={(e) => setWeekendStartHour(e.target.value)}
                            disabled={setWeekdayHours.isPending || setWeekendHours.isPending}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="weekendEnd" className="text-sm">Jam Tutup</Label>
                          <Input
                            id="weekendEnd"
                            type="number"
                            min="0"
                            max="23"
                            placeholder="15"
                            value={weekendEndHour}
                            onChange={(e) => setWeekendEndHour(e.target.value)}
                            disabled={setWeekdayHours.isPending || setWeekendHours.isPending}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Contoh: 10 (10:00) - 15 (15:00)
                      </p>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={setWeekdayHours.isPending || setWeekendHours.isPending}
                  >
                    {(setWeekdayHours.isPending || setWeekendHours.isPending) ? 'Menyimpan...' : 'Simpan Waktu Pelayanan'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kelola Nomor Layanan</CardTitle>
            <CardDescription>Lanjutkan ke pelanggan berikutnya dalam antrian</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nomor Layanan Saat Ini</Label>
                <div className="flex items-center justify-center h-16 bg-muted rounded-lg">
                  <span className="text-4xl font-bold">
                    #{queueInfo?.currentServingNumber.toString() || '0'}
                  </span>
                </div>
              </div>
              <Button 
                onClick={handleNextServingNumber}
                className="w-full gap-2" 
                disabled={updateServingNumber.isPending || !activeQueueId || !isActive}
                size="lg"
              >
                {updateServingNumber.isPending ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Memperbarui...
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-5 w-5" />
                    Berikutnya
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {weekdayHours && weekendHours && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Waktu Pelayanan</CardTitle>
            <CardDescription>Jam operasional layanan Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CalendarClock className="h-4 w-4" />
                  Hari Kerja (Senin - Jumat)
                </div>
                <div className="text-2xl font-bold">
                  {weekdayHours.startHour.toString().padStart(2, '0')}:00 - {weekdayHours.endHour.toString().padStart(2, '0')}:00
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CalendarClock className="h-4 w-4" />
                  Akhir Pekan (Sabtu - Minggu)
                </div>
                <div className="text-2xl font-bold">
                  {weekendHours.startHour.toString().padStart(2, '0')}:00 - {weekendHours.endHour.toString().padStart(2, '0')}:00
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Entri Antrian</CardTitle>
          <CardDescription>Tampilan real-time pelanggan dalam antrian (diperbarui setiap 3 detik)</CardDescription>
        </CardHeader>
        <CardContent>
          {infoLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : !queueInfo?.entries || queueInfo.entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Tidak ada pelanggan dalam antrian</p>
              <p className="text-sm mt-2">Antrian diperbarui secara otomatis</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Posisi</TableHead>
                    <TableHead>ID Pelanggan</TableHead>
                    <TableHead>Waktu Bergabung</TableHead>
                    <TableHead>Est. Tunggu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queueInfo.entries.map((entry) => (
                    <TableRow key={entry.customerID.toString()}>
                      <TableCell className="font-medium">#{entry.position.toString()}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {entry.customerID.toString().slice(0, 12)}...
                      </TableCell>
                      <TableCell>
                        {new Date(Number(entry.joinTime) / 1000000).toLocaleTimeString('id-ID')}
                      </TableCell>
                      <TableCell>{entry.estimatedWaitTime.toString()} menit</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
