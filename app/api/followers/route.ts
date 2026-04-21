import { NextResponse } from 'next/server'

export async function GET() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN
  const userId = process.env.IG_USER_ID

  if (!token || !userId) {
    return NextResponse.json({ followers: 0 })
  }

  try {
    const res = await fetch(
      `https://graph.instagram.com/v21.0/${userId}?fields=followers_count&access_token=${token}`
    )
    if (!res.ok) throw new Error(`${res.status}`)
    const data = await res.json()
    return NextResponse.json({ followers: data.followers_count ?? 0 })
  } catch (e) {
    console.error('Followers fetch error:', e)
    return NextResponse.json({ followers: 0 })
  }
}
