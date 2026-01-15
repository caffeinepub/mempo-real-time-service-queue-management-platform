import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { UserProfile, ServiceLocation, QueueEntry, ServiceID, QueueID, CustomerID, UserRole, Variant_active_stopped_paused, Queue } from '../backend';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useUpdateUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newRole: UserRole) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateUserRole(newRole);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetAllServices() {
  const { actor, isFetching } = useActor();

  return useQuery<ServiceLocation[]>({
    queryKey: ['allServices'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllServices();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
    staleTime: 3000,
  });
}

export function useGetMyServices() {
  const { actor, isFetching } = useActor();

  return useQuery<ServiceLocation[]>({
    queryKey: ['myServices'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyServices();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
    staleTime: 3000,
  });
}

export function useCreateNewService() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, capacity }: { name: string; capacity: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createNewService(name, capacity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myServices'] });
    },
  });
}

export function useDeleteServiceLocation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serviceId: ServiceID) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteServiceLocation(serviceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myServices'] });
      queryClient.invalidateQueries({ queryKey: ['allServices'] });
    },
  });
}

export function useStartServiceQueue() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serviceId: ServiceID) => {
      if (!actor) throw new Error('Actor not available');
      return actor.startServiceQueue(serviceId);
    },
    onSuccess: (queueId, serviceId) => {
      queryClient.setQueryData(['activeQueueId', serviceId], queueId);
      queryClient.invalidateQueries({ queryKey: ['myServices'] });
      queryClient.invalidateQueries({ queryKey: ['allActiveQueues'] });
      queryClient.invalidateQueries({ queryKey: ['allServices'] });
      queryClient.invalidateQueries({ queryKey: ['estimatedWaitTime'] });
    },
  });
}

export function useStopServiceQueue() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (queueId: QueueID) => {
      if (!actor) throw new Error('Actor not available');
      return actor.stopServiceQueue(queueId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myServices'] });
      queryClient.invalidateQueries({ queryKey: ['allActiveQueues'] });
      queryClient.invalidateQueries({ queryKey: ['completeQueueInfo'] });
      queryClient.invalidateQueries({ queryKey: ['allServices'] });
      queryClient.invalidateQueries({ queryKey: ['estimatedWaitTime'] });
      queryClient.invalidateQueries({ queryKey: ['customerServiceQueues'] });
    },
  });
}

export function useResumeServiceQueue() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (queueId: QueueID) => {
      if (!actor) throw new Error('Actor not available');
      return actor.resumeServiceQueue(queueId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['completeQueueInfo'] });
      queryClient.invalidateQueries({ queryKey: ['allActiveQueues'] });
    },
  });
}

export function usePauseServiceQueue() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (queueId: QueueID) => {
      if (!actor) throw new Error('Actor not available');
      return actor.pauseServiceQueue(queueId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['completeQueueInfo'] });
      queryClient.invalidateQueries({ queryKey: ['allActiveQueues'] });
    },
  });
}

export function useJoinQueue() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (queueId: QueueID) => {
      if (!actor) throw new Error('Actor not available');
      return actor.joinQueue(queueId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['completeQueueInfo'] });
      queryClient.invalidateQueries({ queryKey: ['allActiveQueues'] });
      queryClient.invalidateQueries({ queryKey: ['estimatedWaitTime'] });
      queryClient.invalidateQueries({ queryKey: ['customerServiceQueues'] });
    },
  });
}

export function useLeaveQueue() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (queueId: QueueID) => {
      if (!actor) throw new Error('Actor not available');
      return actor.leaveQueue(queueId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['completeQueueInfo'] });
      queryClient.invalidateQueries({ queryKey: ['allActiveQueues'] });
      queryClient.invalidateQueries({ queryKey: ['estimatedWaitTime'] });
      queryClient.invalidateQueries({ queryKey: ['customerServiceQueues'] });
    },
  });
}

export function useGetQueueEntries(queueId: QueueID | null) {
  const { actor, isFetching } = useActor();

  return useQuery<QueueEntry[]>({
    queryKey: ['queueEntries', queueId],
    queryFn: async () => {
      if (!actor || !queueId) return [];
      return actor.getQueueEntries(queueId);
    },
    enabled: !!actor && !isFetching && !!queueId,
    refetchInterval: 3000,
    staleTime: 2000,
  });
}

