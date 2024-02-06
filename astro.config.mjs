import {defineConfig} from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from "@astrojs/tailwind";

import {SITE_METADATA} from "./src/consts.ts";

// https://astro.build/config
export default defineConfig({
    redirects: {
        '/spezi': '/blog/spezi',
        '/munich': '/blog/munich',
        '/books': '/blog/books'
    },
    prefetch: true,
    site: SITE_METADATA.siteUrl,
    integrations: [mdx(), sitemap(), tailwind()]
});
