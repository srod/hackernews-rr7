import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
    beforeLoad: () => {
        throw redirect({
            to: "/$type",
            params: { type: "top" },
            search: { page: 1 },
        });
    },
});
