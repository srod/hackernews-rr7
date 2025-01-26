import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
    PersistQueryClientProvider,
    type PersistQueryClientProviderProps,
} from "@tanstack/react-query-persist-client";
import NProgress from "nprogress";
import nProgressStyles from "nprogress/nprogress.css?url";
import { type ReactNode, useEffect } from "react";
import {
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    isRouteErrorResponse,
    useNavigation,
} from "react-router";
import type { Route } from "./+types/root";
import globalCssUrl from "./styles/global.css?url";

export const links: Route.LinksFunction = () => [
    {
        rel: "icon",
        href: "/favicon.svg",
        type: "image/svg+xml",
    },
    {
        rel: "apple-touch-icon",
        href: "/favicon.svg",
        type: "image/svg+xml",
    },
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
    },
    {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap",
    },
    {
        rel: "stylesheet",
        href: globalCssUrl,
    },
    {
        rel: "stylesheet",
        href: nProgressStyles,
    },
];

const persistOptions: PersistQueryClientProviderProps["persistOptions"] = {
    persister: createSyncStoragePersister({
        storage:
            typeof window !== "undefined" ? window.localStorage : undefined,
    }),
    maxAge: Number.POSITIVE_INFINITY,
};

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            gcTime: Number.POSITIVE_INFINITY,
            staleTime: 1000 * 60 * 5, // 5 minutes
        },
    },
});

export function Layout({ children }: { children: ReactNode }) {
    const { state } = useNavigation();

    useEffect(() => {
        if (state !== "idle") {
            NProgress.start();
        } else {
            NProgress.done();
        }
    }, [state]);

    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <Meta />
                <Links />
            </head>
            <body>
                {children}
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}

export default function App() {
    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={persistOptions}
        >
            <Outlet />
            <ReactQueryDevtools initialIsOpen={false} />
        </PersistQueryClientProvider>
    );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
    let message = "Oops!";
    let details = "An unexpected error occurred.";
    let stack: string | undefined;

    if (isRouteErrorResponse(error)) {
        message = error.status === 404 ? "404" : "Error";
        details =
            error.status === 404
                ? "The requested page could not be found."
                : error.statusText || details;
    } else if (import.meta.env.DEV && error && error instanceof Error) {
        details = error.message;
        stack = error.stack;
    }

    return (
        <main className="pt-16 p-4 container mx-auto">
            <h1>{message}</h1>
            <p>{details}</p>
            {stack && (
                <pre className="w-full p-4 overflow-x-auto">
                    <code>{stack}</code>
                </pre>
            )}
        </main>
    );
}
