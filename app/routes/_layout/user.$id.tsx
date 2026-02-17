import { createFileRoute } from "@tanstack/react-router";
import { LRUCache } from "lru-cache";
import { useCallback, useReducer, useRef } from "react";
import { CommentItem } from "~/components/post/Comment";
import { PostItem } from "~/components/post/Post";
import {
    CommentListSkeleton,
    PostListSkeleton,
    UserSkeleton,
} from "~/components/Skeleton";
import { UserItem } from "~/components/user/User";
import styles from "~/components/user/User.module.css";
import { useIntersectionObserver } from "~/hooks/useIntersectionObserver";
import { useOnlineStatus } from "~/hooks/useOnlineStatus";
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

type UserState = {
    activeTab: Tab;
    submissions: Post[];
    loadingSubmissions: boolean;
    submissionsDone: boolean;
    comments: Comment[];
    loadingComments: boolean;
    commentsDone: boolean;
};

type UserAction =
    | { type: "SET_TAB"; tab: Tab }
    | { type: "SUBMISSIONS_START" }
    | { type: "SUBMISSIONS_LOADED"; posts: Post[]; done: boolean }
    | { type: "COMMENTS_START" }
    | { type: "COMMENTS_LOADED"; comments: Comment[]; done: boolean };

function userReducer(state: UserState, action: UserAction): UserState {
    switch (action.type) {
        case "SET_TAB":
            return { ...state, activeTab: action.tab };
        case "SUBMISSIONS_START":
            return { ...state, loadingSubmissions: true };
        case "SUBMISSIONS_LOADED":
            return {
                ...state,
                submissions: [...state.submissions, ...action.posts],
                loadingSubmissions: false,
                submissionsDone: action.done,
            };
        case "COMMENTS_START":
            return { ...state, loadingComments: true };
        case "COMMENTS_LOADED":
            return {
                ...state,
                comments: [...state.comments, ...action.comments],
                loadingComments: false,
                commentsDone: action.done,
            };
    }
}

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
    const isOnline = useOnlineStatus();
    const [state, dispatch] = useReducer(userReducer, {
        activeTab: "about" as Tab,
        submissions: [],
        loadingSubmissions: false,
        submissionsDone: false,
        comments: [],
        loadingComments: false,
        commentsDone: false,
    });
    const {
        activeTab,
        submissions,
        loadingSubmissions,
        submissionsDone,
        comments,
        loadingComments,
        commentsDone,
    } = state;

    const submissionsIndexRef = useRef(0);
    const submissionsLoaderRef = useRef<HTMLDivElement>(null);

    const commentsIndexRef = useRef(0);
    const commentsLoaderRef = useRef<HTMLDivElement>(null);

    const loadingSubmissionsRef = useRef(false);
    const loadingCommentsRef = useRef(false);

    const submitted = user?.submitted ?? [];

    const loadSubmissions = useCallback(async () => {
        if (!isOnline || loadingSubmissionsRef.current || submissionsDone)
            return;
        loadingSubmissionsRef.current = true;
        dispatch({ type: "SUBMISSIONS_START" });

        let foundPosts: Post[] = [];
        let done = false;

        while (foundPosts.length < MIN_RESULTS) {
            const startIndex = submissionsIndexRef.current;
            const ids = submitted.slice(startIndex, startIndex + BATCH_SIZE);

            if (ids.length === 0) {
                done = true;
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
                done = true;
                break;
            }
        }

        dispatch({ type: "SUBMISSIONS_LOADED", posts: foundPosts, done });
        loadingSubmissionsRef.current = false;
    }, [isOnline, submitted, submissionsDone]);

    const loadComments = useCallback(async () => {
        if (!isOnline || loadingCommentsRef.current || commentsDone) return;
        loadingCommentsRef.current = true;
        dispatch({ type: "COMMENTS_START" });

        let foundComments: Comment[] = [];
        let done = false;

        while (foundComments.length < MIN_RESULTS) {
            const startIndex = commentsIndexRef.current;
            const ids = submitted.slice(startIndex, startIndex + BATCH_SIZE);

            if (ids.length === 0) {
                done = true;
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
                done = true;
                break;
            }
        }

        dispatch({
            type: "COMMENTS_LOADED",
            comments: foundComments,
            done,
        });
        loadingCommentsRef.current = false;
    }, [isOnline, submitted, commentsDone]);

    function handleTabChange(tab: Tab) {
        dispatch({ type: "SET_TAB", tab });
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

    useIntersectionObserver(submissionsLoaderRef, loadSubmissions, {
        enabled:
            activeTab === "submitted" &&
            !loadingSubmissionsRef.current &&
            !submissionsDone,
    });

    useIntersectionObserver(commentsLoaderRef, loadComments, {
        enabled:
            activeTab === "comments" &&
            !loadingCommentsRef.current &&
            !commentsDone,
    });

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
                    {isOnline && !submissionsDone && (
                        <div ref={submissionsLoaderRef}>
                            {loadingSubmissions && (
                                <PostListSkeleton count={3} />
                            )}
                        </div>
                    )}
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
                    {isOnline && !commentsDone && (
                        <div ref={commentsLoaderRef}>
                            {loadingComments && (
                                <CommentListSkeleton count={3} />
                            )}
                        </div>
                    )}
                    {commentsDone && comments.length === 0 && (
                        <p className={styles.empty}>No comments</p>
                    )}
                </div>
            )}
        </div>
    );
}
