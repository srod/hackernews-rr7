import { useOnlineStatus } from "~/hooks/useOnlineStatus";
import styles from "./OfflineBanner.module.css";

export function OfflineBanner() {
    const isOnline = useOnlineStatus();

    if (isOnline) return null;

    return (
        <div className={styles.banner}>Offline - showing cached content</div>
    );
}
