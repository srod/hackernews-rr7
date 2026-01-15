import { Link } from "@tanstack/react-router";
import { formatDistance } from "date-fns";
import { memo, useEffect, useState } from "react";
import { getNewCommentCount, hasVisited } from "~/lib/visited-posts";
import type { Post } from "~/types/Post";
import styles from "./Post.module.css";

function getDomain(url: string): string | null {
    try {
        const hostname = new URL(url).hostname;
        return hostname.replace(/^www\./, "");
    } catch {
        return null;
    }
}

function useRelativeTime(timestamp: number): string {
    const [time, setTime] = useState(() =>
        formatDistance(new Date(timestamp * 1000), new Date(), {
            addSuffix: true,
        })
    );

    useEffect(() => {
        const update = () => {
            setTime(
                formatDistance(new Date(timestamp * 1000), new Date(), {
                    addSuffix: true,
                })
            );
        };

        // Update every minute
        const interval = setInterval(update, 60_000);
        return () => clearInterval(interval);
    }, [timestamp]);

    return time;
}

export const PostItem = memo(function PostItem({
    post,
    showText = false,
}: {
    post: Post;
    showText?: boolean;
}) {
    const [newComments, setNewComments] = useState(0);
    const [visited, setVisited] = useState(false);
    const relativeTime = useRelativeTime(post.time);
    const domain = post.url ? getDomain(post.url) : null;

    useEffect(() => {
        setVisited(hasVisited(post.id));
        if (post.descendants && post.descendants > 0) {
            setNewComments(getNewCommentCount(post.id, post.descendants));
        }
    }, [post.id, post.descendants]);

    const postClass = visited
        ? `${styles.post} ${styles.post__visited}`
        : styles.post;

    return (
        <div className={postClass}>
            <h2>
                {!post.url && (
                    <Link to="/post/$id" params={{ id: String(post.id) }}>
                        {post.title}
                    </Link>
                )}
                {post.url && (
                    <>
                        <a href={post.url} target="_blank" rel="noreferrer">
                            {post.title}
                        </a>
                        {domain && (
                            <span className={styles.post__domain}>
                                {" "}
                                ({domain})
                            </span>
                        )}
                    </>
                )}
            </h2>
            <p className={styles.post__info}>
                {post.score && post.score > 0 && <>{post.score} points • </>}
                {post.by && (
                    <>
                        <Link to="/user/$id" params={{ id: post.by }}>
                            {post.by}
                        </Link>{" "}
                        •{" "}
                    </>
                )}
                {relativeTime}
                {post.type !== "job" && (
                    <>
                        {" "}
                        •{" "}
                        <Link to="/post/$id" params={{ id: String(post.id) }}>
                            {post.descendants && post.descendants > 0 ? (
                                <>
                                    {post.descendants} comments
                                    {newComments > 0 && (
                                        <span className={styles.post__new}>
                                            {" "}
                                            ({newComments} new)
                                        </span>
                                    )}
                                </>
                            ) : (
                                "discuss"
                            )}
                        </Link>
                    </>
                )}
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
});
