import { useState } from 'react';
import { useJoinQueue, useLeaveQueue, useGetCustomerServiceQueues } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { UserPlus, RefreshCw, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import type { ServiceLocation, QueueID } from '../backend';

interface JoinQueueButtonProps {
  service: ServiceLocation;
  queueId: QueueID | null;
  queueStatus?: string | 'active' | 'paused' | 'stopped';
  isWithinServiceHours?: boolean;
  wouldExceedClosingTime?: boolean;
}

export default function JoinQueueButton({ service, queueId, queueStatus, isWithinServiceHours = true, wouldExceedClosingTime = false }: JoinQueueButtonProps) {
  const { identity } = useInternetIdentity();
  const joinQueue = useJoinQueue();
  const leaveQueue = useLeaveQueue();
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const customerId = identity?.getPrincipal() || null;
  const { data: customerQueues } = useGetCustomerServiceQueues(customerId);

  const isAuthenticated = !!identity;
  const canJoinQueue = queueId && queueStatus === 'active' && isWithinServiceHours && !wouldExceedClosingTime;

  const customerQueueForService = customerQueues?.find(([serviceId]) => serviceId === service.serviceID);
  const isInQueue = !!customerQueueForService;
  const customerQueueId = customerQueueForService?.[1] || null;

  const handleJoinQueue = async () => {
    if (!isAuthenticated) {
      toast.error('Silakan masuk untuk bergabung dengan antrian');
      return;
    }

    if (!queueId) {
      toast.error('Tidak ada antrian aktif untuk layanan ini');
      return;
    }

    if (queueStatus !== 'active') {
      toast.error('Antrian tidak aktif saat ini');
      return;
    }

    if (!isWithinServiceHours) {
      toast.error('Layanan di luar jam operasional');
      return;
    }

    if (wouldExceedClosingTime) {
      toast.error('Estimasi tunggu melebihi jam tutup layanan');
      return;
    }

    if (isInQueue) {
      toast.error('Anda sudah bergabung dalam antrian ini');
      return;
    }

    setIsJoining(true);
    try {
      const position = await joinQueue.mutateAsync(queueId);
      toast.success(`Berhasil bergabung dengan antrian! Nomor Antrian Anda: #${position}`);
    } catch (error: any) {
      console.error('Join queue error:', error);
      if (error.message?.includes('Anda sudah bergabung dalam antrian ini')) {
        toast.error('Anda sudah bergabung dalam antrian ini');
      } else if (error.message?.includes('not active')) {
        toast.error('Antrian tidak aktif');
      } else if (error.message?.includes('Only customers')) {
        toast.error('Hanya pelanggan yang dapat bergabung dengan antrian');
      } else {
        toast.error('Gagal bergabung dengan antrian');
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveQueue = async () => {
    if (!customerQueueId) {
      toast.error('Anda tidak dalam antrian ini');
      return;
    }

    setIsLeaving(true);
    try {
      await leaveQueue.mutateAsync(customerQueueId);
      toast.success('Berhasil keluar dari antrian');
    } catch (error: any) {
      console.error('Leave queue error:', error);
      toast.error('Gagal keluar dari antrian');
    } finally {
      setIsLeaving(false);
    }
  };

  if (isInQueue) {
    return (
      <Button
        onClick={handleLeaveQueue}
        disabled={isLeaving || leaveQueue.isPending}
        variant="destructive"
        className="w-full gap-2"
        size="lg"
      >
        {isLeaving || leaveQueue.isPending ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            Keluar...
          </>
        ) : (
          <>
            <LogOut className="h-4 w-4" />
            Keluar dari Antrian
          </>
        )}
      </Button>
    );
  }

  let buttonText = 'Bergabung dengan Antrian';
  if (!canJoinQueue) {
    if (!isWithinServiceHours) {
      buttonText = 'Di Luar Jam Pelayanan';
    } else if (wouldExceedClosingTime) {
      buttonText = 'Melebihi Jam Tutup';
    } else if (queueStatus !== 'active') {
      buttonText = 'Antrian Tidak Tersedia';
    } else {
      buttonText = 'Antrian Tidak Tersedia';
    }
  }

  return (
    <Button
      onClick={handleJoinQueue}
      disabled={!canJoinQueue || isJoining || joinQueue.isPending}
      className="w-full gap-2"
      size="lg"
    >
      {isJoining || joinQueue.isPending ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Bergabung...
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          {buttonText}
        </>
      )}
    </Button>
  );
}

