import {
    createRootRoute,
    HeadContent,
    Outlet,
    Scripts,
    useRouterState,
} from "@tanstack/react-router";
import NProgress from "nprogress";
import nProgressStyles from "nprogress/nprogress.css?url";
import { useEffect } from "react";
import globalCssUrl from "~/styles/global.css?url";

export const Route = createRootRoute({
    component: RootComponent,
    errorComponent: RootErrorComponent,
    head: () => ({
        links: [
            { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
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
            { rel: "stylesheet", href: globalCssUrl },
            { rel: "stylesheet", href: nProgressStyles },
        ],
    }),
});

function RootComponent() {
    const isLoading = useRouterState({ select: (s) => s.status === "pending" });

    useEffect(() => {
        if (isLoading) {
            NProgress.start();
        } else {
            NProgress.done();
        }
    }, [isLoading]);

    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <HeadContent />
            </head>
            <body>
                <Outlet />
                <Scripts />
            </body>
        </html>
    );
}

function RootErrorComponent({ error }: { error: Error }) {
    const isDev = process.env.NODE_ENV === "development";

    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <HeadContent />
            </head>
            <body>
                <main className="pt-16 p-4 container mx-auto">
                    <h1>Error</h1>
                    <p>{error.message}</p>
                    {isDev && error.stack && (
                        <pre className="w-full p-4 overflow-x-auto">
                            <code>{error.stack}</code>
                        </pre>
                    )}
                </main>
                <Scripts />
            </body>
        </html>
    );
}
