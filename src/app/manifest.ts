import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "מחולל דוחות מפת לידה",
    short_name: "מפת לידה",
    description: "יצירת דוחות מפת לידה אישיים בעברית",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1030",
    theme_color: "#0b1030",
    dir: "rtl",
    lang: "he",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
