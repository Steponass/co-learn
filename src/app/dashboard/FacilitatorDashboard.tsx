"use client";

import FacilitatorSessionList from "../booking/components/(facilitator)/FacilitatorSessionList";
import FacilitatorCreateSession from "../booking/components/(facilitator)/FacilitatorCreateSession";
import FacilitatorSessionParticipants from "../booking/components/(facilitator)/FacilitatorSessionParticipants";
import classes from "./Dashboard.module.css";

type Props = { userEmail: string; name: string; facilitatorId: string };

export default function FacilitatorDashboard({ name, facilitatorId }: Props) {
  return (
    <div className={classes.dashboard + " stack"}>
      <div className={classes.dashboard_title}>
        <h1>Facilitator Dashboard</h1>
        <h2 className={classes.welcome_name}>Hey, {name}!</h2>
      </div>

      <FacilitatorSessionParticipants facilitatorId={facilitatorId} />
      <FacilitatorSessionList facilitatorId={facilitatorId} />
      <FacilitatorCreateSession
        facilitatorId={facilitatorId}
        facilitatorName={name}
      />
    </div>
  );
}
