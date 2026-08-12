import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/tempcdn/legal-document-view";

const TITLE = "Terms of Service — TempCDN";
const DESCRIPTION = "The terms that govern use of TempCDN's free file hosting service.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/terms" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "/terms",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TempCDN — files pass through, they don't stay"
      }
    ]
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"]
  }
};

export default function TermsPage() {
  return <LegalDocumentView docType="terms" />;
}
