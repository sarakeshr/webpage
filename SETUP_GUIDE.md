# Complete Jitsi Integration Setup Guide

## 🎯 What We've Done

1. ✅ Updated Meeting schema with host and moderator fields
2. ✅ Created JWT token generator for Jitsi authentication
3. ✅ Created API endpoint for joining meetings
4. ✅ Created Jitsi meeting component with moderator controls
5. ✅ Created meeting room page
6. ✅ Updated meeting creation to generate Jitsi rooms

## 📋 Step-by-Step Implementation

### OPTION 1: Quick Start (Using meet.jit.si - Free)

**Pros:** No server setup, works immediately
**Cons:** Limited moderator features, public server

1. **Your .env.local is already configured for meet.jit.si**
   - No changes needed to start testing

2. **Test the integration:**
   ```bash
   npm run dev
   ```

3. **Create a meeting and navigate to:**
   ```
   http://localhost:3000/meeting-room?meetingId=YOUR_MEETING_ID
   ```

### OPTION 2: Self-Hosted Jitsi (Full Control)

**Pros:** Complete control, all moderator features, private
**Cons:** Requires server setup

#### A. Server Setup (Ubuntu 20.04/22.04)

1. **Get a server:**
   - AWS EC2 (t3.medium or larger)
   - DigitalOcean Droplet ($12/month)
   - Azure VM
   - Minimum: 4GB RAM, 2 CPU cores

2. **Point domain to server:**
   - Buy domain (e.g., Namecheap, GoDaddy)
   - Create A record: `meet.yourdomain.com` → Server IP

3. **SSH into server and run:**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Set hostname
   sudo hostnamectl set-hostname meet.yourdomain.com
   echo "127.0.0.1 meet.yourdomain.com" | sudo tee -a /etc/hosts
   
   # Install Jitsi
   curl https://download.jitsi.org/jitsi-key.gpg.key | sudo sh -c 'gpg --dearmor > /usr/share/keyrings/jitsi-keyring.gpg'
   echo 'deb [signed-by=/usr/share/keyrings/jitsi-keyring.gpg] https://download.jitsi.org stable/' | sudo tee /etc/apt/sources.list.d/jitsi-stable.list
   sudo apt update
   sudo apt install jitsi-meet -y
   
   # During installation:
   # - Enter your domain: meet.yourdomain.com
   # - Choose "Generate a new self-signed certificate" (we'll add SSL next)
   
   # Install SSL certificate
   sudo /usr/share/jitsi-meet/scripts/install-letsencrypt-cert.sh
   ```

#### B. Configure Moderator Features

1. **Edit Jitsi config:**
   ```bash
   sudo nano /etc/jitsi/meet/meet.yourdomain.com-config.js
   ```
   
   Add inside the `config = {` section:
   ```javascript
   disableRemoteMute: false,
   enableLobbyChat: true,
   startWithAudioMuted: true,
   startWithVideoMuted: true,
   prejoinConfig: {
       enabled: true
   }
   ```

2. **Enable JWT authentication:**
   ```bash
   sudo nano /etc/prosody/conf.avail/meet.yourdomain.com.cfg.lua
   ```
   
   Change the VirtualHost section:
   ```lua
   VirtualHost "meet.yourdomain.com"
       authentication = "token"
       app_id = "jitsi_app"
       app_secret = "YOUR_SECRET_KEY_HERE"
       allow_empty_token = false
   
   VirtualHost "guest.meet.yourdomain.com"
       authentication = "anonymous"
       c2s_require_encryption = false
   ```

3. **Configure Jicofo:**
   ```bash
   sudo nano /etc/jitsi/jicofo/jicofo.conf
   ```
   
   Add:
   ```hocon
   jicofo {
     authentication {
       enabled = true
       type = JWT
       login-url = meet.yourdomain.com
     }
     conference {
       enable-auto-owner = false
     }
   }
   ```

4. **Restart all services:**
   ```bash
   sudo systemctl restart prosody
   sudo systemctl restart jicofo
   sudo systemctl restart jitsi-videobridge2
   sudo systemctl restart nginx
   ```

5. **Update your .env.local:**
   ```env
   JITSI_DOMAIN=meet.yourdomain.com
   JITSI_APP_ID=jitsi_app
   JITSI_APP_SECRET=YOUR_SECRET_KEY_HERE
   ```

## 🎮 Moderator Features Available

### Host Controls (Automatic for meeting creator):

1. **Mute Participants:**
   ```javascript
   api.executeCommand('muteEveryone');
   ```

2. **Kick Participant:**
   ```javascript
   api.executeCommand('kickParticipant', participantId);
   ```

3. **Enable/Disable Lobby:**
   ```javascript
   api.executeCommand('toggleLobby', true);
   ```

4. **Grant Moderator:**
   ```javascript
   api.executeCommand('grantModerator', participantId);
   ```

5. **End Meeting:**
   ```javascript
   api.executeCommand('hangup');
   ```

6. **Lock Room:**
   ```javascript
   api.executeCommand('password', 'your-password');
   ```

### Features Controlled by Config:

- ✅ Waiting room/Lobby
- ✅ Disable participant screen share (config)
- ✅ Disable participant chat (config)
- ✅ Recording (moderator only)
- ✅ Live streaming (moderator only)

## 🧪 Testing

1. **Start your app:**
   ```bash
   npm run dev
   ```

2. **Create a meeting** (as director/project_manager)

3. **Join meeting:**
   - Host joins first → Gets moderator controls
   - Other participants → Limited controls

4. **Test moderator features:**
   - Mute all button
   - Kick participant
   - Enable lobby
   - Lock meeting

## 🔧 Troubleshooting

### Issue: "Meeting not loading"
- Check JITSI_DOMAIN in .env.local
- Verify JWT token generation
- Check browser console for errors

### Issue: "No moderator controls"
- Verify hostId matches logged-in user
- Check JWT token has moderator: true
- Ensure user joins first

### Issue: "Participants can't join"
- Check lobby is disabled initially
- Verify JWT authentication is working
- Check Prosody logs: `sudo journalctl -u prosody -f`

## 📚 Next Steps

1. **Add moderator UI controls** in JitsiMeeting component
2. **Create admin panel** for managing meetings
3. **Add recording functionality**
4. **Implement breakout rooms**
5. **Add meeting analytics**

## 🔗 Useful Links

- Jitsi Meet API: https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe
- JWT Authentication: https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-docker#authentication
- Configuration Options: https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-configuration

## 💡 Tips

- First person to join with valid JWT becomes moderator
- Use `moderators` array in Meeting schema to add co-hosts
- Test with multiple browser windows/incognito mode
- Monitor server resources if self-hosting
