import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/settings/", "/dashboard/", "/resume/", "/applications/"],
    },
    sitemap: "https://ai-job-tracker-demo.vercel.app/sitemap.xml",
  };
}
