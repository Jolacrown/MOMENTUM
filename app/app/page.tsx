import { redirect } from 'next/navigation';

export default function OldAppRedirect() {
  redirect('/dashboard');
}
