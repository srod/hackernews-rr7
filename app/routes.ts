import {
    type RouteConfig,
    index,
    layout,
    route,
} from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    layout("routes/layout.tsx", [
        route(":type", "routes/type.tsx"),
        route("user/:id", "routes/user/user.tsx"),
    ]),
    layout("routes/post/layout.tsx", [
        route("post/:id", "routes/post/post.tsx"),
    ]),
] satisfies RouteConfig;
