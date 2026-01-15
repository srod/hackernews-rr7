import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    plugins: [
        tsConfigPaths(),
        cloudflare({ viteEnvironment: { name: "ssr" } }),
        tanstackStart({
            srcDirectory: "./app",
            router: {
                routesDirectory: "./routes",
                generatedRouteTree: "./routeTree.gen.ts",
                routeFileIgnorePattern: "components/",
            },
        }),
        viteReact(),
    ],
});
