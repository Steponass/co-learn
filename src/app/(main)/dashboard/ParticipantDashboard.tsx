"use client";

import { useBookingSessions } from "../booking/hooks/useBookingSessions";
import AvailableSessionsList from "../booking/components/(participant)/AvailableSessionsList";
import ParticipantSessionList from "../booking/components/(participant)/ParticipantSessionList";
import PastSessionsList from "../booking/components/PastSessionsList";
import MessageDisplay from "../components/MessageDisplay";
import classes from "./Dashboard.module.css";

interface ParticipantDashboardProps {
  name: string;
  participantId: string;
}

export default function ParticipantDashboard({
  name,
  participantId,
}: ParticipantDashboardProps) {
  const {
    availableSessions,
    userSessions,
    pastSessions,
    participantCounts,
    loading,
    error,
    actionLoading,
    actionErrors,
    bookSession,
    cancelBooking,
  } = useBookingSessions({
    userId: participantId,
    userRole: "participant",
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

      <AvailableSessionsList
        sessions={availableSessions}
        participantCounts={participantCounts}
        onBook={bookSession}
        loading={actionLoading.booking}
        error={actionErrors.booking}
      />

      <ParticipantSessionList
        sessions={userSessions}
        onCancel={cancelBooking}
        loading={actionLoading.canceling}
        error={actionErrors.canceling}
      />

      <PastSessionsList
        sessions={pastSessions}
        participantCounts={participantCounts}
      />
    </div>
  );
}