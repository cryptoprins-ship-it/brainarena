// Server component that renders a JSON-LD structured-data block in the page
// <head>/<body>. Google reads this for rich-result eligibility (game cards
// in search, brand panels, etc.). Keep payloads minimal and schema-valid —
// the validator at https://validator.schema.org will flag missing required
// fields.
type Props = {
  data: Record<string, unknown>;
};

export default function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
