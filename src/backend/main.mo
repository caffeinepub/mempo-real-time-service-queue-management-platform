import Map "mo:core/Map";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  type Time = Time.Time;
  type ServiceID = Text;
  type CustomerID = Principal;
  type QueueID = Text;

  type ServiceHours = {
    startHour : Nat;
    endHour : Nat;
  };

  type WorkingHour = {
    dayOfWeek : Text;
    openTime : Int;
    closeTime : Int;
  };

  type ServiceLocation = {
    serviceID : ServiceID;
    name : Text;
    address : Text;
    status : { #open; #closed };
    estimatedWaitTime : Nat;
    workingHours : [WorkingHour];
    capacity : Int;
    estimatedServiceTimePerCustomer : Nat;
    weekdayServiceHours : ?ServiceHours;
    weekendServiceHours : ?ServiceHours;
  };

  type QueueEntry = {
    customerID : CustomerID;
    joinTime : Time;
    estimatedWaitTime : Nat;
    position : Nat;
  };

  module QueueEntry {
    public func compare(entry1 : QueueEntry, entry2 : QueueEntry) : Order.Order {
      Nat.compare(entry1.position, entry2.position);
    };
  };

  type Queue = {
    queueID : QueueID;
    serviceID : ServiceID;
    startTime : Time;
    entries : [QueueEntry];
    currentStatus : { #active; #paused; #stopped };
    currentServingNumber : Nat;
  };

  module Queue {
    public func compare(queue1 : Queue, queue2 : Queue) : Order.Order {
      Text.compare(queue1.queueID, queue2.queueID);
    };
  };

  type BusinessOwner = {
    id : Principal;
    username : Text;
  };

  module BusinessOwner {
    public func compare(owner1 : BusinessOwner, owner2 : BusinessOwner) : Order.Order {
      Text.compare(owner1.username, owner2.username);
    };
  };

  type Customer = {
    id : Principal;
    username : Text;
  };

  module Customer {
    public func compare(customer1 : Customer, customer2 : Customer) : Order.Order {
      Text.compare(customer1.username, customer2.username);
    };
  };

  module ServiceLocation {
    public func compare(location1 : ServiceLocation, location2 : ServiceLocation) : Order.Order {
      Text.compare(location1.name, location2.name);
    };
  };

  public type UserRole = {
    #businessOwner;
    #customer;
  };

  public type UserProfile = {
    name : Text;
    role : UserRole;
  };

  let businessOwners = Map.empty<Principal, BusinessOwner>();
  let customers = Map.empty<Principal, Customer>();
  let services = Map.empty<ServiceID, ServiceLocation>();
  let queues = Map.empty<QueueID, Queue>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Add mapping of business owner to their service locations
  let ownerServices = Map.empty<Principal, [ServiceID]>();
  let serviceOwnerMap = Map.empty<ServiceID, Principal>();
  let queueServiceMap = Map.empty<QueueID, ServiceID>();

  // Maps customer to service mapping to queue IDs
  let customerQueueMap = Map.empty<CustomerID, Map.Map<ServiceID, QueueID>>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  func generateServiceId(owner : Principal, name : Text) : ServiceID {
    owner.toText() # "-" # name;
  };

  func generateQueueId(serviceId : ServiceID) : QueueID {
    serviceId # "-" # Time.now().toText();
  };

  func updateServiceStatus(serviceId : Text, newStatus : { #open; #closed }) {
    switch (services.get(serviceId)) {
      case (null) {
        Runtime.trap("Service not found");
      };
      case (?service) {
        let updatedService : ServiceLocation = {
          service with
          status = newStatus;
        };
        services.add(serviceId, updatedService);
      };
    };
  };

  func isServiceOwner(caller : Principal, serviceId : ServiceID) : Bool {
    switch (serviceOwnerMap.get(serviceId)) {
      case (null) { false };
      case (?owner) { Principal.equal(owner, caller) };
    };
  };

  func isBusinessOwner(caller : Principal) : Bool {
    switch (userProfiles.get(caller)) {
      case (null) { false };
      case (?profile) {
        switch (profile.role) {
          case (#businessOwner) { true };
          case (#customer) { false };
        };
      };
    };
  };

  func isCustomer(caller : Principal) : Bool {
    switch (userProfiles.get(caller)) {
      case (null) { false };
      case (?profile) {
        switch (profile.role) {
          case (#customer) { true };
          case (#businessOwner) { false };
        };
      };
    };
  };

  func isCustomerInQueue(caller : Principal, queueId : QueueID) : Bool {
    switch (queues.get(queueId)) {
      case (null) { false };
      case (?queue) {
        let maybeEntry = queue.entries.find(func(entry) { Principal.equal(entry.customerID, caller) });
        switch (maybeEntry) {
          case (null) { false };
          case (?_) { true };
        };
      };
    };
  };

  public shared ({ caller }) func createNewService(name : Text, capacity : Int) : async ServiceID {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can create services");
    };

    if (not isBusinessOwner(caller)) {
      Runtime.trap("Unauthorized: Only business owners can create services");
    };

    let serviceId = generateServiceId(caller, name);

    let newService : ServiceLocation = {
      serviceID = serviceId;
      name = name;
      address = "Location: " # serviceId;
      status = #closed;
      estimatedWaitTime = 0;
      workingHours = [
        {
          dayOfWeek = "Monday";
          openTime = 9;
          closeTime = 17;
        },
      ];
      capacity = capacity;
      estimatedServiceTimePerCustomer = 0;
      weekdayServiceHours = ?{ startHour = 8; endHour = 17 };
      weekendServiceHours = ?{ startHour = 10; endHour = 15 };
    };

    services.add(serviceId, newService);

    serviceOwnerMap.add(serviceId, caller);
    // Add service location to owner's tracking
    let existingServices = switch (ownerServices.get(caller)) {
      case (null) { [] };
      case (?services) { services };
    };
    ownerServices.add(caller, existingServices.concat([serviceId]));

    serviceId;
  };

  public shared ({ caller }) func startServiceQueue(serviceId : ServiceID) : async QueueID {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can start queues");
    };

    if (not isBusinessOwner(caller)) {
      Runtime.trap("Unauthorized: Only business owners can start queues");
    };

    if (not isServiceOwner(caller, serviceId)) {
      Runtime.trap("Unauthorized: Only the service owner can start queues");
    };

    switch (services.get(serviceId)) {
      case (null) {
        Runtime.trap("Service not found");
      };
      case (?service) {
        let queueId = generateQueueId(serviceId);

        let newQueue : Queue = {
          queueID = queueId;
          serviceID = serviceId;
          startTime = Time.now();
          entries = [];
          currentStatus = #active;
          currentServingNumber = 1;
        };

        queues.add(queueId, newQueue);
        queueServiceMap.add(queueId, serviceId);
        updateServiceStatus(serviceId, #open);

        queueId;
      };
    };
  };

  public shared ({ caller }) func pauseServiceQueue(queueId : QueueID) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can pause queues");
    };

    if (not isBusinessOwner(caller)) {
      Runtime.trap("Unauthorized: Only business owners can pause queues");
    };

    switch (queues.get(queueId)) {
      case (null) {
        Runtime.trap("Queue not found");
      };
      case (?queue) {
        if (not isServiceOwner(caller, queue.serviceID)) {
          Runtime.trap("Unauthorized: Only the service owner can pause queues");
        };

        let updatedQueue : Queue = {
          queue with
          currentStatus = #paused;
        };
        queues.add(queueId, updatedQueue);
      };
    };
  };

  public shared ({ caller }) func stopServiceQueue(queueId : QueueID) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can stop queues");
    };

    if (not isBusinessOwner(caller)) {
      Runtime.trap("Unauthorized: Only business owners can stop queues");
    };

    switch (queues.get(queueId)) {
      case (null) {
        Runtime.trap("Queue not found");
      };
      case (?queue) {
        if (not isServiceOwner(caller, queue.serviceID)) {
          Runtime.trap("Unauthorized: Only the service owner can stop queues");
        };

        let updatedQueue : Queue = {
          queue with
          currentStatus = #stopped;
        };
        queues.add(queueId, updatedQueue);

        updateServiceStatus(queue.serviceID, #closed);
        ();
      };
    };
  };

  public shared ({ caller }) func resumeServiceQueue(queueId : QueueID) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can resume queues");
    };

    if (not isBusinessOwner(caller)) {
      Runtime.trap("Unauthorized: Only business owners can resume queues");
    };

    switch (queues.get(queueId)) {
      case (null) {
        Runtime.trap("Queue not found");
      };
      case (?queue) {
        if (not isServiceOwner(caller, queue.serviceID)) {
          Runtime.trap("Unauthorized: Only the service owner can resume queues");
        };

        let updatedQueue : Queue = {
          queue with
          currentStatus = #active;
        };
        queues.add(queueId, updatedQueue);
      };
    };
  };

  public shared ({ caller }) func joinQueue(queueId : QueueID) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can join queues");
    };

    if (not isCustomer(caller)) {
      Runtime.trap("Unauthorized: Only customers can join queues");
    };

    switch (queues.get(queueId)) {
      case (null) {
        Runtime.trap("Queue not found");
      };
      case (?queue) {
        if (queue.currentStatus != #active) {
          Runtime.trap("Unauthorized: Cannot join queue - queue is not active");
        };

        // New logic: Check if customer already exists in queue for the same service
        if (customerAlreadyInServiceQueue(caller, queue.serviceID)) {
          Runtime.trap("Anda sudah bergabung dalam antrian ini");
        };

        let queueLength = queue.entries.size();
        let customerPosition = queueLength + 1;

        let entry : QueueEntry = {
          customerID = caller;
          joinTime = Time.now();
          estimatedWaitTime = 0;
          position = customerPosition;
        };

        let updatedEntries = queue.entries.concat([entry]);
        let updatedQueue : Queue = {
          queue with
          entries = updatedEntries;
        };
        queues.add(queueId, updatedQueue);

        // Dynamically update service ID to queue IDs map
        switch (customerQueueMap.get(caller)) {
          case (null) {
            let newServiceMap = Map.empty<ServiceID, QueueID>();
            newServiceMap.add(queue.serviceID, queueId);
            customerQueueMap.add(caller, newServiceMap);
          };
          case (?serviceMap) {
            serviceMap.add(queue.serviceID, queueId);
          };
        };

        customerPosition;
      };
    };
  };

  public shared ({ caller }) func leaveQueue(queueId : QueueID) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can leave queues");
    };

    if (not isCustomer(caller)) {
      Runtime.trap("Unauthorized: Only customers can leave queues");
    };

    // Verify the caller is actually in this queue
    if (not isCustomerInQueue(caller, queueId)) {
      Runtime.trap("Unauthorized: You are not in this queue");
    };

    switch (queues.get(queueId)) {
      case (null) {
        Runtime.trap("Queue not found");
      };
      case (?queue) {
        let filteredEntries = queue.entries.filter(
          func(entry) {
            not Principal.equal(entry.customerID, caller);
          }
        );
        let updatedQueue : Queue = {
          queue with
          entries = filteredEntries;
        };
        queues.add(queueId, updatedQueue);

        // Remove service from queue sets after leaving
        switch (customerQueueMap.get(caller)) {
          case (null) {};
          case (?serviceMap) {
            serviceMap.remove(queue.serviceID);
          };
        };
      };
    };
  };

  public query ({ caller }) func getCustomerServiceQueues(customerId : CustomerID) : async [(ServiceID, QueueID)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view customer service queues");
    };

    // Only the customer themselves or an admin can view their queue mappings
    if (not Principal.equal(caller, customerId) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own queue mappings");
    };

    switch (customerQueueMap.get(customerId)) {
      case (null) { [] };
      case (?serviceMap) { serviceMap.toArray() };
    };
  };

  public shared ({ caller }) func clearCustomerServiceQueueMapping(customerId : CustomerID) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can clear service mapping");
    };

    if (not Principal.equal(caller, customerId) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only the customer can clear their own mapping");
    };

    // Additional check: verify caller is a customer (unless admin)
    if (not AccessControl.isAdmin(accessControlState, caller) and not isCustomer(caller)) {
      Runtime.trap("Unauthorized: Only customers can clear queue mappings");
    };

    customerQueueMap.remove(customerId);
  };

  func customerAlreadyInServiceQueue(customerId : CustomerID, serviceId : ServiceID) : Bool {
    switch (customerQueueMap.get(customerId)) {
      case (null) { false };
      case (?services) { switch (services.get(serviceId)) { case (null) { false }; case (?_) { true } } };
    };
  };

  public query ({ caller }) func getQueueEntries(queueId : QueueID) : async [QueueEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view queue entries");
    };

    switch (queues.get(queueId)) {
      case (null) {
        Runtime.trap("Queue not found");
      };
      case (?queue) {
        switch (queueServiceMap.get(queueId)) {
          case (null) {
            Runtime.trap("Queue service mapping not found");
          };
          case (?serviceId) {
            // Allow service owners, customers in the queue, or admins
            if (not isServiceOwner(caller, serviceId) and not isCustomerInQueue(caller, queueId) and not AccessControl.isAdmin(accessControlState, caller)) {
              Runtime.trap("Unauthorized: Only service owners or customers in the queue can view queue entries");
            };
            queue.entries;
          };
        };
      };
    };
  };

  public query ({ caller }) func getCustomerPosition(queueId : QueueID, customerId : CustomerID) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view queue positions");
    };

    if (not Principal.equal(caller, customerId) and not AccessControl.isAdmin(accessControlState, caller)) {
      switch (queueServiceMap.get(queueId)) {
        case (null) {
          Runtime.trap("Queue not found");
        };
        case (?serviceId) {
          if (not isServiceOwner(caller, serviceId)) {
            Runtime.trap("Unauthorized: Can only view your own position");
          };
        };
      };
    };

    switch (queues.get(queueId)) {
      case (null) {
        Runtime.trap("Queue not found");
      };
      case (?queue) {
        let maybeEntry = queue.entries.find(func(entry) { Principal.equal(entry.customerID, customerId) });
        switch (maybeEntry) {
          case (null) {
            Runtime.trap("Customer \"" # customerId.toText() # "\" not found in the queue \"" # queueId);
          };
          case (?entry) { entry.position };
        };
      };
    };
  };

  // Requires authentication - only registered users can browse services
  public query ({ caller }) func getAllServices() : async [ServiceLocation] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view services");
    };
    services.values().toArray();
  };

  // Requires authentication - only registered users can view service details
  public query ({ caller }) func getService(serviceId : ServiceID) : async ?ServiceLocation {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view service details");
    };
    services.get(serviceId);
  };

  public query ({ caller }) func getServiceOwner(serviceId : ServiceID) : async Principal {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view service owners");
    };

    switch (serviceOwnerMap.get(serviceId)) {
      case (null) {
        Runtime.trap("Service not found");
      };
      case (?owner) {
        // Allow service owner to view their own ownership, or admins
        if (not Principal.equal(caller, owner) and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the service owner or admins can view service ownership");
        };
        owner;
      };
    };
  };

  public query ({ caller }) func getQueueService(queueId : QueueID) : async ServiceID {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view queue service mapping");
    };

    switch (queueServiceMap.get(queueId)) {
      case (null) {
        Runtime.trap("Queue not found");
      };
      case (?serviceId) {
        // Allow service owners, customers in the queue, or admins
        if (not isServiceOwner(caller, serviceId) and not isCustomerInQueue(caller, queueId) and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only service owners or customers in the queue can view queue service mapping");
        };
        serviceId;
      };
    };
  };

  public query ({ caller }) func getMyServices() : async [ServiceLocation] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view their services");
    };

    if (not isBusinessOwner(caller)) {
      Runtime.trap("Unauthorized: Only business owners can view their services");
    };

    services.values().toArray().filter(func(service) { isServiceOwner(caller, service.serviceID) });
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view profiles");
    };

    if (not Principal.equal(caller, user) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func updateUserRole(newRole : UserRole) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update roles");
    };

    switch (userProfiles.get(caller)) {
      case (null) {
        Runtime.trap("User profile not found");
      };
      case (?profile) {
        let updatedProfile : UserProfile = {
          profile with
          role = newRole;
        };
        userProfiles.add(caller, updatedProfile);
      };
    };
  };

  // Requires authentication - only registered users can view queue status
  public query ({ caller }) func getServiceQueueStatus(serviceId : ServiceID) : async ?{ #active; #paused; #stopped } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view queue status");
    };

    var currentStatus : { #active; #paused; #stopped } = #stopped;

    for ((_, queue) in queues.entries()) {
      if (queue.serviceID == serviceId) {
        if (queue.currentStatus == #active) {
          return ?#active;
        } else if (queue.currentStatus == #paused) {
          currentStatus := #paused;
        };
      };
    };

    if (currentStatus == #stopped) {
      if (queues.values().toArray().find(func(q) { q.serviceID == serviceId }) == null) {
        return null;
      };
    };

    ?currentStatus;
  };

  public shared ({ caller }) func updateCurrentServingNumber(queueId : QueueID, newNumber : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can update serving numbers");
    };

    if (not isBusinessOwner(caller)) {
      Runtime.trap("Unauthorized: Only business owners can update serving numbers");
    };

    switch (queues.get(queueId)) {
      case (null) {
        Runtime.trap("Queue not found");
      };
      case (?queue) {
        if (not isServiceOwner(caller, queue.serviceID)) {
          Runtime.trap("Unauthorized: Only the service owner can update the serving number");
        };

        let updatedQueue : Queue = {
          queue with
          currentServingNumber = newNumber;
        };
        queues.add(queueId, updatedQueue);
      };
    };
  };

  // Requires authentication - only registered users can view serving numbers
  public query ({ caller }) func getCurrentServingNumber(queueId : QueueID) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view serving numbers");
    };

    switch (queues.get(queueId)) {
      case (null) {
        Runtime.trap("Queue not found");
      };
      case (?queue) {
        queue.currentServingNumber;
      };
    };
  };

  public query ({ caller }) func getCompleteQueueQueueInfo(queueId : QueueID) : async {
    entries : [QueueEntry];
    currentServingNumber : Nat;
    serviceId : ServiceID;
    status : { #active; #paused; #stopped };
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view queue information");
    };

    switch (queues.get(queueId)) {
      case (null) {
        Runtime.trap("Queue not found");
      };
      case (?queue) {
        // Allow service owners, customers in the queue, or admins
        if (not isServiceOwner(caller, queue.serviceID) and not isCustomerInQueue(caller, queueId) and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only service owners or customers in the queue can view complete queue information");
        };

        {
          entries = queue.entries;
          currentServingNumber = queue.currentServingNumber;
          serviceId = queue.serviceID;
          status = queue.currentStatus;
        };
      };
    };
  };

  // Requires authentication - only registered users can view active queues
  public query ({ caller }) func getAllActiveQueues() : async [Queue] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view active queues");
    };

    let allQueues = queues.values().toArray();
    allQueues.filter(func(queue) { queue.currentStatus == #active });
  };

  // Requires authentication - only registered users can view queue status
  public query ({ caller }) func getQueueStatus(queueId : QueueID) : async { #active; #paused; #stopped } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view queue status");
    };

    switch (queues.get(queueId)) {
      case (null) {
        Runtime.trap("Queue not found");
      };
      case (?queue) {
        queue.currentStatus;
      };
    };
  };

  // Business owner only - requires authentication and ownership
  public shared ({ caller }) func setEstimatedTimePerCustomer(serviceId : ServiceID, timeInMinutes : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can update estimated time");
    };

    if (not isBusinessOwner(caller)) {
      Runtime.trap("Unauthorized: Only business owners can update estimated time");
    };

    if (not isServiceOwner(caller, serviceId)) {
      Runtime.trap("Unauthorized: Only the service owner can update estimated time");
    };

    switch (services.get(serviceId)) {
      case (null) {
        Runtime.trap("Service not found");
      };
      case (?service) {
        let updatedService : ServiceLocation = {
          service with
          estimatedServiceTimePerCustomer = timeInMinutes;
        };
        services.add(serviceId, updatedService);
      };
    };
  };

  // Requires authentication - only registered users can view estimated time
  public query ({ caller }) func getEstimatedTimePerCustomer(serviceId : ServiceID) : async ?Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view estimated time");
    };

    switch (services.get(serviceId)) {
      case (null) {
        Runtime.trap("Service not found");
      };
      case (?service) {
        ?service.estimatedServiceTimePerCustomer;
      };
    };
  };

  // Requires authentication - only registered users can view wait times
  public query ({ caller }) func getEstimatedWaitTimeForCustomer(serviceId : ServiceID) : async {
    estimatedServiceTimePerCustomer : Nat;
    currentQueueLength : Nat;
    timeBasedOnQueue : Nat;
    estimatedTotalWait : Nat;
    queueId : ?QueueID;
    serviceId : ServiceID;
    open : Bool;
    currentServingNumber : ?Nat;
    status : Text;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view wait times");
    };

    switch (services.get(serviceId)) {
      case (null) { Runtime.trap("Service not found") };
      case (?service) {
        if (service.status != #open) { return { estimatedServiceTimePerCustomer = 0; currentQueueLength = 0; timeBasedOnQueue = 0; estimatedTotalWait = 0; queueId = null; serviceId; open = false; status = "Tutup/Pause"; currentServingNumber = null } } else if (service.estimatedServiceTimePerCustomer == 0) {
          return { estimatedServiceTimePerCustomer = 0; currentQueueLength = 0; timeBasedOnQueue = 0; estimatedTotalWait = 0; queueId = null; serviceId; open = false; status = "Belum Set Waktu"; currentServingNumber = null };
        };

        let activeQueues = queues.values().toArray().filter(
          func(q) { q.serviceID == serviceId and q.currentStatus == #active }
        );

        switch (activeQueues.size()) {
          case (0) { return { estimatedServiceTimePerCustomer = 0; currentQueueLength = 0; timeBasedOnQueue = 0; estimatedTotalWait = 0; queueId = null; serviceId; open = false; status = "Tutup/Pause"; currentServingNumber = null } };
          case (_) {
            let activeQ = activeQueues[0];
            let customersRemaining = if (activeQ.entries.size() >= activeQ.currentServingNumber) {
              activeQ.entries.size() - (activeQ.currentServingNumber - 1);
            } else { 0 };

            let totalEstimatedWait = if (customersRemaining > 0) {
              customersRemaining * service.estimatedServiceTimePerCustomer;
            } else { 0 };

            return {
              estimatedServiceTimePerCustomer = service.estimatedServiceTimePerCustomer;
              currentQueueLength = activeQ.entries.size();
              timeBasedOnQueue = totalEstimatedWait;
              estimatedTotalWait = totalEstimatedWait;
              queueId = ?activeQ.queueID;
              serviceId;
              open = true;
              currentServingNumber = ?activeQ.currentServingNumber;
              status = if (activeQ.currentStatus == #active) { "Aktif" } else if (activeQ.currentStatus == #paused) { "Paused" } else { "Selesai" };
            };
          };
        };
      };
    };
  };

  /// =======================
  /// New Service Hour Methods
  /// =======================
  public shared ({ caller }) func setWeekdayServiceHours(serviceId : ServiceID, startHour : Nat, endHour : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can update service hours");
    };

    if (not isBusinessOwner(caller)) {
      Runtime.trap("Unauthorized: Only business owners can update service hours");
    };

    if (not isServiceOwner(caller, serviceId)) {
      Runtime.trap("Unauthorized: Only the service owner can update service hours");
    };

    if (endHour <= startHour) {
      Runtime.trap("End time must be later than start time");
    };

    switch (services.get(serviceId)) {
      case (null) { Runtime.trap("Service not found") };
      case (?service) {
        let updatedService : ServiceLocation = {
          service with
          weekdayServiceHours = ?{ startHour; endHour };
        };
        services.add(serviceId, updatedService);
      };
    };
  };

  public shared ({ caller }) func setWeekendServiceHours(serviceId : ServiceID, startHour : Nat, endHour : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can update service hours");
    };

    if (not isBusinessOwner(caller)) {
      Runtime.trap("Unauthorized: Only business owners can update service hours");
    };

    if (not isServiceOwner(caller, serviceId)) {
      Runtime.trap("Unauthorized: Only the service owner can update service hours");
    };

    if (endHour <= startHour) {
      Runtime.trap("End time must be later than start time");
    };

    switch (services.get(serviceId)) {
      case (null) { Runtime.trap("Service not found") };
      case (?service) {
        let updatedService : ServiceLocation = {
          service with
          weekendServiceHours = ?{ startHour; endHour };
        };
        services.add(serviceId, updatedService);
      };
    };
  };

  // Requires authentication - only registered users can view service hours
  public query ({ caller }) func getServiceHours(serviceId : ServiceID) : async {
    weekdayServiceHours : ?ServiceHours;
    weekendServiceHours : ?ServiceHours;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view service hours");
    };

    switch (services.get(serviceId)) {
      case (null) { Runtime.trap("Service not found") };
      case (?service) { { weekdayServiceHours = service.weekdayServiceHours; weekendServiceHours = service.weekendServiceHours } };
    };
  };

  // New Delete Service Function
  public shared ({ caller }) func deleteServiceLocation(serviceId : ServiceID) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can delete services");
    };

    if (not isBusinessOwner(caller)) {
      Runtime.trap("Unauthorized: Only business owners can delete services");
    };

    switch (services.get(serviceId)) {
      case (null) {
        Runtime.trap("Service not found");
      };
      case (?service) {
        if (not isServiceOwner(caller, serviceId)) {
          Runtime.trap("Unauthorized: Only the service owner can delete this service");
        };

        if (service.status != #closed) {
          Runtime.trap("Unauthorized: Can only delete services that are closed");
        };

        services.remove(serviceId);
        serviceOwnerMap.remove(serviceId);

        // Remove service location from owner's tracking
        let existingServices = switch (ownerServices.get(caller)) {
          case (null) { [] };
          case (?services) { services };
        };
        let updatedServices = existingServices.filter(func(s) { s != serviceId });
        ownerServices.add(caller, updatedServices);
      };
    };
  };
};
