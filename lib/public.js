// Shapes safe to send to the client-facing quote page (no admin-only fields).

export function publicQuote(quote) {
  return {
    slug: quote.slug,
    clientName: quote.clientName,
    title: quote.title,
    taxRate: quote.taxRate,
    status: quote.status,
    items: quote.items,
    signatureName: quote.signatureName,
    acceptedAt: quote.acceptedAt,
    acceptedTotals: quote.acceptedTotals,
    updatedAt: quote.updatedAt,
  };
}

export function publicSettings(settings) {
  return {
    businessName: settings.businessName,
    introText: settings.introText,
    acceptanceText: settings.acceptanceText,
  };
}
