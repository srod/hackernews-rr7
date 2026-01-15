import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

function NotFound() {
    return <p style={{ textAlign: "center", padding: "2rem 0" }}>Not found</p>;
}

export function getRouter() {
    return createTanStackRouter({
        routeTree,
        defaultPreload: false, // Disabled - causes too many concurrent API requests
        scrollRestoration: true,
        defaultNotFoundComponent: NotFound,
    });
}

declare module "@tanstack/react-router" {
    interface Register {
        router: ReturnType<typeof getRouter>;
    }
}
