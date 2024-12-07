import { formatDistance } from "date-fns";
import { Link } from "react-router";
import type { Post } from "~/types/Post";
import styles from "./Post.module.css";

export function PostItem({
	post,
	showText = false,
}: { post: Post; showText?: boolean }) {
	return (
		<div className={styles.post}>
			<h2>
				{!post.url && (
					<Link to={`/post/${post.id}`} viewTransition>
						{post.title}
					</Link>
				)}
				{post.url && (
					<a href={post.url} target="_blank" rel="noreferrer">
						{post.title}
					</a>
				)}
			</h2>
			<p className={styles.post__info}>
				{post.score} points •{" "}
				<Link to={`/user/${post.by}`} viewTransition>
					{post.by}
				</Link>{" "}
				•{" "}
				{formatDistance(new Date(post.time * 1000), new Date(), {
					addSuffix: true,
				})}{" "}
				•{" "}
				<Link to={`/post/${post.id}`} viewTransition>
					{post.descendants} comments
				</Link>
			</p>
			{showText && post.text && (
				<p
					className={styles.post__text}
					// biome-ignore lint/security/noDangerouslySetInnerHtml: this is a safe value
					dangerouslySetInnerHTML={{ __html: post.text }}
				/>
			)}
		</div>
	);
}
