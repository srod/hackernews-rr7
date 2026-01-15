import { useCallback, useEffect, useState } from "react";

type SWState = "idle" | "updating" | "ready";

export function useServiceWorker() {
    const [state, setState] = useState<SWState>("idle");
    const [registration, setRegistration] =
        useState<ServiceWorkerRegistration | null>(null);

    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;

        navigator.serviceWorker
            .register("/sw.js")
            .then((reg) => {
                setRegistration(reg);

                // Check for updates periodically (every 60s)
                const interval = setInterval(() => reg.update(), 60_000);

                reg.addEventListener("updatefound", () => {
                    const newWorker = reg.installing;
                    if (!newWorker) return;

                    setState("updating");

                    newWorker.addEventListener("statechange", () => {
                        if (
                            newWorker.state === "installed" &&
                            navigator.serviceWorker.controller
                        ) {
                            // New version ready
                            setState("ready");
                        }
                    });
                });

                return () => clearInterval(interval);
            })
            .catch(console.error);

        // Handle controller change (after skipWaiting)
        navigator.serviceWorker.addEventListener("controllerchange", () => {
            window.location.reload();
        });
    }, []);

    const update = useCallback(() => {
        if (registration?.waiting) {
            registration.waiting.postMessage("skipWaiting");
        }
    }, [registration]);

    return { state, update };
}
