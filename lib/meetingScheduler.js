import dbConnect, { Meeting } from './db';

export async function scheduleMeeting(meetingData) {
  await dbConnect();
  
  const meeting = new Meeting({
    projectId: meetingData.projectId,
    projectName: meetingData.projectName,
    date: meetingData.date,
    time: meetingData.time,
    participants: meetingData.participants,
    meetingLink: meetingData.meetingLink,
    scheduledBy: meetingData.scheduledBy,
    hostId: meetingData.hostId,
    roomName: meetingData.roomName,
    status: 'scheduled',
    notificationsSent: {
      scheduled: false,
      reminder: false,
      started: false
    }
  });

  return await meeting.save();
}

export async function getMeeting(meetingId) {
  await dbConnect();
  return await Meeting.findById(meetingId);
}

export async function updateMeetingStatus(meetingId, status) {
  await dbConnect();
  return await Meeting.findByIdAndUpdate(meetingId, { status }, { new: true });
}