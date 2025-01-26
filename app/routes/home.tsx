import { redirect } from "react-router";
import type { Route } from "./+types/home";

export function loader({ request }: Route.LoaderArgs) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
        return redirect("/top");
    }

    return null;
}

export default function Home() {
    return null;
}
