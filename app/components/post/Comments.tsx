import { useRef } from "react";
import { CommentItem } from "~/components/post/Comment";
import { CommentListSkeleton } from "~/components/Skeleton";
import { useIntersectionObserver } from "~/hooks/useIntersectionObserver";
import type { Comment } from "~/types/Comment";
import styles from "./Comments.module.css";

interface CommentsListProps {
    comments: Comment[];
    hasMore?: boolean;
    loadingMore?: boolean;
    onLoadMore?: () => void;
    op?: string;
}

export function CommentsList({
    comments,
    hasMore,
    loadingMore,
    onLoadMore,
    op,
}: CommentsListProps) {
    const loaderRef = useRef<HTMLDivElement>(null);

    useIntersectionObserver(loaderRef, onLoadMore ?? (() => {}), {
        enabled: !!onLoadMore && !loadingMore,
    });

    if (!Array.isArray(comments)) return null;

    return (
        <div className={styles.comments}>
            {comments.map((comment) => (
                <CommentItem
                    key={`comment-${comment.id}`}
                    comment={comment}
                    op={op}
                />
            ))}
            {hasMore && (
                <div ref={loaderRef}>
                    {loadingMore && <CommentListSkeleton count={2} />}
                </div>
            )}
        </div>
    );
}
