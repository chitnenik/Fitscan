import FitPreview from "./FitPreview";

export default async function FitPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; size?: string }>;
}) {
  const { product, size } = await searchParams;
  return <FitPreview productId={product} initialSize={size} />;
}
