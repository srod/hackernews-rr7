import { formatDistance } from "date-fns";
import { Link } from "react-router";
import { CommentsList } from "~/routes/post/components/Comments";
import type { Comment } from "~/types/Comment";
import styles from "./Comment.module.css";

export function CommentItem({ comment }: { comment: Comment }) {
	return (
		<div className={styles.comment}>
			<p>
				<Link to={`/user/${comment.by}`} viewTransition>
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
		</div>
	);
}
