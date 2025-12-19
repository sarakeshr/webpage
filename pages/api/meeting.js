// Legacy meeting API - replaced by meetings.js
export default function handler(req, res) {
  res.status(301).redirect('/api/meetings');
}