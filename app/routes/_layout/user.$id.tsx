import { createFileRoute } from "@tanstack/react-router";
import { LRUCache } from "lru-cache";
import { useCallback, useEffect, useRef, useState } from "react";
import { CommentItem } from "~/components/post/Comment";
import { PostItem } from "~/components/post/Post";
import {
    CommentListSkeleton,
    PostListSkeleton,
    UserSkeleton,
} from "~/components/Skeleton";
import { UserItem } from "~/components/user/User";
import styles from "~/components/user/User.module.css";
import { fetchData } from "~/lib/fetch-data";
import type { Comment } from "~/types/Comment";
import type { Post } from "~/types/Post";
import type { User } from "~/types/User";

const userCache = new LRUCache<string, User>({
    max: 1000,
    ttl: 1000 * 60 * 5,
});

type Tab = "about" | "submitted" | "comments";
type Item = Post | Comment;

const BATCH_SIZE = 20;
const MIN_RESULTS = 5;

export const Route = createFileRoute("/_layout/user/$id")({
    loader: async ({ params }) => {
        const id = params.id;
        const cacheKey = `user-${id}`;
        let user = userCache.get(cacheKey);

        if (!user) {
            user = await fetchData<User>(`user/${id}`);
            userCache.set(cacheKey, user);
        }

        return { user };
    },
    staleTime: 30_000,
    head: ({ loaderData }) => ({
        meta: [{ title: `Hacker News: ${loaderData?.user?.id}` }],
    }),
    component: UserComponent,
    pendingComponent: UserSkeleton,
});

