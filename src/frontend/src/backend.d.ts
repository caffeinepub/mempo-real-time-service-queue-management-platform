import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface WorkingHour {
    closeTime: bigint;
    dayOfWeek: string;
    openTime: bigint;
}
export type QueueID = string;
export interface QueueEntry {
    joinTime: Time;
    customerID: CustomerID;
    position: bigint;
    estimatedWaitTime: bigint;
}
export type ServiceID = string;
export interface ServiceLocation {
    status: Variant_closed_open;
    weekdayServiceHours?: ServiceHours;
    name: string;
    workingHours: Array<WorkingHour>;
    address: string;
    serviceID: ServiceID;
    capacity: bigint;
    weekendServiceHours?: ServiceHours;
    estimatedServiceTimePerCustomer: bigint;
    estimatedWaitTime: bigint;
}
export interface ServiceHours {
    endHour: bigint;
    startHour: bigint;
}
export interface Queue {
    startTime: Time;
    currentServingNumber: bigint;
    entries: Array<QueueEntry>;
    queueID: QueueID;
    serviceID: ServiceID;
    currentStatus: Variant_active_stopped_paused;
}
export interface UserProfile {
    name: string;
    role: UserRole;
}
export type CustomerID = Principal;
export enum UserRole {
    businessOwner = "businessOwner",
    customer = "customer"
}
export enum UserRole__1 {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_active_stopped_paused {
    active = "active",
    stopped = "stopped",
    paused = "paused"
}
export enum Variant_closed_open {
    closed = "closed",
    open = "open"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole__1): Promise<void>;
    clearCustomerServiceQueueMapping(customerId: CustomerID): Promise<void>;
    createNewService(name: string, capacity: bigint): Promise<ServiceID>;
    deleteServiceLocation(serviceId: ServiceID): Promise<void>;
    getAllActiveQueues(): Promise<Array<Queue>>;
    getAllServices(): Promise<Array<ServiceLocation>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole__1>;
    getCompleteQueueQueueInfo(queueId: QueueID): Promise<{
        status: Variant_active_stopped_paused;
        currentServingNumber: bigint;
        entries: Array<QueueEntry>;
        serviceId: ServiceID;
    }>;
    getCurrentServingNumber(queueId: QueueID): Promise<bigint>;
    getCustomerPosition(queueId: QueueID, customerId: CustomerID): Promise<bigint>;
    getCustomerServiceQueues(customerId: CustomerID): Promise<Array<[ServiceID, QueueID]>>;
    getEstimatedTimePerCustomer(serviceId: ServiceID): Promise<bigint | null>;
    getEstimatedWaitTimeForCustomer(serviceId: ServiceID): Promise<{
        status: string;
        timeBasedOnQueue: bigint;
        open: boolean;
        currentServingNumber?: bigint;
        estimatedTotalWait: bigint;
        queueId?: QueueID;
        serviceId: ServiceID;
        currentQueueLength: bigint;
        estimatedServiceTimePerCustomer: bigint;
    }>;
    getMyServices(): Promise<Array<ServiceLocation>>;
    getQueueEntries(queueId: QueueID): Promise<Array<QueueEntry>>;
    getQueueService(queueId: QueueID): Promise<ServiceID>;
    getQueueStatus(queueId: QueueID): Promise<Variant_active_stopped_paused>;
    getService(serviceId: ServiceID): Promise<ServiceLocation | null>;
    getServiceHours(serviceId: ServiceID): Promise<{
        weekdayServiceHours?: ServiceHours;
        weekendServiceHours?: ServiceHours;
    }>;
    getServiceOwner(serviceId: ServiceID): Promise<Principal>;
    getServiceQueueStatus(serviceId: ServiceID): Promise<Variant_active_stopped_paused | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    joinQueue(queueId: QueueID): Promise<bigint>;
    leaveQueue(queueId: QueueID): Promise<void>;
    pauseServiceQueue(queueId: QueueID): Promise<void>;
    resumeServiceQueue(queueId: QueueID): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setEstimatedTimePerCustomer(serviceId: ServiceID, timeInMinutes: bigint): Promise<void>;
    /**
     * / =======================
     * / New Service Hour Methods
     * / =======================
     */
    setWeekdayServiceHours(serviceId: ServiceID, startHour: bigint, endHour: bigint): Promise<void>;
    setWeekendServiceHours(serviceId: ServiceID, startHour: bigint, endHour: bigint): Promise<void>;
    startServiceQueue(serviceId: ServiceID): Promise<QueueID>;
    stopServiceQueue(queueId: QueueID): Promise<void>;
    updateCurrentServingNumber(queueId: QueueID, newNumber: bigint): Promise<void>;
    updateUserRole(newRole: UserRole): Promise<void>;
}
