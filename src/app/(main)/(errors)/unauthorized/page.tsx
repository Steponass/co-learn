import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unauthorized | Co~Learn",
  description: "Sorry, you are not authorized to view this page."
};

export default function UnauthorizedPage() {
  return (
    <div>
      <h1>You don&#39;t belong here!</h1>
      <p>
        You are not authorized to view this page 🤷.
        <br></br>
        {" "}<a href="/login">log in</a> or close this tab.
      </p>
      
    </div>
  );
}
