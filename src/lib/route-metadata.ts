import type { Metadata } from "next";

const SITE_NAME = "Zenith Companion";
const SOCIAL_IMAGE = "/readme/social-preview.png";
const SOCIAL_IMAGE_ALT = "Zenith Companion dashboard and IdleMMO planning tool previews.";

type RouteMetadataInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
};

export function createRouteMetadata({ title, description, path, keywords = [] }: RouteMetadataInput): Metadata {
  const socialTitle = `${title} | ${SITE_NAME}`;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      url: path,
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      images: [
        {
          url: SOCIAL_IMAGE,
          width: 1280,
          height: 640,
          alt: SOCIAL_IMAGE_ALT,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [SOCIAL_IMAGE],
    },
  };
}
