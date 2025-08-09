"use client";

import { useBookingSessions } from "../booking/hooks/useBookingSessions";
import FacilitatorSessionList from "../booking/components/(facilitator)/FacilitatorSessionList";
import FacilitatorCreateSession from "../booking/components/(facilitator)/FacilitatorCreateSession";
import FacilitatorSessionParticipants from "../booking/components/(facilitator)/FacilitatorSessionParticipants";
import PastSessionsList from "../booking/components/PastSessionsList";
import MessageDisplay from "../components/MessageDisplay";
import classes from "./Dashboard.module.css";

interface FacilitatorDashboardProps {
  name: string;
  facilitatorId: string;
}

export default function FacilitatorDashboard({
  name,
  facilitatorId,
}: FacilitatorDashboardProps) {
  const {
    userSessions,
    sessionsWithParticipants,
    pastSessions,
    participantCounts,
    loading,
    error,
    actionLoading,
    actionErrors,
    createSession,
    cancelSession,
  } = useBookingSessions({
    userId: facilitatorId,
    userRole: "facilitator",
  });

  if (loading) {
    return (
      <div className={classes.dashboard + " stack"}>
        <div className={classes.dashboard_header}>
          <h3 className={classes.welcome_name}>Hey, {name}!</h3>
        </div>
        <p>Loading your sessions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={classes.dashboard + " stack"}>
        <div className={classes.dashboard_header}>
          <h3 className={classes.welcome_name}>Hey, {name}!</h3>
        </div>
        <MessageDisplay message={error} type="error" />
      </div>
    );
  }

  return (
    <div className={classes.dashboard + " stack"}>
      <div className={classes.dashboard_header}>
        <h3 className={classes.welcome_name}>Hey, {name}!</h3>
      </div>

      <FacilitatorSessionParticipants
        sessions={sessionsWithParticipants}
        participantCounts={participantCounts}
        onCancel={cancelSession}
        loading={actionLoading.canceling}
        error={actionErrors.canceling}
      />

      <FacilitatorSessionList
        sessions={userSessions}
        onCancel={cancelSession}
        loading={actionLoading.canceling}
        error={actionErrors.canceling}
      />

      <FacilitatorCreateSession
      facilitatorId={facilitatorId}
        onCreate={createSession}
        loading={actionLoading.creating}
        error={actionErrors.creating}
      />

      <PastSessionsList
        sessions={pastSessions}
        participantCounts={participantCounts}
      />
    </div>
  );
}