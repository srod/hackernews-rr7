import { Link } from "@tanstack/react-router";
import { formatDistance } from "date-fns";
import { useEffect, useState } from "react";
import { getNewCommentCount } from "~/lib/visited-posts";
import type { Post } from "~/types/Post";
import styles from "./Post.module.css";

export function PostItem({
    post,
    showText = false,
}: {
    post: Post;
    showText?: boolean;
}) {
    const [newComments, setNewComments] = useState(0);

    useEffect(() => {
        if (post.descendants > 0) {
            setNewComments(getNewCommentCount(post.id, post.descendants));
        }
    }, [post.id, post.descendants]);

    return (
        <div className={styles.post}>
            <h2>
                {!post.url && (
                    <Link to="/post/$id" params={{ id: String(post.id) }}>
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
                {post.score > 0 && <>{post.score} points • </>}
                {post.by && (
                    <>
                        <Link to="/user/$id" params={{ id: post.by }}>
                            {post.by}
                        </Link>{" "}
                        •{" "}
                    </>
                )}
                {formatDistance(new Date(post.time * 1000), new Date(), {
                    addSuffix: true,
                })}
                {post.descendants > 0 && (
                    <>
                        {" "}
                        •{" "}
                        <Link to="/post/$id" params={{ id: String(post.id) }}>
                            {post.descendants} comments
                            {newComments > 0 && (
                                <span className={styles.post__new}>
                                    {" "}
                                    ({newComments} new)
                                </span>
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
}
