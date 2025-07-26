import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Error | Co~Learn",
  description: "Something went wrong… Try again later?"
};

export default function ErrorPage() {
  return (
    <div>
      <h1>Someone did a oopsie 💩</h1>
      <p>
        Try again, maybe? You can also{" "}
        <a href="mailto:steponas.dabuzinskas@gmail.com">email Step</a>
      </p>
    </div>
  );
}
