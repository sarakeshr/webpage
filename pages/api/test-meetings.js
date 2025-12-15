import dbConnect, { Meeting } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      await dbConnect();
      console.log('🔗 Database connected successfully');
      
      // Check if meetings exist
      const existingMeetings = await Meeting.find({}).lean();
      console.log('📊 Existing meetings count:', existingMeetings.length);
      
      if (existingMeetings.length === 0) {
        console.log('➕ Creating sample meetings...');
        
        // Create sample meetings
        const sampleMeetings = [
          {
            projectId: 1,
            title: 'Daily Standup',
            date: '2024-12-20',
            time: '09:00',
            duration: '30',
            purpose: 'Daily team sync',
            location: 'Online Meet',
            participants: ['demo_user'],
            hostId: 'demo_user',
            roomName: 'project_1_standup'
          },
          {
            projectId: 1,
            title: 'Sprint Planning',
            date: '2024-12-21',
            time: '14:00',
            duration: '60',
            purpose: 'Plan next sprint',
            location: 'Online Meet',
            participants: ['demo_user', 'project_manager'],
            hostId: 'project_manager',
            roomName: 'project_1_planning'
          },
          {
            projectId: 1,
            title: 'Code Review',
            date: '2024-12-22',
            time: '10:30',
            duration: '45',
            purpose: 'Review recent code changes',
            location: 'Online Meet',
            participants: ['demo_user'],
            hostId: 'demo_user',
            roomName: 'project_1_review'
          }
        ];
        
        const createdMeetings = await Meeting.insertMany(sampleMeetings);
        console.log('✅ Sample meetings created:', createdMeetings.length);
        
        res.status(200).json({
          message: 'Sample meetings created',
          count: createdMeetings.length,
          meetings: createdMeetings
        });
      } else {
        res.status(200).json({
          message: 'Meetings already exist',
          count: existingMeetings.length,
          meetings: existingMeetings
        });
      }
    } catch (error) {
      console.error('❌ Database error:', error);
      res.status(500).json({ 
        error: 'Database operation failed', 
        details: error.message,
        stack: error.stack 
      });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}