import { useQuery } from "@tanstack/react-query";
import { Loading } from "~/components/Loading";
import { fetchComments } from "~/lib/fetch-comments";
import { CommentItem } from "~/routes/post/components/Comment";
import type { Comment } from "~/types/Comment";
import styles from "./Comments.module.css";

export function Comments({ id, kids }: { id?: string; kids?: string[] }) {
    const { data: comments, isLoading } = useQuery({
        queryKey: ["comments", id],
        queryFn: async () => {
            if (!kids?.length) return [];
            if (kids.length > 0) {
                const comments = await fetchComments(kids);
                if (!comments) return [];
                return comments;
            }
        },
        enabled: !!kids,
    });

    if (isLoading) return <Loading />;

    return (
        <div className={styles.comments}>
            {comments && <CommentsList comments={comments} />}
        </div>
    );
}

export function CommentsList({ comments }: { comments: Comment[] }) {
    if (!Array.isArray(comments)) {
        return null;
    }

    return comments.map((comment: Comment) => {
        return (
            <CommentItem
                comment={comment}
                key={`comment-${comment.id}-${comment.by}}`}
            />
        );
    });
}