export function useGetCustomerPosition(queueId: QueueID | null, customerId: CustomerID | null) {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['customerPosition', queueId, customerId?.toString()],
    queryFn: async () => {
      if (!actor || !queueId || !customerId) throw new Error('Missing parameters');
      return actor.getCustomerPosition(queueId, customerId);
    },
    enabled: !!actor && !isFetching && !!queueId && !!customerId,
    refetchInterval: 5000,
    staleTime: 3000,
  });
}

export function useGetQueueService(queueId: QueueID | null) {
  const { actor, isFetching } = useActor();

  return useQuery<ServiceID>({
    queryKey: ['queueService', queueId],
    queryFn: async () => {
      if (!actor || !queueId) throw new Error('Missing queue ID');
      return actor.getQueueService(queueId);
    },
    enabled: !!actor && !isFetching && !!queueId,
    staleTime: 30000,
  });
}

export function useGetServiceQueueStatus(serviceId: ServiceID | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Variant_active_stopped_paused | null>({
    queryKey: ['serviceQueueStatus', serviceId],
    queryFn: async () => {
      if (!actor || !serviceId) return null;
      return actor.getServiceQueueStatus(serviceId);
    },
    enabled: !!actor && !isFetching && !!serviceId,
    refetchInterval: 5000,
    staleTime: 3000,
  });
}

export function useGetAllActiveQueues() {
  const { actor, isFetching } = useActor();

  return useQuery<Queue[]>({
    queryKey: ['allActiveQueues'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllActiveQueues();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 4000,
    staleTime: 2000,
  });
}

export function useGetActiveQueueId(serviceId: ServiceID | null) {
  const { data: activeQueues } = useGetAllActiveQueues();

  const queueId = activeQueues?.find(q => q.serviceID === serviceId)?.queueID || null;
  
  return {
    data: queueId,
    isLoading: false,
    isFetching: false,
  };
}

export function useGetQueueStatus(queueId: QueueID | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Variant_active_stopped_paused>({
    queryKey: ['queueStatus', queueId],
    queryFn: async () => {
      if (!actor || !queueId) throw new Error('Missing queue ID');
      return actor.getQueueStatus(queueId);
    },
    enabled: !!actor && !isFetching && !!queueId,
    refetchInterval: 5000,
    staleTime: 3000,
  });
}

export function useGetCurrentServingNumber(queueId: QueueID | null) {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['currentServingNumber', queueId],
    queryFn: async () => {
      if (!actor || !queueId) throw new Error('Missing queue ID');
      return actor.getCurrentServingNumber(queueId);
    },
    enabled: !!actor && !isFetching && !!queueId,
    refetchInterval: 3000,
    staleTime: 2000,
  });
}

export function useUpdateCurrentServingNumber() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ queueId, newNumber }: { queueId: QueueID; newNumber: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateCurrentServingNumber(queueId, newNumber);
    },
    onMutate: async ({ queueId, newNumber }) => {
      await queryClient.cancelQueries({ queryKey: ['completeQueueInfo', queueId] });
      await queryClient.cancelQueries({ queryKey: ['currentServingNumber', queueId] });

      const previousInfo = queryClient.getQueryData(['completeQueueInfo', queueId]);
      const previousNumber = queryClient.getQueryData(['currentServingNumber', queueId]);

      queryClient.setQueryData(['currentServingNumber', queueId], newNumber);
      queryClient.setQueryData(['completeQueueInfo', queueId], (old: any) => 
        old ? { ...old, currentServingNumber: newNumber } : old
      );

      return { previousInfo, previousNumber };
    },
    onError: (err, { queueId }, context) => {
      if (context?.previousInfo) {
        queryClient.setQueryData(['completeQueueInfo', queueId], context.previousInfo);
      }
      if (context?.previousNumber) {
        queryClient.setQueryData(['currentServingNumber', queueId], context.previousNumber);
      }
    },
    onSettled: (_, __, { queueId }) => {
      queryClient.invalidateQueries({ queryKey: ['currentServingNumber', queueId] });
      queryClient.invalidateQueries({ queryKey: ['completeQueueInfo', queueId] });
      queryClient.invalidateQueries({ queryKey: ['estimatedWaitTime'] });
    },
  });
}

