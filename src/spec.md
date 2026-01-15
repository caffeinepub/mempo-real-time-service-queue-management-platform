# MEMPO   Real Time Service Queue Management Platform

## Overview
MEMPO is a two-sided web platform that enables businesses to manage real-time service queues and allows customers to join queues remotely and track their wait times. The application provides unified access for both Business Owner and Customer views within a single interface.

## Application Flow

### Startup Splash Screen
- Display MEMPO logo prominently centered on screen
- Show tagline below the logo
- Splash screen displays for approximately 2 seconds
- Automatic transition to welcome screen after splash duration
- Clean, professional design with MEMPO branding

### Welcome Screen and Authentication Flow
- After splash screen, users are directed to a welcome screen (Jendela Selamat Datang di MEMPO)
- Welcome screen displays two role options: PEMILIK BISNIS and PELANGGAN
- Email input field is required alongside role selection
- Users must enter email address and select their role
- After both email and role are provided, Internet Identity authentication is automatically triggered without requiring any button clicks
- Internet Identity login modal must completely hide or disable the "Manage Identity" option, removing all identity management functionality from the authentication interface
- Authentication uses the previously selected identity automatically without showing identity selection options
- Authentication happens seamlessly in the background for both roles
- Display loading indicator or message in Indonesian to inform users that login is in progress
- Upon successful authentication, users are immediately redirected to their appropriate interface:
  - **PEMILIK BISNIS**: Navigate to BusinessDashboard
  - **PELANGGAN**: Navigate to CustomerView
- Email and role information are saved to backend and associated with Internet Identity
- All existing security and Internet Identity logic is maintained, just triggered automatically instead of via button

### Returning User Flow
- Returning users still see splash screen on app startup
- After splash, existing users with saved profiles can be automatically redirected to their appropriate interface
- If user profile exists in backend, skip welcome screen and go directly to their saved role interface
- If no profile exists, show welcome screen with email input and role selection

## User Roles

### Business Owners
- Register and authenticate using Internet Identity with email and role selection
- Authentication happens automatically in the background once email and role are provided
- Immediate navigation to Business Dashboard (Create Service/Manage Queue page) after successful authentication
- Create and manage service locations
- Configure opening/closing hours and service capacity for each location
- Set and manage service hours with separate weekday and weekend hours through the "Waktu Pelayanan" feature in the Manage Queue section
- Start and stop queues in real-time with dedicated control buttons
- Monitor current queue status including number of waiting customers
- Set and update estimated service time per customer using "Estimated Time" button in the Manage Queue section
- Input average service time per customer in minutes through a modal or input field
- Update estimated waiting times for customers
- Manage the currently served queue number with "Next" button that automatically increments the serving number by 1
- View the current serving number fetched from the backend in a read-only display
- View and control queue serving progression in real-time
- Delete services through a prominently visible red "X" delete button in the Manage Queue section
- Delete button is clearly visible for each service entry and only enabled when the service status is "Tutup" (closed)
- Confirmation dialog appears before deletion with message "Apakah Anda yakin ingin menghapus layanan ini?"
- Service list automatically refreshes after successful deletion

### Customers
- Register and authenticate using Internet Identity with email and role selection
- Authentication happens automatically in the background once email and role are provided
- Browse available service locations with dynamic search functionality
- Search for services by name using a search bar with placeholder text "Cari layanan…"
- Filter services in real-time as they type in the search bar
- View all services when search bar is cleared or empty
- View location status (open/closed) and current queue information
- View service hours (weekday and weekend hours) as read-only information for each service
- View the currently served queue number in real-time
- View estimated wait time calculated based on their position in queue and average service time per customer
- Join queues remotely only when queues are active and within service hours
- Cannot join queues if current time is past closing hour or if estimated waiting time would exceed closing hours
- Can only join one queue per service/business at any given time - duplicate queue joining is prevented
- View their current queue number prominently displayed in the Customer View under each service card
- Receive real-time updates on queue position, estimated wait time, currently served number, and their own queue number
- Leave queues voluntarily
- Manually refresh queue data using a dedicated refresh button

