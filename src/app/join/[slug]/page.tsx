import { redirect } from 'next/navigation'

// /join/[slug] was the original form URL. All forms now live at /form/[slug].
// This redirect preserves any old links shared before the rename.
export default function JoinRedirect({ params }: { params: { slug: string } }) {
  redirect(`/form/${params.slug}`)
}
