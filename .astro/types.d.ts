declare module 'astro:content' {
	interface Render {
		'.mdx': Promise<{
			Content: import('astro').MarkdownInstance<{}>['Content'];
			headings: import('astro').MarkdownHeading[];
			remarkPluginFrontmatter: Record<string, any>;
		}>;
	}
}

declare module 'astro:content' {
	interface Render {
		'.md': Promise<{
			Content: import('astro').MarkdownInstance<{}>['Content'];
			headings: import('astro').MarkdownHeading[];
			remarkPluginFrontmatter: Record<string, any>;
		}>;
	}
}

declare module 'astro:content' {
	export { z } from 'astro/zod';

	type Flatten<T> = T extends { [K: string]: infer U } ? U : never;

	export type CollectionKey = keyof AnyEntryMap;
	export type CollectionEntry<C extends CollectionKey> = Flatten<AnyEntryMap[C]>;

	export type ContentCollectionKey = keyof ContentEntryMap;
	export type DataCollectionKey = keyof DataEntryMap;

	// This needs to be in sync with ImageMetadata
	export type ImageFunction = () => import('astro/zod').ZodObject<{
		src: import('astro/zod').ZodString;
		width: import('astro/zod').ZodNumber;
		height: import('astro/zod').ZodNumber;
		format: import('astro/zod').ZodUnion<
			[
				import('astro/zod').ZodLiteral<'png'>,
				import('astro/zod').ZodLiteral<'jpg'>,
				import('astro/zod').ZodLiteral<'jpeg'>,
				import('astro/zod').ZodLiteral<'tiff'>,
				import('astro/zod').ZodLiteral<'webp'>,
				import('astro/zod').ZodLiteral<'gif'>,
				import('astro/zod').ZodLiteral<'svg'>,
				import('astro/zod').ZodLiteral<'avif'>,
			]
		>;
	}>;

	type BaseSchemaWithoutEffects =
		| import('astro/zod').AnyZodObject
		| import('astro/zod').ZodUnion<[BaseSchemaWithoutEffects, ...BaseSchemaWithoutEffects[]]>
		| import('astro/zod').ZodDiscriminatedUnion<string, import('astro/zod').AnyZodObject[]>
		| import('astro/zod').ZodIntersection<BaseSchemaWithoutEffects, BaseSchemaWithoutEffects>;

	type BaseSchema =
		| BaseSchemaWithoutEffects
		| import('astro/zod').ZodEffects<BaseSchemaWithoutEffects>;

	export type SchemaContext = { image: ImageFunction };

	type DataCollectionConfig<S extends BaseSchema> = {
		type: 'data';
		schema?: S | ((context: SchemaContext) => S);
	};

	type ContentCollectionConfig<S extends BaseSchema> = {
		type?: 'content';
		schema?: S | ((context: SchemaContext) => S);
	};

	type CollectionConfig<S> = ContentCollectionConfig<S> | DataCollectionConfig<S>;

	export function defineCollection<S extends BaseSchema>(
		input: CollectionConfig<S>
	): CollectionConfig<S>;

	type AllValuesOf<T> = T extends any ? T[keyof T] : never;
	type ValidContentEntrySlug<C extends keyof ContentEntryMap> = AllValuesOf<
		ContentEntryMap[C]
	>['slug'];

	export function getEntryBySlug<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		// Note that this has to accept a regular string too, for SSR
		entrySlug: E
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;

	export function getDataEntryById<C extends keyof DataEntryMap, E extends keyof DataEntryMap[C]>(
		collection: C,
		entryId: E
	): Promise<CollectionEntry<C>>;