## Authentication and Profile Setup

### New User Registration Flow
- Users see startup splash screen with MEMPO logo and tagline
- After splash, users are presented with welcome screen (Jendela Selamat Datang di MEMPO)
- Welcome screen includes email input field and role options (PEMILIK BISNIS or PELANGGAN)
- Users must provide email and select role
- Once both email and role are provided, Internet Identity authentication is automatically triggered without button clicks
- Internet Identity login modal displays without the "Manage Identity" option - all identity management functionality is completely hidden or disabled
- Authentication uses the previously selected identity automatically without showing identity selection options
- Display loading indicator or message in Indonesian during authentication process
- After successful authentication, users are redirected to appropriate interface based on selected role
- User email and role selection are saved to backend and associated with Internet Identity

### Returning User Flow
- Existing users see splash screen on startup
- Backend automatically loads their saved user profile including email and role
- Users with existing profiles are directly redirected to their appropriate interface based on saved role
- Users without saved profiles are directed to welcome screen with email input

### Role Change Feature
- Authenticated users can change their role between PELANGGAN and PEMILIK BISNIS after initial profile creation
- "Change Role" button available in the profile menu (Header drop-down)
- Clicking opens a modal displaying both role options (PELANGGAN and PEMILIK BISNIS)
- Role selection updates the user's profile in the backend via updateUserRole function
- Frontend state updates immediately to render the appropriate dashboard without page refresh
- Role changes trigger real-time UI updates and automatic redirection to the correct interface

## Core Features

### Business Dashboard
- Queue control panel with start/stop functionality and clear visual indicators for queue status
- "Waktu Pelayanan" (Service Hours) section in the Manage Queue area with separate weekday and weekend hours configuration
- Service hours input with time picker controls for both weekday and weekend schedules, validation, and save functionality
- Service hours display showing current configured weekday and weekend hours with edit capability
- "Estimated Time" button in the Manage Queue section that opens a modal or input field for setting average service time per customer in minutes
- Estimated service time input with validation and save functionality
- Currently served number management with read-only display showing the current serving number fetched from the backend
- "Next" button that increments the current serving number by 1 and updates it on the backend via updateCurrentServingNumber
- Prominently visible red "X" delete button for each service in the Manage Queue section
- Delete button is clearly visible and only enabled when service status is "Tutup" (closed)
- Confirmation dialog with message "Apakah Anda yakin ingin menghapus layanan ini?" before deletion
- Automatic service list refresh after successful deletion using deleteServiceLocation(serviceId) backend method
- Status summary displaying:
  - Location open/closed status
  - Current queue length
  - Currently served queue number
  - Estimated time per customer
  - Service hours (weekday and weekend hours)
- Real-time queue management tools with automatic data refresh every few seconds
- Proper UI feedback including loading states, disabled buttons, and status labels
- Consistent layout and styling with existing queue control interface
- Visual loading indicators (spinners or progress bars) during queue updates and data fetching operations
- Optimized performance to prevent freezing or unresponsive behavior during queue operations

### Customer Interface
- Service location directory with search/filter capabilities
- Dynamic service search functionality with real-time filtering
- Search bar with placeholder text "Cari layanan…" for service name filtering
- Client-side filtering that updates the service list as users type
- All services displayed when search bar is empty or cleared
- Location details showing:
  - Service hours (weekday and weekend hours) as read-only information
  - Current wait time calculated based on queue position and estimated service time per customer
  - Queue status (active/stopped) with visual indicators
  - Currently served queue number in real-time
  - Customer's own queue number prominently displayed under each service card when they are queued
  - Service capacity information
  - Estimated Wait time in the Available Services section showing total wait time based on remaining customers and average service time
