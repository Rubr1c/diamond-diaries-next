export default function EntryPage({ params }: { params: { id: string } }) {
  const { id } = params;

  return (
    <div className="mt-20">
      <h1 className="text-2xl font-bold">Entry Details</h1>
      <p>Entry ID: {id}</p>
    </div>
  );
}