export function useGetCompleteQueueInfo(queueId: QueueID | null) {
  const { actor, isFetching } = useActor();

  return useQuery<{
    entries: QueueEntry[];
    currentServingNumber: bigint;
    serviceId: ServiceID;
    status: Variant_active_stopped_paused;
  }>({
    queryKey: ['completeQueueInfo', queueId],
    queryFn: async () => {
      if (!actor || !queueId) throw new Error('Missing queue ID');
      return actor.getCompleteQueueQueueInfo(queueId);
    },
    enabled: !!actor && !isFetching && !!queueId,
    refetchInterval: 3000,
    staleTime: 2000,
  });
}

export function useSetEstimatedTimePerCustomer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serviceId, timeInMinutes }: { serviceId: ServiceID; timeInMinutes: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setEstimatedTimePerCustomer(serviceId, timeInMinutes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myServices'] });
      queryClient.invalidateQueries({ queryKey: ['allServices'] });
      queryClient.invalidateQueries({ queryKey: ['estimatedWaitTime'] });
    },
  });
}

export function useGetEstimatedTimePerCustomer(serviceId: ServiceID | null) {
  const { actor, isFetching } = useActor();

  return useQuery<bigint | null>({
    queryKey: ['estimatedTimePerCustomer', serviceId],
    queryFn: async () => {
      if (!actor || !serviceId) return null;
      return actor.getEstimatedTimePerCustomer(serviceId);
    },
    enabled: !!actor && !isFetching && !!serviceId,
    refetchInterval: 5000,
    staleTime: 3000,
  });
}

export function useGetEstimatedWaitTimeForCustomer(serviceId: ServiceID | null) {
  const { actor, isFetching } = useActor();

  return useQuery<{
    estimatedServiceTimePerCustomer: bigint;
    currentQueueLength: bigint;
    timeBasedOnQueue: bigint;
    estimatedTotalWait: bigint;
    queueId?: QueueID;
    serviceId: ServiceID;
    open: boolean;
    currentServingNumber?: bigint;
    status: string;
  } | null>({
    queryKey: ['estimatedWaitTime', serviceId],
    queryFn: async () => {
      if (!actor || !serviceId) return null;
      return actor.getEstimatedWaitTimeForCustomer(serviceId);
    },
    enabled: !!actor && !isFetching && !!serviceId,
    refetchInterval: 4000,
    staleTime: 2000,
  });
}

export function useGetCustomerServiceQueues(customerId: CustomerID | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[ServiceID, QueueID]>>({
    queryKey: ['customerServiceQueues', customerId?.toString()],
    queryFn: async () => {
      if (!actor || !customerId) return [];
      return actor.getCustomerServiceQueues(customerId);
    },
    enabled: !!actor && !isFetching && !!customerId,
    refetchInterval: 3000,
    staleTime: 2000,
  });
}

export function useGetServiceHours(serviceId: ServiceID | null) {
  const { actor, isFetching } = useActor();

  return useQuery<{
    weekdayServiceHours?: { startHour: bigint; endHour: bigint };
    weekendServiceHours?: { startHour: bigint; endHour: bigint };
  } | null>({
    queryKey: ['serviceHours', serviceId],
    queryFn: async () => {
      if (!actor || !serviceId) return null;
      return actor.getServiceHours(serviceId);
    },
    enabled: !!actor && !isFetching && !!serviceId,
    refetchInterval: 5000,
    staleTime: 3000,
  });
}

export function useSetWeekdayServiceHours() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serviceId, startHour, endHour }: { serviceId: ServiceID; startHour: bigint; endHour: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setWeekdayServiceHours(serviceId, startHour, endHour);
    },
    onSuccess: (_, { serviceId }) => {
      queryClient.invalidateQueries({ queryKey: ['serviceHours', serviceId] });
      queryClient.invalidateQueries({ queryKey: ['myServices'] });
      queryClient.invalidateQueries({ queryKey: ['allServices'] });
      queryClient.invalidateQueries({ queryKey: ['estimatedWaitTime'] });
    },
  });
}

export function useSetWeekendServiceHours() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serviceId, startHour, endHour }: { serviceId: ServiceID; startHour: bigint; endHour: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setWeekendServiceHours(serviceId, startHour, endHour);
    },
    onSuccess: (_, { serviceId }) => {
      queryClient.invalidateQueries({ queryKey: ['serviceHours', serviceId] });
      queryClient.invalidateQueries({ queryKey: ['myServices'] });
      queryClient.invalidateQueries({ queryKey: ['allServices'] });
      queryClient.invalidateQueries({ queryKey: ['estimatedWaitTime'] });
    },
  });
}