- Queue joining interface with real-time position tracking and automatic updates every few seconds
- Join queue button disabled when queue is stopped, paused, outside service hours, or when estimated waiting time would exceed closing hours
- Service hours validation preventing queue joining after closing time or when wait time exceeds service hours, considering both weekday and weekend schedules
- Duplicate queue prevention with clear Indonesian message "Anda sudah bergabung dalam antrian ini" when attempting to join the same service again
- Manual refresh button near the auto-refresh indicator that triggers immediate data refetch
- Refresh button with loading animation and disabled state during refresh operations
- Success toast notification when manual refresh completes successfully
- Instant local UI updates when joining queues for smooth user experience
- Visual loading states during queue data fetching and updates to improve user experience
- Optimized rendering performance to prevent UI freezing during real-time updates
- Real-time updates of customer's queue number as the service progresses or if they leave the queue

### Queue Management System
- Real-time queue processing with automatic position updates
- Queue start/stop control with immediate status synchronization across all users
- Service hours enforcement preventing queue operations outside configured weekday and weekend hours
- Currently served number tracking and real-time updates visible to all customers
- Automated serving number increment via "Next" button with immediate backend sync
- Dynamic wait time estimation based on service capacity, current queue length, estimated service time per customer, and service hours
- Estimated wait time calculation: (number of customers remaining from current serving number to customer's position) × estimated service time per customer
- Service hours validation in wait time calculations to prevent queue joining when estimated completion time exceeds closing hours, considering current day type (weekday/weekend)
- Queue entry tracking with customer identification and timestamps
- One queue per service per customer enforcement - prevents duplicate queue entries for the same service
- Customer queue number tracking and real-time synchronization across all users
- Automated data synchronization with short polling intervals for live updates
- Manual refresh capability that integrates with existing React Query hooks without page reload
- Proper queue-to-service mapping to ensure correct queueId is passed during joinQueue operations
- Backend maintains accurate queue-to-service relationships when queues are started
- Real-time synchronization of queue status, serving number changes, and service hours updates across all connected users
- Optimized React Query polling to prevent overlapping or infinite fetch loops
- Efficient data fetching patterns that maintain responsiveness without performance degradation

### Service Deletion System
- Service deletion functionality available only to business owners
- Prominently visible red "X" delete button displayed for each service in the Manage Queue section
- Delete button is clearly visible and conditionally enabled only when service status is "Tutup" (closed)
- Confirmation dialog displays before deletion with Indonesian message "Apakah Anda yakin ingin menghapus layanan ini?"
- Backend service deletion removes service from registry and all associated data using deleteServiceLocation(serviceId) method
- Automatic refresh of service list after successful deletion
- UI updates immediately to reflect service removal
- Proper error handling and user feedback during deletion process

## UI and Branding

### Splash Screen Integration
- Display MEMPO Logo 01.png prominently centered on splash screen
- Show tagline below the logo with appropriate typography
- Splash screen duration of approximately 2 seconds with smooth transition
- Clean, professional design consistent with MEMPO branding
- Responsive design for desktop and mobile views

### Welcome Screen Integration
- Display the MEMPO Logo 01.png prominently centered on welcome screen
- Show role selection options below the logo with PEMILIK BISNIS and PELANGGAN options
- Email input field and role selection interface
- Loading indicator or message in Indonesian during automatic authentication process
- Clean, professional design consistent with MEMPO branding
- Responsive design for desktop and mobile views

### Logo Integration
- Display the MEMPO Logo 01.png in the header component replacing text-based branding
- Ensure logo scales appropriately for desktop and mobile views with clear resolution
- Maintain centered alignment and proper spacing around the logo
- Logo should be responsive and maintain aspect ratio across different screen sizes
- Logo must display clearly on both dark and light themes with proper contrast

### Favicon Integration
- Use MEMPO Logo 01.png as the browser tab icon (favicon) across all pages
- Favicon should display consistently in browser tabs for all application pages
- Ensure favicon is properly integrated into the HTML head section for universal browser compatibility

## Backend Data Storage
- Business owner profiles and authentication data
- Customer profiles and authentication data
- User email addresses associated with Internet Identity principals
- User role information (PEMILIK BISNIS or PELANGGAN) linked to Internet Identity with update capability
- Service location information including hours, capacity, current status, and service hours (weekday and weekend hours)
- Service hours configuration (weekday and weekend hours) for each service location stored in ServiceLocation record
- Estimated service time per customer for each service location
- Active queue entries with customer IDs, join timestamps, position data, and queue numbers
- Customer-to-service queue mapping to enforce one queue per service per customer
- Queue configuration settings and historical data for wait time calculations
- Queue-to-service mapping data to ensure proper queue identification during join operations
- Queue status information (active/stopped) per queue
- Currently served queue number per queue with getter and setter endpoints

## Real-Time Features
- Live queue status updates for both businesses and customers with automatic refresh
- Real-time queue start/stop status synchronization across all users
- Real-time service hours updates when business owners modify weekday and weekend service hours configuration
- Currently served number updates visible to all customers in real-time
- Real-time customer queue number updates visible in Customer View under service cards
- Real-time estimated wait time updates when queue progresses, estimated service time changes, or service hours are modified
- Automatic position advancement when customers are served
- Dynamic wait time recalculation based on queue movement, service patterns, estimated service time per customer, and service hours constraints
- Real-time service hours validation for queue availability in Customer View considering weekday and weekend schedules
- Optimistic UI updates for queue joining with backend synchronization
- Continuous data polling to reflect real-time changes when customers join or leave queues
- Manual refresh functionality that calls refetch methods on existing React Query hooks
- Immediate UI updates when users change roles without requiring page refresh
- Real-time serving number updates when business owners use the "Next" button to increment the currently served number
- Real-time updates of customer's own queue number as queues progress or when they leave
- Real-time service list updates when services are deleted by business owners
- Optimized polling intervals and request management to prevent performance issues
- Efficient React Query configuration to avoid overlapping fetch requests and infinite loops

## Technical Requirements
- Splash screen component with timer-based automatic transition to welcome screen
- Welcome screen component with email input field and role selection options (PEMILIK BISNIS and PELANGGAN)
- Modified RoleSelectionPage routing logic to automatically trigger Internet Identity authentication once email and role are provided
- Internet Identity authentication configuration to completely hide or disable the "Manage Identity" option and all identity management functionality from the authentication interface
- Authentication must use the previously selected identity automatically without showing identity selection options
- Automatic authentication trigger without requiring button clicks for both PEMILIK BISNIS and PELANGGAN roles
- Loading indicator or message in Indonesian during authentication process
- Immediate redirection to appropriate dashboard upon successful authentication
- Email validation and storage in backend associated with Internet Identity
- Backend endpoints for storing and retrieving user email addresses
- Automatic user profile detection for returning users to skip welcome screen when appropriate
- Implement automatic data refresh using React Query with optimized polling intervals to prevent performance issues
- Customer view and service queue manager components must auto-refresh queue data efficiently without causing UI freezing
- Queue join actions should update UI immediately while syncing with backend
- Backend duplicate queue prevention logic to enforce one queue per service per customer
- Backend endpoints to check existing customer queue status for each service
- Frontend duplicate queue prevention with Indonesian error message display
- Customer queue number display in Customer View with real-time updates
- Manual refresh button integrates with React Query refetch methods for services and queues data
- Display loading state on refresh button during manual refresh operations
- Show success toast or visual cue when manual refresh completes
- Backend must store and retrieve user roles associated with Internet Identity principals
- Backend must store and retrieve estimated service time per customer for each service location
- Backend endpoints for setting and getting estimated service time per customer
- Backend endpoints for setting and getting service hours (weekday and weekend hours) for each service location
- Service hours validation logic in backend to prevent queue operations outside configured weekday and weekend hours
- Automatic role-based routing after authentication
- Backend updateUserRole function to handle role changes with proper validation
- Frontend role change modal component with immediate state updates
- Proper queueId handling in joinQueue flow with correct active queue identification
- Backend queue-to-service mapping storage and retrieval for accurate queue operations
- Backend endpoints for queue start/stop control with proper validation
- Backend endpoints for currently served number getter and setter operations
- Backend service deletion endpoint that removes service and associated data from registry
- Frontend service deletion confirmation dialog with Indonesian text
- Frontend delete button conditional enabling based on service status with clear visibility
- Frontend queue control UI with "Next" button for incrementing serving number and read-only display for current serving number
- Frontend "Estimated Time" button and input modal/field for setting average service time per customer
- Frontend "Waktu Pelayanan" section with time picker inputs for weekday and weekend hours configuration
- Service hours input validation ensuring end time is after start time for both weekday and weekend schedules
- Customer queue join restrictions based on queue active/stopped status and service hours constraints considering current day type
- Real-time synchronization of queue status, serving number, and service hours across all connected clients
- Logo integration in Header component and welcome screen using MEMPO Logo 01.png with responsive design and theme compatibility
- Favicon implementation using MEMPO Logo 01.png with proper HTML head integration for all pages
- Client-side service search functionality with real-time filtering based on service names
- Search bar component with placeholder text "Cari layanan…" integrated into Customer View
- Dynamic filtering that shows/hides services based on search query as users type
- Search functionality that displays all services when search input is empty or cleared
- Search bar styling consistent with existing MEMPO design using Tailwind CSS
- Application content language: Indonesian
- Optimized ServiceQueueManager and CustomerView components to prevent unnecessary re-renders
- Visual loading indicators (spinners, progress bars) during all queue update operations
- Efficient React Query configuration with proper stale time, cache time, and refetch intervals
- Performance monitoring to ensure queue controls remain fully functional after optimization
- Prevention of overlapping or infinite polling loops in real-time data fetching

## Performance Optimization Requirements
- React Query polling must be configured with appropriate intervals to prevent overlapping requests
- ServiceQueueManager component must be optimized to prevent unnecessary re-renders during queue updates
- CustomerView component must handle real-time updates efficiently without causing UI freezing
- Queue control buttons ("Start Queue", "Stop Queue", "Next Number", "Estimated Time", "Waktu Pelayanan") must remain responsive during all operations
- Service deletion operations must be optimized to prevent UI blocking during deletion process
- Visual loading states must be implemented for all queue update operations to provide user feedback
- Data fetching patterns must be optimized to maintain application responsiveness
- React component memoization and optimization techniques must be applied where appropriate
- Polling intervals must be balanced between real-time updates and performance efficiency
- Error handling and retry logic must be implemented to prevent infinite request loops
- Component lifecycle management must prevent memory leaks and performance degradation
- Search functionality must be optimized to prevent performance issues during real-time filtering
- Splash screen must load quickly and transition smoothly without performance impact
- Welcome screen must handle automatic authentication trigger efficiently without UI delays
- Automatic Internet Identity authentication must be seamless without affecting user experience

## Critical Synchronization Requirements
- Backend `getServiceQueueStatus` must return accurate queue state that matches the actual queue status set by business owners
- Customer view must immediately re-fetch queue status data when queues start or stop to ensure real-time consistency
- Service status (open/closed) displayed to customers must accurately reflect backend service state updated by `updateServiceStatus`
- Service hours changes (weekday and weekend) must immediately sync across all connected users through existing live update polling
- Service deletion must immediately sync across all connected users with automatic service list refresh
- Polling logic in React Query hooks must trigger immediate updates for both `getServiceQueueStatus` and `getAllActiveQueues` endpoints
- Frontend customer interface must refresh queue data automatically when queue state changes occur
- Backend queue state changes must be immediately reflected in customer-facing queue status displays
- Real-time data synchronization between business owner queue controls and customer queue visibility
- "Next" button serving number increments must immediately sync across all connected users through existing live update polling
- Estimated wait time updates must sync in real-time when business owners change estimated service time, service hours, or when queue progresses
- Customer queue number updates must sync in real-time across all users when queues progress or customers leave
- Service hours validation must be enforced in real-time preventing queue joining when outside weekday or weekend service hours or when estimated completion exceeds closing time
- All synchronization must occur efficiently without causing performance degradation or UI freezing
- Search functionality must work seamlessly with real-time data updates without interfering with queue synchronization
