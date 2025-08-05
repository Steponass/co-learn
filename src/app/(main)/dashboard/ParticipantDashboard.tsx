import ParentBookingLists from "../booking/components/(participant)/ParentBookingLists";
import classes from "./Dashboard.module.css";

interface ParticipantDashboardProps {
  name: string;
  participantId: string;
}

export default function ParticipantDashboard({ 
  name, 
  participantId 
}: ParticipantDashboardProps) {
  return (
    <div className={classes.dashboard + " stack"}>
      <div className={classes.dashboard_header}>
        <h3 className={classes.welcome_name}>Hey, {name}!</h3>
      </div>
      
      <ParentBookingLists
        participantId={participantId}
        participantName={name}
        
      />
    </div>
  );
}