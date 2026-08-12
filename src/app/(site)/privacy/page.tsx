import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/tempcdn/legal-document-view";

const TITLE = "Privacy Policy — TempCDN";
const DESCRIPTION = "How TempCDN handles data for its free file hosting service.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "/privacy"
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION
  }
};

export default function PrivacyPage() {
  return <LegalDocumentView docType="privacy" />;
}
