# Jitsi Server Configuration for Moderator Controls

## 1. Edit Jitsi Meet Config (on your Jitsi server)

File: `/etc/jitsi/meet/[your-domain]-config.js`

Add these configurations:

```javascript
var config = {
    // Enable lobby/waiting room
    enableLobbyChat: true,
    
    // Moderator controls
    disableRemoteMute: false, // Allow moderators to mute others
    
    // Require moderator to start meeting
    startWithAudioMuted: true,
    startWithVideoMuted: true,
    
    // Disable features for non-moderators
    disableInviteFunctions: true,
    
    // Enable recording (moderator only)
    fileRecordingsEnabled: true,
    liveStreamingEnabled: false,
    
    // Security
    enableInsecureRoomNameWarning: true,
    
    // Lobby mode
    prejoinConfig: {
        enabled: true,
        hideDisplayName: false,
        hideExtraJoinButtons: ['no-audio', 'by-phone']
    }
};
```

## 2. Edit Prosody Config (XMPP server)

File: `/etc/prosody/conf.avail/[your-domain].cfg.lua`

Add JWT authentication:

```lua
VirtualHost "meet.yourdomain.com"
    authentication = "token"
    app_id = "your_app_id"
    app_secret = "your_app_secret"
    allow_empty_token = false

VirtualHost "guest.meet.yourdomain.com"
    authentication = "anonymous"
    c2s_require_encryption = false
```

## 3. Edit Jicofo Config (Focus component)

File: `/etc/jitsi/jicofo/jicofo.conf`

```hocon
jicofo {
  authentication {
    enabled = true
    type = JWT
    login-url = "meet.yourdomain.com"
  }
  
  conference {
    enable-auto-owner = false
  }
}
```

## 4. Restart Services

```bash
sudo systemctl restart prosody
sudo systemctl restart jicofo
sudo systemctl restart jitsi-videobridge2
sudo systemctl restart nginx
```

## 5. Test Moderator Features

Once configured, the first person to join with a valid JWT token becomes the moderator.
