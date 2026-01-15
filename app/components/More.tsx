import { Link } from "@tanstack/react-router";
import styles from "./More.module.css";

export function More({ type, nextPage }: { type: string; nextPage: number }) {
    return (
        <Link
            to="/$type"
            params={{ type }}
            search={{ page: nextPage }}
            className={styles.more}
        >
            More
        </Link>
    );
}
