import ListingDetailClient from "./ListingDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ListingPage({ params }: Props) {
  const { id } = await params;
  return <ListingDetailClient id={Number(id)} />;
}
