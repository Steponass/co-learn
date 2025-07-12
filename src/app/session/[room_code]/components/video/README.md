# Video Conferencing Architecture

This directory contains the refactored video conferencing system that follows the proper SFU (Selective Forwarding Unit) connection flow.

## Architecture Overview

The system is now modular and follows these principles:

1. **Separation of Concerns**: Each component has a single responsibility
2. **Type Safety**: Strict TypeScript types throughout
3. **Proper SFU Flow**: Follows the correct connection sequence
4. **Modular Design**: Easy to test and maintain

## Directory Structure

```
video/
├── core/                    # Core SFU functionality
│   ├── types.ts            # TypeScript interfaces and types
│   ├── config.ts           # SFU configuration
│   ├── sfuApi.ts          # HTTP API client for SFU
│   ├── connectionManager.ts # WebRTC peer connection management
│   ├── trackManager.ts     # Remote track discovery and subscription
│   ├── sfuService.ts      # Main orchestrator service
│   └── index.ts           # Exports
├── hooks/                  # React hooks
│   └── useSFUConnection.ts # Main connection hook
├── components/             # UI components
│   ├── VideoGrid.tsx      # Main video grid component
│   ├── RemoteVideoGrid.tsx # Remote video display
│   ├── SelfVideo.tsx      # Local video display
│   └── VideoControlBar.tsx # Video controls
└── legacy/                # Old implementation (backup)
```

## Connection Flow

The system follows this SFU connection sequence:

1. **Establish Connection**:

   - Create peer connection with ICE servers
   - Get local media stream
   - Add local tracks to peer connection
   - Create SDP offer and send to SFU
   - Receive SFU's remote SDP and set it

2. **Publish Tracks**:

   - Add local media tracks to peer connection
   - Generate SDP offer for publishing
   - Send to SFU with track metadata
   - Receive and set remote SDP

3. **Subscribe to Tracks**:
   - Discover other sessions via polling
   - Get available tracks from remote sessions
   - Subscribe to remote tracks via HTTP API
   - Receive SDP for subscribed tracks
   - Set remote description and renegotiate

## Key Components

### SFUService

Main orchestrator that coordinates the connection manager and track manager.

### ConnectionManager

Handles WebRTC peer connection lifecycle and follows the proper SFU connection flow.

### TrackManager

Discovers remote sessions and manages track subscriptions.

### SFUApiClient

Handles all HTTP requests to the SFU server with proper error handling.

## Usage

```typescript
import { useSFUConnection } from "./hooks/useSFUConnection";

const { localStream, remoteStreams, connectionState, isInitialized } =
  useSFUConnection([], userId, roomId);
```

## Benefits of Refactor

1. **Modularity**: Each component has a single responsibility
2. **Type Safety**: Strict TypeScript types prevent runtime errors
3. **Testability**: Each component can be tested independently
4. **Maintainability**: Clear separation of concerns
5. **Proper SFU Flow**: Follows the correct connection sequence
6. **Error Handling**: Comprehensive error handling throughout
7. **Resource Management**: Proper cleanup of connections and streams

## Migration Notes

The old implementation has been moved to `legacy/` directory. The new implementation maintains the same UI but with a completely refactored backend that follows proper SFU protocols.
