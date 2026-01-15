import { CommentItem } from "~/components/post/Comment";
import type { Comment } from "~/types/Comment";
import styles from "./Comments.module.css";

interface CommentsListProps {
    comments: Comment[];
    hasMore?: boolean;
    postId?: string;
}

export function CommentsList({ comments, hasMore, postId }: CommentsListProps) {
    if (!Array.isArray(comments)) return null;

    return (
        <div className={styles.comments}>
            {comments.map((comment) => (
                <CommentItem key={`comment-${comment.id}`} comment={comment} />
            ))}
            {hasMore && postId && (
                <p className={styles.loadMore}>
                    More comments available on{" "}
                    <a
                        href={`https://news.ycombinator.com/item?id=${postId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Hacker News
                    </a>
                </p>
            )}
        </div>
    );
}
