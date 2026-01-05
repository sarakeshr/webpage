import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const debugData = {
        ...req.body,
        debugTime: new Date().toISOString()
      };
      
      const debugFile = path.join(process.cwd(), 'debug-meetings.json');
      fs.writeFileSync(debugFile, JSON.stringify(debugData, null, 2));
      
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}