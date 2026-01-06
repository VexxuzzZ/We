#!/usr/bin/env node

/**
 * ULTIMATE BOT SYSTEM - SETUP SCRIPT
 * Initializes the bot system with necessary configurations
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

console.clear();

// ASCII Art
console.log(`
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║   ██╗   ██╗██╗  ████████╗███╗   ███╗ █████╗ ████████╗███████╗           ║
║   ██║   ██║██║  ╚══██╔══╝████╗ ████║██╔══██╗╚══██╔══╝██╔════╝           ║
║   ██║   ██║██║     ██║   ██╔████╔██║███████║   ██║   █████╗             ║
║   ██║   ██║██║     ██║   ██║╚██╔╝██║██╔══██║   ██║   ██╔══╝             ║
║   ╚██████╔╝███████╗██║   ██║ ╚═╝ ██║██║  ██║   ██║   ███████╗           ║
║    ╚═════╝ ╚══════╝╚═╝   ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝           ║
║                                                                          ║
║                   ULTIMATE TELEGRAM BOT SYSTEM v2.0                      ║
║                     Installation & Configuration                         ║
╚══════════════════════════════════════════════════════════════════════════╝
`);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Default configurations
const defaultConfig = {
    bot: {
        token: "",
        owner_id: 0,
        admin_ids: [],
        webhook_url: "",
        polling_timeout: 60,
        max_connections: 100
    },
    security: {
        encryption_key: crypto.randomBytes(32).toString('hex'),
        jwt_secret: crypto.randomBytes(32).toString('hex'),
        otp_expiry_minutes: 10,
        max_otp_attempts: 3,
        session_timeout: 3600
    },
    database: {
        auto_backup: true,
        backup_interval: 3600,
        max_backups: 30,
        encryption: true
    },
    features: {
        ugly_mode: false,
        error_controller: true,
        auto_fix: true,
        encryption_mode: false,
        otp_system: true,
        anti_bypass: true
    },
    api: {
        port: 3000,
        enable_webhooks: false,
        rate_limit: 100,
        cors_origin: "*"
    }
};

// Check if config already exists
if (fs.existsSync('config.json')) {
    console.log("⚠️  Configuration file already exists!");
    rl.question("Do you want to overwrite? (y/N): ", (answer) => {
        if (answer.toLowerCase() === 'y') {
            startSetup();
        } else {
            console.log("Setup cancelled.");
            rl.close();
        }
    });
} else {
    startSetup();
}

function startSetup() {
    console.log("\n📋 SYSTEM SETUP");
    console.log("===============\n");
    
    rl.question("🤖 Enter your Telegram Bot Token: ", (botToken) => {
        defaultConfig.bot.token = botToken;
        
        rl.question("👑 Enter Owner ID (your Telegram ID): ", (ownerId) => {
            defaultConfig.bot.owner_id = parseInt(ownerId) || 0;
            
            rl.question("👥 Enter Admin IDs (comma-separated, optional): ", (adminIds) => {
                if (adminIds.trim()) {
                    defaultConfig.bot.admin_ids = adminIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
                }
                
                rl.question("🔑 Set Master Password (min 8 chars): ", (password) => {
                    if (password.length < 8) {
                        console.log("❌ Password must be at least 8 characters!");
                        rl.close();
                        return;
                    }
                    
                    // Create necessary directories
                    const dirs = ['backups', 'logs', 'temp', 'data'];
                    dirs.forEach(dir => {
                        if (!fs.existsSync(dir)) {
                            fs.mkdirSync(dir);
                            console.log(`📁 Created directory: ${dir}/`);
                        }
                    });
                    
                    // Save configuration
                    fs.writeFileSync('config.json', JSON.stringify(defaultConfig, null, 2));
                    
                    // Create encrypted password file
                    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
                    fs.writeFileSync('master.key', passwordHash);
                    
                    // Create initial database
                    const initialDB = {
                        users: [],
                        otp_records: [],
                        access_logs: [],
                        error_logs: [],
                        settings: {
                            ugly_mode: false,
                            auto_fix: true,
                            encryption_mode: false,
                            max_otp_attempts: 3,
                            otp_expiry_minutes: 10,
                            access_expiry_days: 30,
                            version: "2.0.0"
                        }
                    };
                    
                    fs.writeFileSync('users_db.json', JSON.stringify(initialDB, null, 2));
                    
                    // Create environment file
                    const envContent = `
# ULTIMATE TELEGRAM BOT SYSTEM
# Environment Configuration

BOT_TOKEN=${botToken}
OWNER_ID=${ownerId}
ENCRYPTION_KEY=${defaultConfig.security.encryption_key}
NODE_ENV=production
PORT=3000
WEBHOOK_URL=${defaultConfig.bot.webhook_url}
`;
                    
                    fs.writeFileSync('.env', envContent);
                    
                    // Create readme file
                    createReadme();
                    
                    console.log("\n✅ SETUP COMPLETED SUCCESSFULLY!");
                    console.log("\n📁 Generated Files:");
                    console.log("  - config.json          - Main configuration");
                    console.log("  - .env                 - Environment variables");
                    console.log("  - master.key           - Password hash");
                    console.log("  - users_db.json        - Initial database");
                    console.log("  - backups/             - Backup directory");
                    console.log("  - logs/                - Logs directory");
                    console.log("  - README.md            - Documentation");
                    
                    console.log("\n🚀 To start the bot:");
                    console.log("  1. Install dependencies: npm install");
                    console.log("  2. Run the bot: npm start");
                    console.log("  3. For development: npm run dev");
                    
                    console.log("\n⚠️  IMPORTANT SECURITY NOTES:");
                    console.log("  - Keep master.key file secure!");
                    console.log("  - Never share config.json!");
                    console.log("  - Regular backups are stored in backups/");
                    console.log("  - Check logs/ for error tracking");
                    
                    rl.close();
                });
            });
        });
    });
}

function createReadme() {
    const readmeContent = `# Ultimate Telegram Bot System v2.0

## 📋 Features
- ✅ 100+ Markdown Menus with Navigation
- ✅ Intelligent Error Controller with Auto-Fix
- ✅ AES-256 Encryption/Decryption System
- ✅ OTP Generation & Verification System
- ✅ User Access Expiry Management
- ✅ Anti-Bypass with Ugly Menu Mode
- ✅ Database Backup & Restore
- ✅ Real-time Monitoring & Logging
- ✅ Multi-user Support with Roles
- ✅ Webhook & API Support

## 🚀 Quick Start

### Prerequisites
- Node.js 14.0 or higher
- Telegram Bot Token from @BotFather
- Your Telegram User ID

### Installation
\`\`\`bash
# 1. Install dependencies
npm install

# 2. Run setup wizard
npm run setup

# 3. Start the bot
npm start

# 4. For development with auto-restart
npm run dev
\`\`\`

### First Time Setup
1. Get your bot token from @BotFather on Telegram
2. Get your user ID from @userinfobot
3. Run \`npm run setup\` and follow the prompts
4. Start the bot with \`npm start\`

## 📁 Project Structure
\`\`\`
├── index.js              # Main bot application
├── config.json           # Configuration file
├── users_db.json         # User database
├── master.key            # Password hash
├── backups/              # Database backups
├── logs/                 # System logs
├── package.json          # Dependencies
├── README.md             # This file
├── setup.js              # Setup wizard
├── backup.js             # Backup utility
├── restore.js            # Restore utility
├── monitor.js            # Monitoring tool
└── cleanup.js            # Cleanup utility
\`\`\`

## 🔧 Available Commands

### Bot Commands (Telegram)
- \`/start\` - Start bot and show main menu
- \`/menu\` - Display expanded menu (100+ options)
- \`/otp\` - Generate new OTP
- \`/verify <otp>\` - Verify OTP
- \`/error\` - Show error report
- \`/encrypt <text>\` - Encrypt text
- \`/decrypt <text>\` - Decrypt text
- \`/status\` - System status
- \`/help\` - Show help

### NPM Scripts
\`\`\`bash
npm start              # Start bot in production
npm run dev            # Start with nodemon (development)
npm run setup          # Run setup wizard
npm run backup         # Create manual backup
npm run restore        # Restore from backup
npm run test           # Run system tests
npm run clean          # Clean temporary files
npm run update         # Update dependencies
npm run monitor        # Start monitoring dashboard
\`\`\`

## 🔒 Security Features

### 1. Encryption System
- AES-256-CBC encryption
- Secure key management
- Automatic data encryption
- Encrypted backups

### 2. OTP Protection
- Time-based OTP (10 min expiry)
- 3 attempt limit
- Per-user OTP tracking
- Automatic expiry cleanup

### 3. Access Control
- User expiry management
- Role-based permissions
- Session timeout
- IP whitelisting (optional)

### 4. Anti-Bypass
- Ugly Menu Mode for unauthorized users
- Rate limiting
- Request validation
- Tamper detection

## 🛠️ Error Controller

The system includes an intelligent error controller that:
- Logs all errors with timestamps
- Attempts automatic fixes
- Provides error reports
- Maintains error history
- Suggests manual fixes

## 💾 Database Management

### Auto-backup
- Automatic hourly backups
- 30 backup retention
- Encrypted backup files
- Backup verification

### Manual Management
\`\`\`bash
# Create backup
npm run backup

# Restore from backup
npm run restore

# Clean old backups
npm run clean
\`\`\`

## 📊 Monitoring

### Real-time Monitoring
- CPU usage tracking
- Memory usage monitoring
- Error rate calculation
- User activity tracking

### Logging
- Error logs in \`logs/error.log\`
- Access logs in \`logs/access.log\`
- System logs in \`logs/system.log\`
- Rotating logs (daily)

## 🔧 Advanced Configuration

Edit \`config.json\` to customize:

### Bot Settings
\`\`\`json
{
    "bot": {
        "token": "8576202582:AAE9-kwUUURhka5upa7G1yx3TOcwvdhDwqc",
        "owner_id": 7807425271,
        "admin_ids": [7807425271],
        "polling_timeout": 60
    }
}
\`\`\`

### Security Settings
\`\`\`json
{
    "security": {
        "otp_expiry_minutes": 10,
        "max_otp_attempts": 3,
        "session_timeout": 3600
    }
}
\`\`\`

### Feature Toggles
\`\`\`json
{
    "features": {
        "ugly_mode": false,
        "error_controller": true,
        "auto_fix": true,
        "encryption_mode": false
    }
}
\`\`\`

## 🆘 Troubleshooting

### Common Issues

1. **Bot not starting**
   - Check bot token in config.json
   - Ensure Node.js version >= 14
   - Check internet connection

2. **Database errors**
   - Verify users_db.json permissions
   - Check disk space
   - Run \`npm run restore\` from backup

3. **OTP not working**
   - Check system time synchronization
   - Verify OTP expiry settings
   - Clear old OTPs with cleanup

4. **Encryption errors**
   - Ensure encryption_key exists in config
   - Check file permissions for master.key
   - Verify IV length consistency

### Emergency Recovery

1. **Bot locked out**
   - Remove users_db.json
   - Restart with \`npm start\`
   - Reconfigure with \`npm run setup\`

2. **Password lost**
   - Delete master.key file
   - Run \`npm run setup\` to create new
   - Update config.json with new settings

## 📞 Support

For issues and feature requests:
1. Check \`logs/error.log\` for details
2. Review configuration files
3. Create backup before making changes
4. Contact system administrator

## 📄 License

This is proprietary software. Unauthorized distribution is prohibited.

## 🔄 Update Log

### v2.0.0 (Current)
- Initial release with 100+ features
- Complete error controller system
- Enhanced security protocols
- Database management tools
- Monitoring and logging systems

---

**⚠️ SECURITY WARNING: Keep configuration files secure! Never commit .env, config.json, or master.key to public repositories.**
`;

    fs.writeFileSync('README.md', readmeContent);
    console.log("📄 Created README.md documentation");
}