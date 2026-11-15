import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sproutly",
    short_name: "Sproutly",
    description: "Track baby formula bottles and when they spoil",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f7f5",
    theme_color: "#16a34a",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
