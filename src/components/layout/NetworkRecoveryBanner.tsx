import React, { useState, useEffect, useRef } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { enquiryService } from "../../services/enquiry.service.js";

/**
 * NetworkRecoveryBanner
 * 
 * Sits at the top of the authenticated application layout.
 * Detects transient network disconnections and backend/database outages:
 * 1. Displays a clear "Connection lost. Reconnecting..." indicator without logging the user out.
 * 2. Employs bounded exponential backoff to probe healthcheck without flooding the server.
 * 3. On confirmed reconnection, displays "Connection restored." and dispatches 'nueways:reconnected'
 *    so dashboards can refresh live data automatically.
 */
export const NetworkRecoveryBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  });
  const [isBackendAvailable, setIsBackendAvailable] = useState<boolean>(true);
  const [showRestored, setShowRestored] = useState<boolean>(false);
  const [isProbing, setIsProbing] = useState<boolean>(false);

  const restoredTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const probeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const probeBackoffRef = useRef<number>(3000);

  // Trigger data refresh across active views
  const notifyReconnected = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("nueways:reconnected"));
    }
  };

  const handleConnectionRestored = () => {
    setIsBackendAvailable(true);
    setIsOnline(true);
    setShowRestored(true);
    probeBackoffRef.current = 3000;

    if (restoredTimerRef.current) {
      clearTimeout(restoredTimerRef.current);
    }
    restoredTimerRef.current = setTimeout(() => {
      setShowRestored(false);
    }, 3500);

    notifyReconnected();
  };

  // Safe health check probe with bounded backoff
  const probeHealth = async () => {
    if (isProbing) return;
    setIsProbing(true);
    try {
      const isHealthy = await enquiryService.checkBackendHealth();
      if (isHealthy) {
        handleConnectionRestored();
      } else {
        setIsBackendAvailable(false);
        scheduleNextProbe();
      }
    } catch {
      setIsBackendAvailable(false);
      scheduleNextProbe();
    } finally {
      setIsProbing(false);
    }
  };

  const scheduleNextProbe = () => {
    if (probeTimerRef.current) {
      clearTimeout(probeTimerRef.current);
    }
    const delay = probeBackoffRef.current;
    // Bounded backoff up to 20 seconds maximum
    probeBackoffRef.current = Math.min(20000, Math.floor(probeBackoffRef.current * 1.5));
    probeTimerRef.current = setTimeout(() => {
      probeHealth();
    }, delay);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleWindowOnline = () => {
      setIsOnline(true);
      probeBackoffRef.current = 2000;
      probeHealth();
    };

    const handleWindowOffline = () => {
      setIsOnline(false);
      setIsBackendAvailable(false);
      scheduleNextProbe();
    };

    const handleApiOffline = (e: Event) => {
      const customEvt = e as CustomEvent;
      // Do not flag offline for intentional client errors or 401/403
      if (
        customEvt.detail?.statusCode === 0 ||
        customEvt.detail?.statusCode === 503 ||
        customEvt.detail?.statusCode === 502
      ) {
        setIsBackendAvailable(false);
        scheduleNextProbe();
      }
    };

    const handleApiOnline = () => {
      if (!isBackendAvailable || !isOnline) {
        handleConnectionRestored();
      }
    };

    window.addEventListener("online", handleWindowOnline);
    window.addEventListener("offline", handleWindowOffline);
    window.addEventListener("nueways:network-offline", handleApiOffline);
    window.addEventListener("nueways:network-online", handleApiOnline);

    return () => {
      window.removeEventListener("online", handleWindowOnline);
      window.removeEventListener("offline", handleWindowOffline);
      window.removeEventListener("nueways:network-offline", handleApiOffline);
      window.removeEventListener("nueways:network-online", handleApiOnline);
      if (restoredTimerRef.current) clearTimeout(restoredTimerRef.current);
      if (probeTimerRef.current) clearTimeout(probeTimerRef.current);
    };
  }, [isBackendAvailable, isOnline]);

  const isDisconnected = !isOnline || !isBackendAvailable;

  if (isDisconnected) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="w-full bg-amber-600 text-white text-xs font-medium py-2 px-4 shadow-sm flex items-center justify-between transition-all duration-300 z-50 shrink-0"
      >
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <WifiOff className="h-4 w-4 shrink-0 animate-pulse text-amber-200" />
          <span>Connection lost. Reconnecting to Nueways CRM...</span>
          <button
            type="button"
            onClick={() => probeHealth()}
            disabled={isProbing}
            className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-700/60 hover:bg-amber-700 text-amber-100 text-2xs cursor-pointer transition-colors"
          >
            <RefreshCw className={`h-3 w-3 ${isProbing ? "animate-spin" : ""}`} />
            <span>{isProbing ? "Checking..." : "Retry Now"}</span>
          </button>
        </div>
      </div>
    );
  }

  if (showRestored) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="w-full bg-emerald-600 text-white text-xs font-medium py-2 px-4 shadow-sm flex items-center justify-between transition-all duration-300 z-50 shrink-0 animate-in fade-in slide-in-from-top-1"
      >
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <Wifi className="h-4 w-4 shrink-0 text-emerald-200" />
          <span>Connection restored. CRM live data updated.</span>
        </div>
      </div>
    );
  }

  return null;
};
