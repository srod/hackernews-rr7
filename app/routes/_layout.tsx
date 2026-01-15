import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import styles from "./_layout.module.css";

export const Route = createFileRoute("/_layout")({
    component: LayoutComponent,
});

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
