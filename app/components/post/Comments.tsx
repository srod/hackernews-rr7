import { CommentItem } from "~/components/post/Comment";
import type { Comment } from "~/types/Comment";
import styles from "./Comments.module.css";

export function CommentsList({ comments }: { comments: Comment[] }) {
    if (!Array.isArray(comments)) return null;

    return (
        <div className={styles.comments}>
            {comments.map((comment) => (
                <CommentItem key={`comment-${comment.id}`} comment={comment} />
            ))}
        </div>
    );
}
