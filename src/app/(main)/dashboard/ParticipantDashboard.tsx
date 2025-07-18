import ParentBookingLists from "../booking/components/(participant)/ParentBookingLists";
import classes from "./Dashboard.module.css";

type Props = { userEmail: string; name: string; participantId: string };

export default function ParticipantDashboard({ name, participantId }: Props) {
  return (
    <div className={classes.dashboard + " stack"}>
      <div className={classes.dashboard_header}>
      <h2>Participant Dashboard</h2>
      <h3 className={classes.welcome_name}>Hey, {name}!</h3>
      </div>
      <ParentBookingLists
        participantId={participantId}
        participantName={name}
      />
    </div>
  );
}