function UserComponent() {
    const { user } = Route.useLoaderData();
    const [activeTab, setActiveTab] = useState<Tab>("about");

    // Submissions state
    const [submissions, setSubmissions] = useState<Post[]>([]);
    const submissionsIndexRef = useRef(0);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [submissionsDone, setSubmissionsDone] = useState(false);
    const submissionsLoaderRef = useRef<HTMLDivElement>(null);

    // Comments state
    const [comments, setComments] = useState<Comment[]>([]);
    const commentsIndexRef = useRef(0);
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentsDone, setCommentsDone] = useState(false);
    const commentsLoaderRef = useRef<HTMLDivElement>(null);

    // Loading refs to prevent race conditions
    const loadingSubmissionsRef = useRef(false);
    const loadingCommentsRef = useRef(false);

    const submitted = user?.submitted ?? [];

    const loadSubmissions = useCallback(async () => {
        if (loadingSubmissionsRef.current || submissionsDone) return;
        loadingSubmissionsRef.current = true;
        setLoadingSubmissions(true);

        let foundPosts: Post[] = [];

        while (foundPosts.length < MIN_RESULTS) {
            const startIndex = submissionsIndexRef.current;
            const ids = submitted.slice(startIndex, startIndex + BATCH_SIZE);

            if (ids.length === 0) {
                setSubmissionsDone(true);
                break;
            }

            const items = await Promise.all(
                ids.map((id) => fetchData<Item>(`item/${id}`).catch(() => null))
            );

            const posts = items.filter(
                (item): item is Post =>
                    item !== null && "title" in item && item.title !== undefined
            );

            foundPosts = [...foundPosts, ...posts];
            submissionsIndexRef.current = startIndex + BATCH_SIZE;

            if (submissionsIndexRef.current >= submitted.length) {
                setSubmissionsDone(true);
                break;
            }
        }

        setSubmissions((prev) => [...prev, ...foundPosts]);
        setLoadingSubmissions(false);
        loadingSubmissionsRef.current = false;
    }, [submitted, submissionsDone]);

    const loadComments = useCallback(async () => {
        if (loadingCommentsRef.current || commentsDone) return;
        loadingCommentsRef.current = true;
        setLoadingComments(true);

        let foundComments: Comment[] = [];

        while (foundComments.length < MIN_RESULTS) {
            const startIndex = commentsIndexRef.current;
            const ids = submitted.slice(startIndex, startIndex + BATCH_SIZE);

            if (ids.length === 0) {
                setCommentsDone(true);
                break;
            }

            const items = await Promise.all(
                ids.map((id) => fetchData<Item>(`item/${id}`).catch(() => null))
            );

            const userComments = items.filter(
                (item): item is Comment =>
                    item !== null && "type" in item && item.type === "comment"
            );

            foundComments = [...foundComments, ...userComments];
            commentsIndexRef.current = startIndex + BATCH_SIZE;

            if (commentsIndexRef.current >= submitted.length) {
                setCommentsDone(true);
                break;
            }
        }

        setComments((prev) => [...prev, ...foundComments]);
        setLoadingComments(false);
        loadingCommentsRef.current = false;
    }, [submitted, commentsDone]);

    function handleTabChange(tab: Tab) {
        setActiveTab(tab);
        if (
            tab === "submitted" &&
            submissions.length === 0 &&
            !submissionsDone
        ) {
            loadSubmissions();
        } else if (
            tab === "comments" &&
            comments.length === 0 &&
            !commentsDone
        ) {
            loadComments();
        }
    }

    // Infinite scroll for submissions
    useEffect(() => {
        const loader = submissionsLoaderRef.current;
        if (!loader || activeTab !== "submitted") return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0].isIntersecting &&
                    !loadingSubmissionsRef.current &&
                    !submissionsDone
                ) {
                    loadSubmissions();
                }
            },
            { rootMargin: "200px" }
        );

        observer.observe(loader);
        return () => observer.disconnect();
    }, [activeTab, submissionsDone, loadSubmissions]);

    // Infinite scroll for comments
    useEffect(() => {
        const loader = commentsLoaderRef.current;
        if (!loader || activeTab !== "comments") return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0].isIntersecting &&
                    !loadingCommentsRef.current &&
                    !commentsDone
                ) {
                    loadComments();
                }
            },
            { rootMargin: "200px" }
        );

        observer.observe(loader);
        return () => observer.disconnect();
    }, [activeTab, commentsDone, loadComments]);

    if (!user) {
        return <div>User not found</div>;
    }

    return (
        <div>
            <UserItem user={user} />

            <div className={styles.tabs}>
                <button
                    type="button"
                    className={activeTab === "about" ? styles.tabs__active : ""}
                    onClick={() => handleTabChange("about")}
                >
                    About
                </button>
                <button
                    type="button"
                    className={
                        activeTab === "submitted" ? styles.tabs__active : ""
                    }
                    onClick={() => handleTabChange("submitted")}
                >
                    Submitted
                </button>
                <button
                    type="button"
                    className={
                        activeTab === "comments" ? styles.tabs__active : ""
                    }
                    onClick={() => handleTabChange("comments")}
                >
                    Comments
                </button>
            </div>

            {activeTab === "about" && user.about && (
                <div
                    className={styles.about}
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted content
                    dangerouslySetInnerHTML={{ __html: user.about }}
                />
            )}

            {activeTab === "submitted" && (
                <div>
                    {submissions.map((post) => (
                        <PostItem key={post.id} post={post} />
                    ))}
                    <div ref={submissionsLoaderRef}>
                        {loadingSubmissions && <PostListSkeleton count={3} />}
                    </div>
                    {submissionsDone && submissions.length === 0 && (
                        <p className={styles.empty}>No submissions</p>
                    )}
                </div>
            )}

            {activeTab === "comments" && (
                <div className={styles.userComments}>
                    {comments.map((comment) => (
                        <CommentItem key={comment.id} comment={comment} />
                    ))}
                    <div ref={commentsLoaderRef}>
                        {loadingComments && <CommentListSkeleton count={3} />}
                    </div>
                    {commentsDone && comments.length === 0 && (
                        <p className={styles.empty}>No comments</p>
                    )}
                </div>
            )}
        </div>
    );
}
