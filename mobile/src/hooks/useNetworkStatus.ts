import { useState, useEffect, useCallback } from 'react';
import NetInfo, {
  NetInfoState,
  NetInfoSubscription,
} from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
  isWifi: boolean;
  isCellular: boolean;
}

const OFFLINE_QUEUE_KEY = '@daymatch_offline_queue';

export interface QueuedRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  data?: any;
  timestamp: number;
}

/**
 * Hook to monitor network connectivity status
 */
export const useNetworkStatus = () => {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
    isWifi: false,
    isCellular: false,
  });
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    let subscription: NetInfoSubscription;

    const handleNetworkChange = (state: NetInfoState) => {
      const newStatus: NetworkStatus = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isWifi: state.type === 'wifi',
        isCellular: state.type === 'cellular',
      };

      setStatus((prevStatus) => {
        // Track if we were offline and are now back online
        if (!prevStatus.isConnected && newStatus.isConnected) {
          setWasOffline(true);
          // Reset after a short delay
          setTimeout(() => setWasOffline(false), 3000);
        }
        return newStatus;
      });
    };

    // Get initial state
    NetInfo.fetch().then(handleNetworkChange);

    // Subscribe to updates
    subscription = NetInfo.addEventListener(handleNetworkChange);

    return () => {
      subscription?.();
    };
  }, []);

  return { ...status, wasOffline };
};

/**
 * Hook for offline queue management
 * Queues requests when offline and processes them when back online
 */
export const useOfflineQueue = () => {
  const [queue, setQueue] = useState<QueuedRequest[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load queue from storage on mount
  useEffect(() => {
    const loadQueue = async () => {
      try {
        const storedQueue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
        if (storedQueue) {
          setQueue(JSON.parse(storedQueue));
        }
      } catch (error) {
        console.error('Failed to load offline queue:', error);
      }
    };
    loadQueue();
  }, []);

  // Save queue to storage whenever it changes
  useEffect(() => {
    const saveQueue = async () => {
      try {
        await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      } catch (error) {
        console.error('Failed to save offline queue:', error);
      }
    };
    saveQueue();
  }, [queue]);

  /**
   * Add a request to the offline queue
   */
  const addToQueue = useCallback(
    (request: Omit<QueuedRequest, 'id' | 'timestamp'>) => {
      const queuedRequest: QueuedRequest = {
        ...request,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };
      setQueue((prev) => [...prev, queuedRequest]);
      return queuedRequest.id;
    },
    [],
  );

  /**
   * Remove a request from the queue
   */
  const removeFromQueue = useCallback((id: string) => {
    setQueue((prev) => prev.filter((req) => req.id !== id));
  }, []);

  /**
   * Clear the entire queue
   */
  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  /**
   * Process all queued requests
   */
  const processQueue = useCallback(
    async (
      executor: (request: QueuedRequest) => Promise<boolean>,
    ): Promise<{ success: number; failed: number }> => {
      if (isProcessing || queue.length === 0) {
        return { success: 0, failed: 0 };
      }

      setIsProcessing(true);
      let success = 0;
      let failed = 0;

      for (const request of queue) {
        try {
          const result = await executor(request);
          if (result) {
            removeFromQueue(request.id);
            success++;
          } else {
            failed++;
          }
        } catch (error) {
          console.error('Failed to process queued request:', error);
          failed++;
        }
      }

      setIsProcessing(false);
      return { success, failed };
    },
    [isProcessing, queue, removeFromQueue],
  );

  return {
    queue,
    queueLength: queue.length,
    isProcessing,
    addToQueue,
    removeFromQueue,
    clearQueue,
    processQueue,
  };
};

/**
 * Network status context provider value type
 */
export interface NetworkContextValue extends NetworkStatus {
  wasOffline: boolean;
  offlineQueue: {
    queue: QueuedRequest[];
    queueLength: number;
    addToQueue: (request: Omit<QueuedRequest, 'id' | 'timestamp'>) => string;
    processQueue: (
      executor: (request: QueuedRequest) => Promise<boolean>,
    ) => Promise<{ success: number; failed: number }>;
  };
}
