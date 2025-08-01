// src/app/(main)/dashboard/FacilitatorDashboard.tsx
"use client";

import FacilitatorSessionList from "../booking/components/(facilitator)/FacilitatorSessionList";
import FacilitatorCreateSession from "../booking/components/(facilitator)/FacilitatorCreateSession";
import FacilitatorSessionParticipants from "../booking/components/(facilitator)/FacilitatorSessionParticipants";
import classes from "./Dashboard.module.css";

interface FacilitatorDashboardProps {
  name: string;
  facilitatorId: string;
}

export default function FacilitatorDashboard({ 
  name, 
  facilitatorId 
}: FacilitatorDashboardProps) {
  return (
    <div className={classes.dashboard + " stack"}>
      <div className={classes.dashboard_header}>
        <h3 className={classes.welcome_name}>Hey, {name}!</h3>
      </div>

      <FacilitatorSessionParticipants facilitatorId={facilitatorId} />
      
      <FacilitatorSessionList facilitatorId={facilitatorId} />
      
      <FacilitatorCreateSession facilitatorId={facilitatorId} />
    </div>
  );
}