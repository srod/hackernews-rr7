import { createHash } from "node:crypto";
import { readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

function swManifestPlugin(): Plugin {
    return {
        name: "sw-manifest",
        apply: "build",
        async closeBundle() {
            const assetsDir = "dist/client/assets";
            try {
                const files = await readdir(assetsDir);
                const assets = files
                    .filter((f) => /\.(js|css)$/.test(f))
                    .map((f) => `/assets/${f}`);

                // Generate version hash from asset names
                const version = createHash("md5")
                    .update(assets.sort().join(","))
                    .digest("hex")
                    .slice(0, 8);

                const manifest = { version, assets };
                await writeFile(
                    join("dist/client", "sw-manifest.json"),
                    JSON.stringify(manifest)
                );
                await writeFile(
                    join("public", "sw-manifest.json"),
                    JSON.stringify(manifest)
                );
                console.log(`\n✓ SW manifest generated (v${version})`);
            } catch {
                console.warn("Could not generate SW manifest");
            }
        },
    };
}

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
        swManifestPlugin(),
    ],
});
