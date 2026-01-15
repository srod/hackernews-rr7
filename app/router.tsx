import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
    return createTanStackRouter({
        routeTree,
        defaultPreload: false, // Disabled - causes too many concurrent API requests
        scrollRestoration: true,
    });
}

declare module "@tanstack/react-router" {
    interface Register {
        router: ReturnType<typeof getRouter>;
    }
}
