export const runtime = 'edge';
export async function GET() {
  return new Response("Woof! I can reach you!", { status: 200 });
}