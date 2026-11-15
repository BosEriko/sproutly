import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Sproutly",
    short_name: "Sproutly",
    description: "Track baby formula bottles and when they spoil",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fbfaf8",
    theme_color: "#fbfaf8",
    icons: [
      { src: "/app-icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app-icons/maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
