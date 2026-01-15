import { createFileRoute, Outlet, useRouter } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { useOnlineStatus } from "~/hooks/useOnlineStatus";
import styles from "./_layout.module.css";

export const Route = createFileRoute("/_layout")({
    component: LayoutComponent,
    notFoundComponent: NotFound,
    errorComponent: ErrorComponent,
});

function NotFound() {
    return <p className={styles.notFound}>Page not found</p>;
}

function ErrorComponent() {
    const isOnline = useOnlineStatus();
    const router = useRouter();

    return (
        <div className={styles.error}>
            <p>{isOnline ? "Something went wrong" : "You're offline"}</p>
            {!isOnline && (
                <p className={styles.errorHint}>
                    This page isn't cached. Go back or try again when online.
                </p>
            )}
            <button type="button" onClick={() => router.history.back()}>
                Go back
            </button>
        </div>
    );
}

function LayoutComponent() {
    return (
        <>
            <Header />
            <main className={styles.main}>
                <Outlet />
            </main>
        </>
    );
}
