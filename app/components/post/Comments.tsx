import { useEffect, useRef } from "react";
import { CommentItem } from "~/components/post/Comment";
import { CommentListSkeleton } from "~/components/Skeleton";
import type { Comment } from "~/types/Comment";
import styles from "./Comments.module.css";

interface CommentsListProps {
    comments: Comment[];
    hasMore?: boolean;
    loadingMore?: boolean;
    onLoadMore?: () => void;
}

export function CommentsList({
    comments,
    hasMore,
    loadingMore,
    onLoadMore,
}: CommentsListProps) {
    const loaderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loader = loaderRef.current;
        if (!loader || !onLoadMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loadingMore) {
                    onLoadMore();
                }
            },
            { rootMargin: "200px" }
        );

        observer.observe(loader);
        return () => observer.disconnect();
    }, [onLoadMore, loadingMore]);

    if (!Array.isArray(comments)) return null;

    return (
        <div className={styles.comments}>
            {comments.map((comment) => (
                <CommentItem key={`comment-${comment.id}`} comment={comment} />
            ))}
            {hasMore && (
                <div ref={loaderRef}>
                    {loadingMore && <CommentListSkeleton count={2} />}
                </div>
            )}
        </div>
    );
}
