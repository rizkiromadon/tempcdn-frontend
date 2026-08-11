const faqs = [
  {
    question: "Do I need an account to upload a file?",
    answer:
      "No. There's no sign-up, login, or API key. Open the upload page or send a curl request, and you'll get a share link back immediately."
  },
  {
    question: "How long do uploaded files stay available?",
    answer:
      "Every file is stored with a fixed expiry (TTL) set at the server level. Once the timer runs out, the file and its link stop working automatically — nothing to clean up manually."
  },
  {
    question: "Is there a file size limit?",
    answer:
      "Yes, the server enforces a maximum upload size and a list of allowed file types. The current limits are always available from the /api/v1/config endpoint, and the upload page checks against them before you upload."
  },
  {
    question: "Can I delete a file before it expires?",
    answer:
      "Yes. Every upload returns a one-time delete_token. Keep it, and you can delete the file early with a single DELETE request — no token, no early deletion."
  },
  {
    question: "Is TempCDN really free?",
    answer:
      "Yes. There's no paid tier, usage cap, or credit card requirement. It's a small tool that stays free by staying simple."
  },
  {
    question: "Can I use TempCDN from a script or CI pipeline?",
    answer:
      "Yes. The upload API accepts a plain multipart/form-data POST request, so a single curl -F file=@yourfile is enough — no auth headers or SDK required."
  }
];

export function FaqSection() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };

  return (
    <section className="mx-auto max-w-5xl border-t border-line px-5 py-16 sm:py-20">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h2 className="mb-1 font-display text-xl font-bold text-ink sm:text-2xl">
        Frequently asked questions
      </h2>
      <p className="mb-8 max-w-lg text-sm leading-relaxed text-ink-soft">
        The short answers. The full detail lives in the API docs.
      </p>
      <dl className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
        {faqs.map((faq) => (
          <div key={faq.question}>
            <dt className="mb-1.5 text-sm font-semibold text-ink">{faq.question}</dt>
            <dd className="text-sm leading-relaxed text-ink-soft">{faq.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
