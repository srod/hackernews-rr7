import { Link } from "@tanstack/react-router";
import { formatDistance } from "date-fns";
import { useState } from "react";
import { CommentsList } from "~/components/post/Comments";
import { fetchComments } from "~/lib/fetch-comments";
import type { Comment } from "~/types/Comment";
import styles from "./Comment.module.css";

export function CommentItem({ comment }: { comment: Comment }) {
    const [loadedReplies, setLoadedReplies] = useState<Comment[] | null>(null);
    const [loading, setLoading] = useState(false);

    const hasUnloadedReplies = comment?.kids && !comment?.comments;

    async function handleLoadMore() {
        if (!comment.kids || loading) return;
        setLoading(true);
        const replies = await fetchComments(comment.kids);
        setLoadedReplies(replies);
        setLoading(false);
    }

    return (
        <div className={styles.comment}>
            <p>
                <Link to="/user/$id" params={{ id: comment.by }}>
                    {comment.by}
                </Link>{" "}
                •{" "}
                {formatDistance(new Date(comment.time * 1000), new Date(), {
                    addSuffix: true,
                })}
            </p>
            <div
                // biome-ignore lint/security/noDangerouslySetInnerHtml: this is a safe value
                dangerouslySetInnerHTML={{
                    __html: comment.text,
                }}
            />
            {comment?.comments && <CommentsList comments={comment.comments} />}
            {loadedReplies && <CommentsList comments={loadedReplies} />}
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
        </div>
    );
}
