type Props = { userEmail: string; name: string };

export default function AdminDashboard({ userEmail, name }: Props) {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <h2>
        Welcome, {name} ({userEmail})!
      </h2>
      <p>You DA BIG BOSS!</p>
    </div>
  );
}
