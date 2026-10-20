import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";
const root = process.cwd(),
  base = resolve(".verify/compat");
await mkdir(base, { recursive: true });
async function run(command: string, args: string[], cwd: string, name: string) {
  const log: string[] = [];
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, CI: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (data) => log.push(String(data)));
  child.stderr.on("data", (data) => log.push(String(data)));
  const code = await new Promise<number | null>((done) => child.on("close", done));
  await writeFile(resolve(base, `${name}.log`), log.join(""));
  assert.equal(code, 0, `${name}: ${log.join("").slice(-6000)}`);
}
await run("pnpm", ["pack", "--pack-destination", base], resolve("packages/core"), "pack");
const server = createServer(async (req, res) => {
  try {
    if (req.url === "/core.tgz") {
      res.setHeader("Content-Type", "application/octet-stream");
      res.end(await readFile(resolve(base, "aing-core-0.1.0.tgz")));
      return;
    }
    const name = req.url?.slice(1).replace(".json", "");
    if (
      ![
        "button",
        "dialog",
        "select",
        "button-tailwind",
        "dialog-tailwind",
        "select-tailwind",
      ].includes(name ?? "")
    ) {
      res.writeHead(404).end();
      return;
    }
    const item = JSON.parse(await readFile(resolve(root, `public/r/${name}.json`), "utf8"));
    item.dependencies = [`http://127.0.0.1:${port}/core.tgz`];
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(item));
  } catch (error) {
    res.writeHead(500).end(String(error));
  }
});
await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
const port = (server.address() as { port: number }).port;
const pkg = JSON.parse(await readFile("package.json", "utf8"));
const browser = await chromium.launch();
const results: unknown[] = [];
try {
  for (const name of ["vite", "next", "router", "tailwind-only"]) {
    const cwd = resolve(base, name);
    await mkdir(resolve(cwd, "app"), { recursive: true });
    await writeFile(resolve(cwd, "pnpm-workspace.yaml"), "packages: []\n");
    const deps = {
      react: "19.3.1",
      "react-dom": "19.3.1",
      ...(name === "next" ? { next: pkg.dependencies.next } : {}),
      ...(name === "router"
        ? { "react-router": pkg.devDependencies["react-router"].replace("^", "") }
        : {}),
    };
    const dev = {
      typescript: pkg.devDependencies.typescript,
      "@types/react": pkg.devDependencies["@types/react"],
      "@types/react-dom": pkg.devDependencies["@types/react-dom"],
      "@types/node": pkg.devDependencies["@types/node"],
      ...(name === "next"
        ? {
            "babel-plugin-react-compiler": pkg.devDependencies[
              "babel-plugin-react-compiler"
            ].replace("^", ""),
          }
        : { vite: pkg.devDependencies.vite.replace("^", "") }),
      tailwindcss: pkg.devDependencies.tailwindcss,
      "@tailwindcss/postcss": pkg.devDependencies["@tailwindcss/postcss"],
    };
    await writeFile(
      resolve(cwd, "package.json"),
      JSON.stringify(
        {
          name: `aing-m1-${name}`,
          private: true,
          type: "module",
          dependencies: deps,
          devDependencies: dev,
          scripts: { build: name === "next" ? "next build" : "vite build" },
        },
        null,
        2,
      ),
    );
    await writeFile(
      resolve(cwd, "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            lib: ["DOM", "DOM.Iterable", "ES2023"],
            strict: true,
            skipLibCheck: true,
            module: "ESNext",
            moduleResolution: "Bundler",
            jsx: "react-jsx",
            esModuleInterop: true,
            noEmit: true,
            paths: { "@/*": [name === "vite" ? "./src/*" : "./*"] },
          },
          include: ["**/*.ts", "**/*.tsx"],
          exclude: ["node_modules"],
        },
        null,
        2,
      ),
    );
    await writeFile(
      resolve(cwd, "components.json"),
      JSON.stringify(
        {
          $schema: "https://ui.shadcn.com/schema.json",
          style: "new-york",
          rsc: name === "next",
          tsx: true,
          tailwind: {
            config: "",
            css: "app/globals.css",
            baseColor: "zinc",
            cssVariables: true,
            prefix: "",
          },
          aliases: {
            components: "@/components",
            ui: "@/components/ui",
            utils: "@/lib/utils",
            lib: "@/lib",
            hooks: "@/hooks",
          },
        },
        null,
        2,
      ),
    );
    await writeFile(
      resolve(cwd, "app/globals.css"),
      (name === "tailwind-only" ? '@import \"tailwindcss\";\n' : "") + "body { margin: 32px; }\n",
    );
    if (name === "tailwind-only")
      await writeFile(
        resolve(cwd, "postcss.config.mjs"),
        'export default {plugins:{\"@tailwindcss/postcss\":{}}};',
      );
    await run("pnpm", ["install", "--no-frozen-lockfile"], cwd, `${name}-install`);
    const cli = resolve(root, "node_modules/.bin/shadcn");
    await run(
      cli,
      [
        "add",
        ...["button", "dialog", "select"].map(
          (item) =>
            `http://127.0.0.1:${port}/${item}${name === "tailwind-only" ? "-tailwind" : ""}.json`,
        ),
        "--yes",
        "--overwrite",
      ],
      cwd,
      `${name}-shadcn`,
    );
    const fixture = `'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog,DialogTrigger,DialogContent,DialogTitle,DialogDescription,DialogClose } from '@/components/ui/dialog';
import { Select,SelectItem } from '@/components/ui/select';
export default function Fixture(){const [n,setN]=useState(0);return <><Button className="text-base" onClick={()=>setN(n+1)}>Save {n}</Button><form><Select aria-label="Region" name="region" defaultValue="one"><SelectItem value="one">One</SelectItem><SelectItem value="two">Two</SelectItem></Select><button type="reset">Reset</button></form><Dialog><DialogTrigger>Open</DialogTrigger><DialogContent><DialogTitle>Settings</DialogTitle><DialogDescription>Local settings</DialogDescription><DialogClose>Close</DialogClose></DialogContent></Dialog></>}`;
    await writeFile(resolve(cwd, "app/fixture.tsx"), fixture);
    if (name === "next") {
      await writeFile(
        resolve(cwd, "next.config.mjs"),
        'export default {reactCompiler:true,distDir:".next",turbopack:{root:process.cwd()}};\n',
      );
      await writeFile(
        resolve(cwd, "app/layout.tsx"),
        `import './globals.css'; export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}`,
      );
      await writeFile(
        resolve(cwd, "app/page.tsx"),
        `import {Button} from '@/components/ui/button'; import Fixture from './fixture'; export default function Page(){return <main><h1>Compatibility</h1><Button webmcp={false}>Server button</Button><Button>Server tool button</Button><Button webmcp={false} disabled render={<a href="/blocked">Disabled link</a>}/><Fixture/></main>}`,
      );
    } else {
      await writeFile(
        resolve(cwd, "vite.config.ts"),
        `import {defineConfig} from 'vite'; import {fileURLToPath} from 'node:url'; export default defineConfig({resolve:{alias:{'@':fileURLToPath(new URL('${name === "vite" ? "./src/" : "."}',import.meta.url))}}});`,
      );
      await writeFile(
        resolve(cwd, "index.html"),
        '<html lang="en"><head><title>Compatibility</title></head><body><div id="root"></div><script type="module" src="/app/main.tsx"></script></body></html>',
      );
      const routerImport =
        name === "router" ? `import {BrowserRouter,Routes,Route} from 'react-router';` : "";
      const element =
        name === "router"
          ? '<BrowserRouter><Routes><Route path="*" element={<Fixture/>}/></Routes></BrowserRouter>'
          : "<Fixture/>";
      await writeFile(
        resolve(cwd, "app/main.tsx"),
        `import {StrictMode} from 'react';import{createRoot}from'react-dom/client';import Fixture from './fixture';import './globals.css';${routerImport}createRoot(document.getElementById('root')!).render(<StrictMode>${element}</StrictMode>);`,
      );
    }
    await run("pnpm", ["build"], cwd, `${name}-build`);
    await run("pnpm", ["exec", "tsc", "--noEmit"], cwd, `${name}-tsc`);
    const appPort =
      name === "next" ? 4332 : name === "vite" ? 4331 : name === "tailwind-only" ? 4335 : 4333;
    const app = spawn(
      "pnpm",
      name === "next"
        ? ["exec", "next", "start", "--port", String(appPort)]
        : [
            "exec",
            "vite",
            "preview",
            "--host",
            "127.0.0.1",
            "--port",
            String(appPort),
            "--strictPort",
          ],
      { cwd, stdio: "ignore" },
    );
    try {
      for (let attempt = 0; attempt < 60; attempt++) {
        try {
          const response = await fetch(`http://127.0.0.1:${appPort}`);
          if (response.ok) break;
        } catch {}
        await new Promise((done) => setTimeout(done, 250));
      }
      const page = await browser.newPage();
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await page.goto(`http://127.0.0.1:${appPort}`);
      if (name === "tailwind-only") {
        const vars = await page.evaluate(() => {
          const s = getComputedStyle(document.documentElement);
          return ["--aing-chevron", "--aing-spring"].map((key) =>
            s.getPropertyValue(key),
          );
        });
        assert.ok(
          vars.every((value) => value.trim()),
          "fresh Tailwind-only install includes platform tokens",
        );
        assert.equal(
          await page
            .getByRole("combobox")
            .evaluate((el) =>
              getComputedStyle(el, "::picker-icon").maskImage.includes("data:image/svg+xml"),
            ),
          true,
        );
      }
      await page.waitForFunction(() => window.__aingToolDefinitions?.size);
      assert.equal(await page.locator("dialog").isVisible(), false);
      assert.equal(
        await page
          .getByRole("button", { name: "Save 0" })
          .evaluate((el) => getComputedStyle(el).height),
        "36px",
      );
      assert.equal(
        await page
          .getByRole("button", { name: "Save 0" })
          .evaluate((el) => getComputedStyle(el, "::before").minHeight),
        "44px",
      );
      await page.emulateMedia({ reducedMotion: "reduce" });
      assert.ok(
        await page.getByRole("button", { name: "Save 0" }).evaluate((el) => {
          const style = getComputedStyle(el);
          return style.transitionProperty === "none" || style.transitionDuration === "0s";
        }),
      );
      await page.getByRole("button", { name: "Save 0" }).click();
      await page.getByRole("button", { name: "Save 1" }).waitFor();
      await page.getByRole("button", { name: "Open", exact: true }).click();
      await page.getByRole("dialog", { name: "Settings" }).waitFor();
      assert.equal(
        await page
          .getByRole("dialog", { name: "Settings" })
          .evaluate((el) => el.getAnimations().length),
        0,
      );
      await page.keyboard.press("Escape");
      await page.getByRole("combobox").selectOption("two");
      assert.equal(await page.getByRole("combobox").inputValue(), "two");
      await page.getByRole("button", { name: "Reset", exact: true }).click();
      assert.equal(await page.getByRole("combobox").inputValue(), "one");
      assert.deepEqual(errors, []);
      results.push({
        name,
        react: "19.3.1",
        compiler: name === "next",
        build: true,
        tsc: true,
        consoleErrors: errors,
      });
      await page.close();
    } finally {
      app.kill("SIGTERM");
    }
    if (name === "vite") {
      await writeFile(
        resolve(cwd, "app/globals.css"),
        '@import "tailwindcss";\nbody {margin:32px;}\n',
      );
      await writeFile(
        resolve(cwd, "postcss.config.mjs"),
        'export default {plugins:{"@tailwindcss/postcss":{}}};',
      );
      await run(
        cli,
        [
          "add",
          ...["button", "dialog", "select"].map(
            (item) => `http://127.0.0.1:${port}/${item}-tailwind.json`,
          ),
          "--yes",
          "--overwrite",
        ],
        cwd,
        "vite-shadcn-tailwind",
      );
      await run("pnpm", ["build"], cwd, "vite-tailwind-build");
      await run("pnpm", ["exec", "tsc", "--noEmit"], cwd, "vite-tailwind-tsc");
      await run("pnpm", ["add", "react@19.0.0", "react-dom@19.0.0"], cwd, "vite-react19-install");
      await run(
        "pnpm",
        ["exec", "vite", "build", "--outDir", "dist-react19"],
        cwd,
        "vite-react19-build",
      );
      await run("pnpm", ["exec", "tsc", "--noEmit"], cwd, "vite-react19-tsc");
      const legacy = spawn(
        "pnpm",
        [
          "exec",
          "vite",
          "preview",
          "--host",
          "127.0.0.1",
          "--port",
          "4334",
          "--strictPort",
          "--outDir",
          "dist-react19",
        ],
        { cwd, stdio: "ignore" },
      );
      try {
        for (let i = 0; i < 60; i++) {
          try {
            if ((await fetch("http://127.0.0.1:4334")).ok) break;
          } catch {}
          await new Promise((done) => setTimeout(done, 250));
        }
        const page = await browser.newPage(),
          errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("console", (message) => {
          if (message.type() === "error") errors.push(message.text());
        });
        await page.goto("http://127.0.0.1:4334");
        assert.equal(await page.locator("dialog").isVisible(), false);
        assert.equal(
          await page
            .getByRole("button", { name: "Save 0" })
            .evaluate((el) => getComputedStyle(el).fontSize),
          "16px",
        );
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.getByRole("button", { name: "Save 0" }).click();
        await page.getByRole("button", { name: "Save 1" }).waitFor();
        await page.keyboard.press("Tab");
        await page.getByRole("button", { name: "Save 1" }).focus();
        const focus = await page.getByRole("button", { name: "Save 1" }).evaluate((el) => ({
          outline: getComputedStyle(el).outlineStyle,
          width: getComputedStyle(el).outlineWidth,
          shadow: getComputedStyle(el).boxShadow,
        }));
        assert.equal(focus.outline, "solid");
        assert.equal(focus.width, "3px");
        assert.equal(focus.shadow, "none");
        await page.getByRole("combobox").selectOption("two");
        assert.equal(await page.getByRole("combobox").inputValue(), "two");
        await page.getByRole("button", { name: "Reset", exact: true }).click();
        assert.equal(await page.getByRole("combobox").inputValue(), "one");
        await page.getByRole("button", { name: "Open", exact: true }).click();
        await page.getByRole("dialog", { name: "Settings" }).waitFor();
        assert.equal(await page.locator("dialog").evaluate((el) => el.matches(":modal")), true);
        assert.equal(await page.locator("dialog").evaluate((el) => el.getAnimations().length), 0);
        await page.keyboard.press("Escape");
        assert.equal(await page.locator("dialog").isVisible(), false);
        assert.deepEqual(errors, []);
        await page.close();
        results.push({
          name: "vite",
          react: "19.0.0",
          compiler: false,
          build: true,
          tsc: true,
          consoleErrors: errors,
        });
      } finally {
        legacy.kill("SIGTERM");
      }
      await run("pnpm", ["add", "react@19.3.1", "react-dom@19.3.1"], cwd, "vite-react19-restore");
    }
  }
} finally {
  await browser.close();
  server.close();
  await writeFile(resolve(base, "results.json"), JSON.stringify(results, null, 2));
}
console.table(results);
