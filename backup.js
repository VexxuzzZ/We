#!/usr/bin/env node

/**
 * ULTIMATE BOT SYSTEM - BACKUP UTILITY
 * Creates encrypted backups of the system
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const moment = require('moment');

console.log("🔐 ULTIMATE BOT SYSTEM - BACKUP UTILITY\n");

// Check if config exists
if (!fs.existsSync('config.json')) {
    console.error("❌ Configuration file not found!");
    console.log("Run 'npm run setup' first.");
    process.exit(1);
}

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const backupDir = 'backups';

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
}

function encryptBackup(data) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
        'aes-256-cbc',
        Buffer.from(config.security.encryption_key, 'hex'),
        iv
    );
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
        iv: iv.toString('hex'),
        data: encrypted,
        timestamp: new Date().toISOString()
    };
}

function createBackup() {
    console.log("📦 Creating system backup...");
    
    const backupData = {
        metadata: {
            version: "2.0.0",
            timestamp: new Date().toISOString(),
            system: "Ultimate Telegram Bot System"
        },
        database: fs.existsSync('users_db.json') ? 
            JSON.parse(fs.readFileSync('users_db.json', 'utf8')) : null,
        config: config,
        logs: {
            error: fs.existsSync('logs/error.log') ? 
                fs.readFileSync('logs/error.log', 'utf8') : '',
            system: fs.existsSync('logs/system.log') ? 
                fs.readFileSync('logs/system.log', 'utf8') : ''
        }
    };
    
    // Encrypt backup
    const encryptedBackup = encryptBackup(backupData);
    
    // Create backup filename
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const backupFile = path.join(backupDir, `backup_${timestamp}.ubk`);
    
    // Save backup
    fs.writeFileSync(backupFile, JSON.stringify(encryptedBackup, null, 2));
    
    // Create backup manifest
    const manifest = {
        filename: `backup_${timestamp}.ubk`,
        size: fs.statSync(backupFile).size,
        timestamp: new Date().toISOString(),
        checksum: crypto.createHash('sha256').update(JSON.stringify(encryptedBackup)).digest('hex')
    };
    
    // Update backup list
    let backupList = [];
    if (fs.existsSync(path.join(backupDir, 'manifest.json'))) {
        backupList = JSON.parse(fs.readFileSync(path.join(backupDir, 'manifest.json'), 'utf8'));
    }
    
    backupList.push(manifest);
    
    // Keep only last 30 backups
    if (backupList.length > 30) {
        const oldBackup = backupList.shift();
        if (fs.existsSync(path.join(backupDir, oldBackup.filename))) {
            fs.unlinkSync(path.join(backupDir, oldBackup.filename));
        }
    }
    
    fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(backupList, null, 2));
    
    console.log(`✅ Backup created: ${backupFile}`);
    console.log(`📊 Size: ${(manifest.size / 1024).toFixed(2)} KB`);
    console.log(`🔐 Checksum: ${manifest.checksum.substring(0, 16)}...`);
    console.log(`💾 Total backups: ${backupList.length}`);
    
    return backupFile;
}

function verifyBackup(backupFile) {
    console.log("🔍 Verifying backup integrity...");
    
    try {
        const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
        const calculatedChecksum = crypto.createHash('sha256').update(JSON.stringify(backupData)).digest('hex');
        
        // Check if backup is in manifest
        const manifest = JSON.parse(fs.readFileSync(path.join(backupDir, 'manifest.json'), 'utf8'));
        const backupInfo = manifest.find(b => b.filename === path.basename(backupFile));
        
        if (backupInfo && backupInfo.checksum === calculatedChecksum) {
            console.log("✅ Backup integrity verified!");
            return true;
        } else {
            console.log("⚠️ Backup verification failed!");
            return false;
        }
    } catch (error) {
        console.error("❌ Backup verification error:", error.message);
        return false;
    }
}

// Main execution
try {
    const backupFile = createBackup();
    verifyBackup(backupFile);
    
    console.log("\n🎉 Backup completed successfully!");
    console.log("📁 Backup stored in: backups/");
    console.log("📋 View backup list: backups/manifest.json");
} catch (error) {
    console.error("❌ Backup failed:", error.message);
    process.exit(1);
}