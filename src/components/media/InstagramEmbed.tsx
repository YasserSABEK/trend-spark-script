import React, { useMemo } from "react";

interface InstagramEmbedProps {
  url: string;
  className?: string;
  title?: string;
}

function buildEmbedUrl(inputUrl: string): string {
  try {
    const u = new URL(inputUrl);
    // Normalize path to include /embed
    // Supported paths: /reel/{id}/, /p/{id}/, /tv/{id}/
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      const type = parts[0];
      const id = parts[1];
      if (["reel", "p", "tv"].includes(type)) {
        u.pathname = `/${type}/${id}/embed`;
      }
    }
    // Force HTTPS and instagram.com host
    u.protocol = "https:";
    u.host = "www.instagram.com";
    return u.toString();
  } catch {
    // Fallback to original URL if parsing fails (will still open an iframe)
    return inputUrl;
  }
}

export const InstagramEmbed: React.FC<InstagramEmbedProps> = ({ url, className = "", title = "Instagram post" }) => {
  const embedUrl = useMemo(() => buildEmbedUrl(url), [url]);
  return (
    <div className={`relative ${className}`}>
      <iframe
        src={embedUrl}
        title={title}
        loading="lazy"
        className="w-full h-full rounded-lg bg-muted"
        allowTransparency
        allow="encrypted-media; clipboard-write"
        frameBorder={0}
        scrolling="no"
      />
    </div>
  );
};
