# SvelteKit SaaS Starter

Bootstrap your next SaaS project with this SvelteKit template. 🚀

🌍 Live: https://kit-saas-starter.pages.dev/

Entirely hosted on [Cloudflare](https://www.cloudflare.com/). Why?

1. They have a [generous free tier](https://www.cloudflare.com/plans/developer-platform/#overview). For real.
2. Deploying is really easy and they have a great support.
3. A lot of built-in tools, like D1 (database), R2 (storage), cache, DNS ecc.
4. [It's easy to get out](https://youtu.be/4Wa5DivljOM), if you want, because [egress costs are the lowest among the competitors](https://cf-assets.www.cloudflare.com/slt3lc6tev37/5fz2zMzj6ZqgwFsQype2Cy/d14e589b1a8fb5fcdd4834e35e017554/Say-goodbye-to-egress-fees_ebook.pdf).

## Features

❤️ [SvelteKit](https://github.com/sveltejs/kit) - Full stack JS meta framework

🪶 [Drizzle ORM](https://github.com/drizzle-team/drizzle-orm) - Next gen, lightweight TypeScript ORM.

🛆 [Lucia](https://github.com/lucia-auth/lucia) - A fully typed auth library

💅🏻 [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) - For styling

[Bits UI](https://github.com/huntabyte/bits-ui) + [shadcn-svelte](https://github.com/huntabyte/shadcn-svelte)

🔄 [@total-typescript/ts-reset](https://github.com/total-typescript/ts-reset) - A 'CSS reset' for TypeScript, improving types for common JavaScript API's

🛣️ [vite-plugin-kit-routes](https://github.com/jycouet/kitql/tree/main/packages/vite-plugin-kit-routes) - Fully typed routes!

⚡ [formsnap](https://github.com/svecosystem/formsnap) + [sveltekit-superforms](https://github.com/ciscoheat/sveltekit-superforms) + [zod](https://github.com/colinhacks/zod) = Amazing forms

🌀 [lucide](https://github.com/lucide-icons/lucide) - Beautiful and simple icons

🌲 [pino](https://github.com/pinojs/pino) - Logging for client and server side

## How to use

Clone this repo with

```bash
pnpm dlx degit --mode=git yverek/kit-saas-starter my-project
cd my-project
pnpm install
cp wrangler.example.toml wrangler.toml
```

Go to [Cloudflare](cloudflare.com) and [deploy](https://developers.cloudflare.com/pages/framework-guides/deploy-a-svelte-site/) this project.

Log in with your Cloudflare account by running:

```bash
pnpm exec wrangler login
```

Now create your D1 database with

```bash
$ pnpm exec wrangler d1 create my-db-prod

✅ Successfully created DB "my-db-prod"

[[d1_databases]]
binding = "DB"
database_name = "my-db-prod"
database_id = "<unique-ID-for-your-database>"
```

Go to `wrangler.toml` and change `database_name` and `database_id`.

Go to `drizzle.config.ts` and change `dbName`.

Go to `package.json` and change dbName in `drizzle:push:dev` and `drizzle:push:prod`.

```bash
pnpm drizzle:push:dev
```

Now, you can run

```bash
pnpm dev

# or start the server and open the app in a new browser tab
pnpm dev -- --open
```

## Testing

Install Playwright testing tools with

```bash
pnpm exec playwright install
```

Run

```bash
pnpm test
```

## Deploy

Just migrate schema to production database

```bash
pnpm drizzle:push:prod
```
