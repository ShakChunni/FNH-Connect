import { useState, useCallback, useEffect, useRef } from "react";

interface PendingUpdate {
  taskId: number;
  qty: number;
  time: number;
  timestamp: number;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  debounceDelay: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  debounceDelay: 1500,
};

export const useTaskBatcher = (
  onUpdate: (updates: PendingUpdate[]) => Promise<void>,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
) => {
  const [pendingUpdates, setPendingUpdates] = useState<
    Map<number, PendingUpdate>
  >(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const processingRef = useRef<boolean>(false);
  const updatesQueueRef = useRef<Map<number, PendingUpdate>>(new Map());
  const pendingUpdatesRef = useRef<Map<number, PendingUpdate>>(new Map());

  useEffect(() => {
    pendingUpdatesRef.current = pendingUpdates;
  }, [pendingUpdates]);

  const scheduleNextBatch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      if (!processingRef.current && updatesQueueRef.current.size > 0) {
        const currentQueue = new Map(updatesQueueRef.current);
        updatesQueueRef.current.clear();
        setPendingUpdates(currentQueue);
      }
    }, retryConfig.debounceDelay);
  }, [retryConfig.debounceDelay]);

  const processBatch = useCallback(async () => {
    if (processingRef.current || pendingUpdatesRef.current.size === 0) return;

    processingRef.current = true;
    setIsSaving(true);

    try {
      const updates = Array.from(pendingUpdatesRef.current.values());
      await onUpdate(updates);
      setPendingUpdates(new Map());

      // Process any updates that came in during processing
      if (updatesQueueRef.current.size > 0) {
        scheduleNextBatch();
      }
    } finally {
      processingRef.current = false;
      setIsSaving(false);
    }
  }, [onUpdate, scheduleNextBatch]);

  useEffect(() => {
    if (pendingUpdates.size > 0 && !processingRef.current) {
      processBatch();
    }
  }, [pendingUpdates, processBatch]);

  const queueUpdate = useCallback(
    (taskId: number, qty: number, time: number) => {
      const update = {
        taskId,
        qty,
        time,
        timestamp: Date.now(),
      };

      // Add to queue instead of pending updates
      updatesQueueRef.current.set(taskId, update);
      scheduleNextBatch();
    },
    [scheduleNextBatch]
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const forceSave = useCallback(() => {
    if (updatesQueueRef.current.size > 0) {
      setPendingUpdates(new Map(updatesQueueRef.current));
      updatesQueueRef.current.clear();
    }
  }, []);

  return {
    queueUpdate,
    isSaving,
    hasPendingChanges:
      pendingUpdates.size > 0 || updatesQueueRef.current.size > 0,
    forceSave,
  };
};
