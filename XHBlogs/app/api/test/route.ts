export const runtime = 'edge';
export async function GET() {
  return new Response("汪！我能通！", { status: 200 });
}