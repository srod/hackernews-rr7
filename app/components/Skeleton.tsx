import styles from "./Skeleton.module.css";

export function PostSkeleton() {
    return (
        <div className={styles.post}>
            <div className={`${styles.skeleton} ${styles.skeleton__title}`} />
            <div className={`${styles.skeleton} ${styles.skeleton__meta}`} />
        </div>
    );
}

export function PostListSkeleton({ count = 10 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
                <PostSkeleton key={i} />
            ))}
        </>
    );
}

export function CommentSkeleton() {
    return (
        <div className={styles.comment}>
            <div className={`${styles.skeleton} ${styles.skeleton__meta}`} />
            <div className={`${styles.skeleton} ${styles.comment__body}`} />
        </div>
    );
}

export function CommentListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
                <CommentSkeleton key={i} />
            ))}
        </>
    );
}

export function UserSkeleton() {
    return (
        <div className={styles.user}>
            <div className={`${styles.skeleton} ${styles.skeleton__title}`} />
            <div className={`${styles.skeleton} ${styles.skeleton__meta}`} />
            <div
                className={`${styles.skeleton} ${styles.user__about}`}
                style={{ marginTop: "1em" }}
            />
        </div>
    );
}