	export function getCollection<C extends keyof AnyEntryMap, E extends CollectionEntry<C>>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => entry is E
	): Promise<E[]>;
	export function getCollection<C extends keyof AnyEntryMap>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => unknown
	): Promise<CollectionEntry<C>[]>;

	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(entry: {
		collection: C;
		slug: E;
	}): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(entry: {
		collection: C;
		id: E;
	}): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		slug: E
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(
		collection: C,
		id: E
	): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;

	/** Resolve an array of entry references from the same collection */
	export function getEntries<C extends keyof ContentEntryMap>(
		entries: {
			collection: C;
			slug: ValidContentEntrySlug<C>;
		}[]
	): Promise<CollectionEntry<C>[]>;
	export function getEntries<C extends keyof DataEntryMap>(
		entries: {
			collection: C;
			id: keyof DataEntryMap[C];
		}[]
	): Promise<CollectionEntry<C>[]>;

	export function reference<C extends keyof AnyEntryMap>(
		collection: C
	): import('astro/zod').ZodEffects<
		import('astro/zod').ZodString,
		C extends keyof ContentEntryMap
			? {
					collection: C;
					slug: ValidContentEntrySlug<C>;
			  }
			: {
					collection: C;
					id: keyof DataEntryMap[C];
			  }
	>;
	// Allow generic `string` to avoid excessive type errors in the config
	// if `dev` is not running to update as you edit.
	// Invalid collection names will be caught at build time.
	export function reference<C extends string>(
		collection: C
	): import('astro/zod').ZodEffects<import('astro/zod').ZodString, never>;

	type ReturnTypeOrOriginal<T> = T extends (...args: any[]) => infer R ? R : T;
	type InferEntrySchema<C extends keyof AnyEntryMap> = import('astro/zod').infer<
		ReturnTypeOrOriginal<Required<ContentConfig['collections'][C]>['schema']>
	>;

	type ContentEntryMap = {
		"authors": {
"default.mdx": {
	id: "default.mdx";
  slug: "default";
  body: string;
  collection: "authors";
  data: InferEntrySchema<"authors">
} & { render(): Render[".mdx"] };
};
"blog": {
"2013/03-17-raspberry-pi-schritte.md": {
	id: "2013/03-17-raspberry-pi-schritte.md";
  slug: "2013/03-17-raspberry-pi-schritte";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"2013/03-18-raspberry-pi-remote.md": {
	id: "2013/03-18-raspberry-pi-remote.md";
  slug: "2013/03-18-raspberry-pi-remote";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"2013/03-30-raspberry-pi-airplay.md": {
	id: "2013/03-30-raspberry-pi-airplay.md";
  slug: "2013/03-30-raspberry-pi-airplay";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"2013/06-19-timelapse-location.md": {
	id: "2013/06-19-timelapse-location.md";
  slug: "2013/06-19-timelapse-location";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"2014/09-03-buffalo-linkstation.md": {
	id: "2014/09-03-buffalo-linkstation.md";
  slug: "2014/09-03-buffalo-linkstation";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"2014/09-25-netflix-first-impression.md": {
	id: "2014/09-25-netflix-first-impression.md";
  slug: "2014/09-25-netflix-first-impression";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"2015/03-06-websitespoof.md": {
	id: "2015/03-06-websitespoof.md";
  slug: "2015/03-06-websitespoof";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"2015/03-29-nginx-bandwith-limit.md": {
	id: "2015/03-29-nginx-bandwith-limit.md";
  slug: "2015/03-29-nginx-bandwith-limit";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"2015/04-01-nc-nettest.md": {
	id: "2015/04-01-nc-nettest.md";
  slug: "2015/04-01-nc-nettest";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"2015/05-03-limonade.md": {
	id: "2015/05-03-limonade.md";
  slug: "2015/05-03-limonade";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"2015/11-17-letsencrypt.md": {
	id: "2015/11-17-letsencrypt.md";
  slug: "2015/11-17-letsencrypt";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"2020/aoc-day-1.md": {
	id: "2020/aoc-day-1.md";
  slug: "2020/aoc-day-1";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"2020/aoc-day-2.md": {
	id: "2020/aoc-day-2.md";
  slug: "2020/aoc-day-2";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"2020/aoc-day-3.md": {
	id: "2020/aoc-day-3.md";
  slug: "2020/aoc-day-3";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"2020/aoc-day-4.md": {
	id: "2020/aoc-day-4.md";
  slug: "2020/aoc-day-4";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"2020/aoc-day-5.md": {
	id: "2020/aoc-day-5.md";
  slug: "2020/aoc-day-5";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"2020/aoc-day-6.md": {
	id: "2020/aoc-day-6.md";
  slug: "2020/aoc-day-6";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"2020/emgithub.md": {
	id: "2020/emgithub.md";
  slug: "2020/emgithub";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"2020/test.md": {
	id: "2020/test.md";
  slug: "2020/test";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"2021/arnold.md": {
	id: "2021/arnold.md";
  slug: "2021/arnold";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"2021/printer-of-catan-1/index.md": {
	id: "2021/printer-of-catan-1/index.md";
  slug: "2021/printer-of-catan-1";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"2021/shenzhen-io-1/index.md": {
	id: "2021/shenzhen-io-1/index.md";
  slug: "2021/shenzhen-io-1";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"2021/shenzhen-io-2/index.md": {
	id: "2021/shenzhen-io-2/index.md";
  slug: "2021/shenzhen-io-2";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"2021/shenzhen-io-3/index.md": {
	id: "2021/shenzhen-io-3/index.md";
  slug: "2021/shenzhen-io-3";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"2021/sous-vide/index.md": {
	id: "2021/sous-vide/index.md";
  slug: "2021/sous-vide";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"2022/aoc-day-1.md": {
	id: "2022/aoc-day-1.md";
  slug: "2022/aoc-day-1";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"2022/blumentopf-1/index.mdx": {
	id: "2022/blumentopf-1/index.mdx";
  slug: "2022/blumentopf-1";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".mdx"] };
"2022/blumentopf-2/index.mdx": {
	id: "2022/blumentopf-2/index.mdx";
  slug: "2022/blumentopf-2";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".mdx"] };
"2023/til-dot-clean.md": {
	id: "2023/til-dot-clean.md";
  slug: "2023/til-dot-clean";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
};
"tags": {
"aoc.mdx": {
	id: "aoc.mdx";
  slug: "aoc";
  body: string;
  collection: "tags";
  data: InferEntrySchema<"tags">
} & { render(): Render[".mdx"] };
"automation.mdx": {
	id: "automation.mdx";
  slug: "automation";
  body: string;
  collection: "tags";
  data: InferEntrySchema<"tags">
} & { render(): Render[".mdx"] };
"default.mdx": {
	id: "default.mdx";
  slug: "default";
  body: string;
  collection: "tags";
  data: InferEntrySchema<"tags">
} & { render(): Render[".mdx"] };
"game-jam.mdx": {
	id: "game-jam.mdx";
  slug: "game-jam";
  body: string;
  collection: "tags";
  data: InferEntrySchema<"tags">
} & { render(): Render[".mdx"] };
"godot.mdx": {
	id: "godot.mdx";
  slug: "godot";
  body: string;
  collection: "tags";
  data: InferEntrySchema<"tags">
} & { render(): Render[".mdx"] };
"hugo.mdx": {
	id: "hugo.mdx";
  slug: "hugo";
  body: string;
  collection: "tags";
  data: InferEntrySchema<"tags">
} & { render(): Render[".mdx"] };
"macos.mdx": {
	id: "macos.mdx";
  slug: "macos";
  body: string;
  collection: "tags";
  data: InferEntrySchema<"tags">
} & { render(): Render[".mdx"] };
"plants.mdx": {
	id: "plants.mdx";
  slug: "plants";
  body: string;
  collection: "tags";
  data: InferEntrySchema<"tags">
} & { render(): Render[".mdx"] };
"recipe.mdx": {
	id: "recipe.mdx";
  slug: "recipe";
  body: string;
  collection: "tags";
  data: InferEntrySchema<"tags">
} & { render(): Render[".mdx"] };
"shenzhen-io.mdx": {
	id: "shenzhen-io.mdx";
  slug: "shenzhen-io";
  body: string;
  collection: "tags";
  data: InferEntrySchema<"tags">
} & { render(): Render[".mdx"] };
"sous-vide.mdx": {
	id: "sous-vide.mdx";
  slug: "sous-vide";
  body: string;
  collection: "tags";
  data: InferEntrySchema<"tags">
} & { render(): Render[".mdx"] };
"til.mdx": {
	id: "til.mdx";
  slug: "til";
  body: string;
  collection: "tags";
  data: InferEntrySchema<"tags">
} & { render(): Render[".mdx"] };
"water.mdx": {
	id: "water.mdx";
  slug: "water";
  body: string;
  collection: "tags";
  data: InferEntrySchema<"tags">
} & { render(): Render[".mdx"] };
};

	};

	type DataEntryMap = {
		
	};

	type AnyEntryMap = ContentEntryMap & DataEntryMap;

	type ContentConfig = typeof import("../src/content/config");
}
