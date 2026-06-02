import { z } from 'zod';

export const ChaptersSchema = z.array(
  z.object({
    start: z.string(),
    title: z.string().min(3),
  })
);

export const YouTubeSchema = z.object({
  title: z.string().min(10).max(70),
  description: z.string().min(50),
  tags: z.array(z.string()).min(5).max(25),
  chapters: ChaptersSchema.optional(),
});

export const SocialSchema = z.object({
  x: z.object({
    main: z.string().max(280),
    thread: z.array(z.string().max(280)).max(3).optional(),
  }),
  bluesky: z.object({
    post: z.string().max(300),
  }),
  linkedin: z.object({
    post: z.string().min(50),
    hashtags: z.array(z.string()).max(10).optional(),
  }),
  reddit: z.object({
    title: z.string().min(10).max(180),
    body: z.string().min(50),
  }),
});

export const BlogSchema = z.object({
  title: z.string().min(10).max(120),
  content: z.string().min(200),
});

export const outputSchema = z.object({
  youtube: YouTubeSchema,
  socials: SocialSchema,
  blog: BlogSchema,
});

export type Output = z.infer<typeof outputSchema>;
export type YouTubeOutput = z.infer<typeof YouTubeSchema>;
export type SocialOutput = z.infer<typeof SocialSchema>;
export type BlogOutput = z.infer<typeof BlogSchema>;
