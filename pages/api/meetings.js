import dbConnect, { User, Meeting } from '../../lib/db';

export default async function handler(req, res) {
  // Get registered users from database
  const getTeamData = async () => {
    try {
      await dbConnect();
      const registeredUsers = await User.find({}, 'username email role').lean();
      
      const dbUsers = registeredUsers.map((user) => ({
        id: user._id.toString(),
        username: user.username,
        name: user.username,
        role: user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' '),
        email: user.email
      }));
      
      return dbUsers;
    } catch (error) {
      console.error('Database error in getTeamData:', error);
      // Return demo data as fallback
      return [
        { id: '1', username: 'demo_user', name: 'Demo User', role: 'Developer', email: 'demo@example.com' },
        { id: '2', username: 'project_manager', name: 'Project Manager', role: 'Project Manager', email: 'pm@example.com' }
      ];
    }
  };

  if (req.method === 'GET') {
    try {
      await dbConnect();
      const { projectId } = req.query;
      
      // Filter by projectId if provided
      const query = projectId ? { projectId: projectId } : {};
      const meetings = await Meeting.find(query).lean();
      
      console.log('🔥 DB Connection successful');
      console.log('🔥 Query:', query);
      console.log('🔥 REAL DB MEETINGS COUNT:', meetings.length);
      
      // Convert MongoDB _id to string and handle both old and new format
      const formattedMeetings = meetings.map(meeting => {
        let date, time;
        
        if (meeting.timestamp) {
          // New format: convert timestamp to date/time
          const meetingDate = new Date(meeting.timestamp);
          date = meetingDate.toISOString().split('T')[0];
          time = meetingDate.toTimeString().slice(0, 5);
        } else {
          // Old format: use existing date/time fields
          date = meeting.date;
          time = meeting.time;
        }
        
        return {
          ...meeting,
          _id: meeting._id.toString(),
          date,
          time,
          duration: parseInt(meeting.duration) || 60
        };
      });
      
      res.status(200).json(formattedMeetings);
    } catch (error) {
      console.error('❌ Database error in GET:', error);
      res.status(500).json({ error: 'Database connection failed', details: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      console.log('🔥 POST request received:', req.body);
      
      const { creatorRole } = req.body;
      
      // Check permissions - only admin and project_manager can create meetings
      if (creatorRole !== 'admin' && creatorRole !== 'project_manager') {
        return res.status(403).json({ error: 'Insufficient permissions to create meetings' });
      }
      
      console.log('🔥 Connecting to database...');
      await dbConnect();
      console.log('🔥 Database connected successfully');
      
      // Convert date and time to timestamp
      const meetingDateTime = new Date(`${req.body.date}T${req.body.time}:00`);
      const timestamp = meetingDateTime.getTime();
      console.log('🔥 Timestamp created:', timestamp);
      
      // Generate unique room name using project name, date, and timestamp
      const projectName = req.body.title.replace(/\s+/g, '-').toLowerCase();
      const dateStr = req.body.date.split('-').reverse().join('-'); // Convert to dd-mm-yyyy
      const timeStr = req.body.time.replace(':', '');
      const roomName = `${projectName}-${dateStr}-${timeStr}-${Date.now()}`;
      console.log('🔥 Room name generated:', roomName);
      
      const meetingData = {
        projectId: req.body.projectId, // Keep as string, don't convert to number
        title: req.body.title,
        timestamp: timestamp,
        duration: req.body.duration || '30',
        purpose: req.body.purpose || '',
        location: req.body.location || 'Online Meet',
        participants: req.body.participants,
        hostId: req.body.hostId || 'demo_user',
        roomName: roomName
      };
      
      console.log('🔥 Creating meeting with data:', meetingData);
      const newMeeting = new Meeting(meetingData);
      
      console.log('🔥 Saving meeting to database...');
      const savedMeeting = await newMeeting.save();
      console.log('🔥 Meeting saved successfully:', savedMeeting._id);
      
      // Convert timestamp back to date/time for response
      const responseDate = new Date(savedMeeting.timestamp);
      const responseMeeting = {
        ...savedMeeting.toObject(),
        date: responseDate.toISOString().split('T')[0],
        time: responseDate.toTimeString().slice(0, 5)
      };
      
      console.log('🔥 Returning response meeting:', responseMeeting);
      
      // Get team data for notifications after successful save
      const team = await getTeamData();
      
      // Send notifications and emails (handle both string and numeric IDs)
      console.log('Meeting participants:', req.body.participants);
      console.log('Available team members:', team.map(t => ({ id: t.id, name: t.name, email: t.email })));
      
      const participantEmails = req.body.participants.map(id => {
        const member = team.find(t => t.id == id); // Use == to handle string/number comparison
        console.log(`Looking for ID ${id}, found:`, member);
        return member ? member.email : null;
      }).filter(email => email);

      const participantNames = req.body.participants.map(id => {
        const member = team.find(t => t.id == id); // Use == to handle string/number comparison
        return member ? member.name : null;
      }).filter(name => name);
      
      console.log('Final participant emails:', participantEmails);
      console.log('Final participant names:', participantNames);

      // Send in-app notifications
      try {
        await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userIds: req.body.participants,
            message: `Meeting scheduled: ${req.body.title} on ${req.body.date} at ${req.body.time} (${req.body.duration || '60'} min)`,
            type: 'meeting'
          })
        });
      } catch (error) {
        console.error('Notification error:', error);
      }

      // Send emails to actual user login emails
      console.log('Attempting to send emails to:', participantEmails);
      if (participantEmails.length > 0) {
        try {
          console.log('Sending email request...');
          const emailResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: participantEmails,
              subject: `Meeting Invitation: ${req.body.title}`,
              text: `You have been invited to a meeting:\n\nTitle: ${req.body.title}\nDate: ${req.body.date}\nTime: ${req.body.time}\nDuration: ${req.body.duration || '60'} minutes\nLocation: ${req.body.location || 'Online (Jitsi Meet)'}\nPurpose: ${req.body.purpose || 'Meeting discussion'}\n\nParticipants: ${participantNames.join(', ')}\n\nPlease join the meeting at the scheduled time.`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                  <h2 style="color: #007bff; text-align: center;">Meeting Invitation</h2>
                  <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
                    <p><strong>Title:</strong> ${req.body.title}</p>
                    <p><strong>Date:</strong> ${req.body.date}</p>
                    <p><strong>Time:</strong> ${req.body.time}</p>
                    <p><strong>Duration:</strong> ${req.body.duration || '60'} minutes</p>
                    <p><strong>Location:</strong> ${req.body.location || 'Online (Jitsi Meet)'}</p>
                    <p><strong>Purpose:</strong> ${req.body.purpose || 'Meeting discussion'}</p>
                    <p><strong>Participants:</strong> ${participantNames.join(', ')}</p>
                  </div>
                  <p style="text-align: center; margin: 20px 0;">
                    <strong>Please join the meeting at the scheduled time.</strong>
                  </p>
                  <div style="text-align: center; margin: 20px 0;">
                    <a href="#" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Join Meeting</a>
                  </div>
                </div>
              `
            })
          });
          
          const emailResult = await emailResponse.json();
          console.log('Email API response:', emailResult);
          
          if (emailResponse.ok) {
            console.log('✅ Emails sent successfully!');
          } else {
            console.error('❌ Email sending failed:', emailResult);
          }
        } catch (error) {
          console.error('❌ Email error:', error);
        }
      } else {
        console.log('⚠️ No email addresses found for participants');
      }
      
      res.status(201).json(responseMeeting);
    } catch (error) {
      console.error('❌ Database error in POST:', error);
      console.error('❌ Error stack:', error.stack);
      return res.status(500).json({ error: 'Failed to save meeting to database', details: error.message });
    }

  } else if (req.method === 'DELETE') {
    try {
      await dbConnect();
      await Meeting.deleteMany({});
      res.status(200).json({ message: 'All meetings cleared successfully' });
    } catch (error) {
      console.error('Database error in DELETE:', error);
      res.status(200).json({ message: 'Meetings cleared (demo mode)' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}