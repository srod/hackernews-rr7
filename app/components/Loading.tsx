import styles from "./Loading.module.css";
import { Spinner } from "./Spinner";

export function Loading() {
    return (
        <span className={styles.loading}>
            <Spinner />
        </span>
    );
}
