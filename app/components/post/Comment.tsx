import { Link } from "@tanstack/react-router";
import { formatDistance } from "date-fns";
import { useState } from "react";
import { CommentsList } from "~/components/post/Comments";
import { fetchComments } from "~/lib/fetch-comments";
import type { Comment } from "~/types/Comment";
import styles from "./Comment.module.css";

export function CommentItem({
    comment,
    op,
}: {
    comment: Comment;
    op?: string;
}) {
    const isOP = op && comment.by === op;
    const [loadedReplies, setLoadedReplies] = useState<Comment[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    const hasUnloadedReplies = comment?.kids && !comment?.comments;
    const hasReplies =
        comment?.comments?.length ||
        loadedReplies?.length ||
        hasUnloadedReplies;

    async function handleLoadMore() {
        if (!comment.kids || loading) return;
        setLoading(true);
        const replies = await fetchComments(comment.kids);
        setLoadedReplies(replies);
        setLoading(false);
    }

    // Handle deleted comments
    if (comment.deleted) {
        return (
            <div className={`${styles.comment} ${styles.comment__deleted}`}>
                <p className={styles.comment__meta}>[deleted]</p>
            </div>
        );
    }

    // Handle dead comments (flagged/killed)
    if (comment.dead) {
        return (
            <div className={`${styles.comment} ${styles.comment__dead}`}>
                <p className={styles.comment__meta}>[flagged]</p>
            </div>
        );
    }

    return (
        <div className={styles.comment}>
            <p className={styles.comment__meta}>
                <button
                    type="button"
                    className={styles.comment__toggle}
                    onClick={() => setCollapsed(!collapsed)}
                    aria-label={
                        collapsed ? "Expand comment" : "Collapse comment"
                    }
                >
                    [{collapsed ? "+" : "−"}]
                </button>{" "}
                <Link to="/user/$id" params={{ id: comment.by }}>
                    {comment.by}
                </Link>
                {isOP && <span className={styles.comment__op}>OP</span>} •{" "}
                {formatDistance(new Date(comment.time * 1000), new Date(), {
                    addSuffix: true,
                })}
                {collapsed && hasReplies && (
                    <span className={styles.comment__collapsedInfo}>
                        {" "}
                        ({comment.kids?.length ?? 0} replies)
                    </span>
                )}
            </p>
            {!collapsed && (
                <>
                    <div
                        // biome-ignore lint/security/noDangerouslySetInnerHtml: this is a safe value
                        dangerouslySetInnerHTML={{
                            __html: comment.text,
                        }}
                    />
                    {comment?.comments && (
                        <CommentsList comments={comment.comments} op={op} />
                    )}
                    {loadedReplies && (
                        <CommentsList comments={loadedReplies} op={op} />
                    )}
                    {hasUnloadedReplies && !loadedReplies && comment.kids && (
                        <button
                            type="button"
                            className={styles.comment__more}
                            onClick={handleLoadMore}
                            disabled={loading}
                        >
                            {loading
                                ? "Loading..."
                                : `${comment.kids.length} more ${comment.kids.length === 1 ? "reply" : "replies"}`}
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
