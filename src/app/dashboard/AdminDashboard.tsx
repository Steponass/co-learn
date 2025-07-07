import classes from "./Dashboard.module.css";

type Props = { name: string };

export default function AdminDashboard({ name }: Props) {
  return (
    <div className={classes.dashboard}>
      <h1>Admin Dashboard</h1>
      <h2>Welcome, {name})!</h2>
      <p>You DA BIG BOSS!</p>
    </div>
  );
}
