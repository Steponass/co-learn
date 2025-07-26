import UpdatePasswordForm from './UpdatePasswordForm'
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Update Password | Co~Learn",
  description: "Update your Co~Learn account password"
};


export default function UpdatePasswordPage() {
  return (
    <div>
      <UpdatePasswordForm />
    </div>
  )
}