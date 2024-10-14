
export const dynamic = 'force-dynamic' // defaults to auto

export async function GET(request: Request) {
    return new Response('Hello, aialexa!', {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
    })
}