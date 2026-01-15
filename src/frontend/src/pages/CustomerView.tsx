import { useGetAllServices, useGetEstimatedWaitTimeForCustomer, useGetCustomerServiceQueues, useGetCustomerPosition, useGetServiceHours } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, MapPin, Users, Store, RefreshCw, Hash, Timer, Ticket, CalendarClock, Search } from 'lucide-react';
import JoinQueueButton from '../components/JoinQueueButton';
import { Variant_closed_open } from '../backend';
import { toast } from 'sonner';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

export default function CustomerView() {
  const { data: services, isLoading, isFetching, refetch } = useGetAllServices();
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const lastFetchTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (isFetching) {
      lastFetchTimeRef.current = Date.now();
    }
  }, [isFetching]);

  const showLoadingIndicator = isFetching && !isManualRefreshing && (Date.now() - lastFetchTimeRef.current > 500);

  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      await refetch();
      toast.success('Layanan berhasil diperbarui');
    } catch (error) {
      toast.error('Gagal memperbarui layanan');
    } finally {
      setIsManualRefreshing(false);
    }
  };

  // Filter services based on search query
  const filteredServices = useMemo(() => {
    if (!services) return [];
    if (!searchQuery.trim()) return services;
    
    const query = searchQuery.toLowerCase().trim();
    return services.filter((service) => 
      service.name.toLowerCase().includes(query)
    );
  }, [services, searchQuery]);

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      </div>
    );
  }

  const openServices = filteredServices?.filter((s) => s.status === Variant_closed_open.open) || [];
  const closedServices = filteredServices?.filter((s) => s.status === Variant_closed_open.closed) || [];

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Layanan Tersedia</h2>
            <p className="text-muted-foreground mt-1">
              Bergabung dengan antrian dan lacak waktu tunggu Anda secara real-time
            </p>
          </div>
          <div className="flex items-center gap-3">
            {showLoadingIndicator && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Memperbarui...</span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isManualRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isManualRefreshing ? 'animate-spin' : ''}`} />
              {isManualRefreshing ? 'Memperbarui...' : 'Perbarui'}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari layanan…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {!services || services.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Store className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Tidak ada layanan tersedia</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Saat ini tidak ada lokasi layanan yang tersedia. Periksa kembali nanti!
            </p>
          </CardContent>
        </Card>
      ) : filteredServices.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Tidak ada hasil ditemukan</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Tidak ada layanan yang cocok dengan pencarian "{searchQuery}". Coba kata kunci lain.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {openServices.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Buka Sekarang
              </h3>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {openServices.map((service) => (
                  <ServiceCard key={service.serviceID} service={service} />
                ))}
              </div>
            </div>
          )}

          {closedServices.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4 text-muted-foreground">Saat Ini Tutup</h3>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {closedServices.map((service) => (
                  <Card key={service.serviceID} className="opacity-60">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl">{service.name}</CardTitle>
                          <CardDescription className="mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {service.address}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">Tutup</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Kapasitas Layanan
                          </span>
                          <span className="font-medium">{service.capacity.toString()}/jam</span>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground text-center py-2">
                        Antrian tidak aktif
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ServiceCard({ service }: { service: any }) {
  const { identity } = useInternetIdentity();
  const { data: waitTimeData } = useGetEstimatedWaitTimeForCustomer(service.serviceID);
  const { data: serviceHours } = useGetServiceHours(service.serviceID);
  
  const customerId = identity?.getPrincipal() || null;
  const { data: customerQueues } = useGetCustomerServiceQueues(customerId);

  const customerQueueForService = customerQueues?.find(([serviceId]) => serviceId === service.serviceID);
  const customerQueueId = customerQueueForService?.[1] || null;

  const { data: customerPosition } = useGetCustomerPosition(customerQueueId, customerId);

  const currentServingNumber = waitTimeData?.currentServingNumber || BigInt(0);
  const queueLength = Number(waitTimeData?.currentQueueLength || BigInt(0));
  const estimatedTotalWait = Number(waitTimeData?.estimatedTotalWait || BigInt(0));
  const queueStatus = waitTimeData?.status || 'Tutup/Pause';

  const now = new Date();
  const currentHour = now.getHours();
  const dayOfWeek = now.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const relevantHours = isWeekend ? serviceHours?.weekendServiceHours : serviceHours?.weekdayServiceHours;
  const startHour = relevantHours ? Number(relevantHours.startHour) : null;
  const endHour = relevantHours ? Number(relevantHours.endHour) : null;

  const isWithinServiceHours = startHour !== null && endHour !== null && currentHour >= startHour && currentHour < endHour;
  const wouldExceedClosingTime = startHour !== null && endHour !== null && estimatedTotalWait > 0 && (currentHour + Math.ceil(estimatedTotalWait / 60)) > endHour;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl">{service.name}</CardTitle>
            <CardDescription className="mt-1 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {service.address}
            </CardDescription>
          </div>
          <Badge className="bg-green-500 hover:bg-green-600">Buka</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {customerQueueId && customerPosition && (
          <div className="bg-primary/10 border-2 border-primary rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Ticket className="h-5 w-5" />
                <span>Nomor Antrian Anda</span>
              </div>
              <div className="text-3xl font-bold text-primary">
                #{customerPosition.toString()}
              </div>
            </div>
          </div>
        )}
        
        {relevantHours && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CalendarClock className="h-4 w-4" />
              <span>Waktu Pelayanan {isWeekend ? '(Akhir Pekan)' : '(Hari Kerja)'}</span>
            </div>
            <div className="text-lg font-semibold">
              {startHour?.toString().padStart(2, '0')}:00 - {endHour?.toString().padStart(2, '0')}:00
            </div>
            {!isWithinServiceHours && (
              <p className="text-xs text-destructive">
                Saat ini di luar jam pelayanan
              </p>
            )}
            {isWithinServiceHours && wouldExceedClosingTime && (
              <p className="text-xs text-destructive">
                Estimasi tunggu melebihi jam tutup
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Sedang Dilayani
            </span>
            <span className="font-semibold text-lg">
              #{currentServingNumber.toString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Estimasi Tunggu
            </span>
            <span className="font-semibold text-lg text-primary">
              {estimatedTotalWait > 0 ? `${estimatedTotalWait} menit` : '-'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Panjang Antrian
            </span>
            <span className="font-medium">{queueLength}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Status
            </span>
            <span className="font-medium">{queueStatus}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Kapasitas Layanan
            </span>
            <span className="font-medium">{service.capacity.toString()}/jam</span>
          </div>
        </div>
        <JoinQueueButton 
          service={service} 
          queueId={waitTimeData?.queueId || null}
          queueStatus={waitTimeData?.open ? 'active' : 'stopped'}
          isWithinServiceHours={isWithinServiceHours}
          wouldExceedClosingTime={wouldExceedClosingTime}
        />
      </CardContent>
    </Card>
  );
}
