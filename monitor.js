#!/usr/bin/env node

/**
 * ULTIMATE BOT SYSTEM - MONITORING DASHBOARD
 * Real-time system monitoring and statistics
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const moment = require('moment');
const chalk = require('chalk');

console.clear();

// ASCII Dashboard Header
console.log(chalk.blue(`
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   ███╗   ███╗ ██████╗ ███╗   ██╗██╗████████╗ ██████╗ ██████╗    ║
║   ████╗ ████║██╔═══██╗████╗  ██║██║╚══██╔══╝██╔═══██╗██╔══██╗   ║
║   ██╔████╔██║██║   ██║██╔██╗ ██║██║   ██║   ██║   ██║██████╔╝   ║
║   ██║╚██╔╝██║██║   ██║██║╚██╗██║██║   ██║   ██║   ██║██╔══██╗   ║
║   ██║ ╚═╝ ██║╚██████╔╝██║ ╚████║██║   ██║   ╚██████╔╝██║  ██║   ║
║   ╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝   ║
║                                                                  ║
║               ULTIMATE BOT SYSTEM - MONITOR v2.0                 ║
╚══════════════════════════════════════════════════════════════════╝
`));

class SystemMonitor {
    constructor() {
        this.startTime = new Date();
        this.refreshInterval = 5000; // 5 seconds
        this.metrics = {
            system: {},
            bot: {},
            database: {},
            security: {},
            errors: {}
        };
    }
    
    collectSystemMetrics() {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        
        this.metrics.system = {
            uptime: os.uptime(),
            loadAvg: os.loadavg(),
            memory: {
                total: (totalMem / 1024 / 1024).toFixed(2) + ' MB',
                used: (usedMem / 1024 / 1024).toFixed(2) + ' MB',
                free: (freeMem / 1024 / 1024).toFixed(2) + ' MB',
                usage: ((usedMem / totalMem) * 100).toFixed(2) + '%'
            },
            cpu: os.cpus().length,
            platform: os.platform(),
            arch: os.arch()
        };
    }
    
    collectBotMetrics() {
        try {
            if (!fs.existsSync('users_db.json')) {
                this.metrics.bot = { error: 'Database not found' };
                return;
            }
            
            const db = JSON.parse(fs.readFileSync('users_db.json', 'utf8'));
            
            this.metrics.bot = {
                totalUsers: db.users.length,
                activeUsers: db.users.filter(u => !u.expired).length,
                otpRecords: db.otp_records.length,
                errorLogs: db.error_logs.length,
                activeOTPs: db.otp_records.filter(o => !o.used && new Date(o.expiresAt) > new Date()).length
            };
        } catch (error) {
            this.metrics.bot = { error: error.message };
        }
    }
    
    collectSecurityMetrics() {
        try {
            if (!fs.existsSync('logs/error.log')) {
                this.metrics.security = { error: 'Logs not found' };
                return;
            }
            
            const logs = fs.readFileSync('logs/error.log', 'utf8');
            const lines = logs.split('\n').filter(l => l.trim());
            
            this.metrics.security = {
                totalErrors: lines.length,
                last24h: lines.filter(l => {
                    const logTime = new Date(l.split(' | ')[0]);
                    return (new Date() - logTime) < 24 * 60 * 60 * 1000;
                }).length,
                securityErrors: lines.filter(l => l.includes('SECURITY') || l.includes('ACCESS')).length
            };
        } catch (error) {
            this.metrics.security = { error: error.message };
        }
    }
    
    collectDatabaseMetrics() {
        try {
            if (!fs.existsSync('users_db.json')) {
                this.metrics.database = { error: 'Database not found' };
                return;
            }
            
            const stats = fs.statSync('users_db.json');
            const db = JSON.parse(fs.readFileSync('users_db.json', 'utf8'));
            
            this.metrics.database = {
                size: (stats.size / 1024).toFixed(2) + ' KB',
                lastModified: stats.mtime,
                collections: Object.keys(db).length,
                totalRecords: Object.values(db).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
            };
        } catch (error) {
            this.metrics.database = { error: error.message };
        }
    }
    
    displayDashboard() {
        console.clear();
        
        // Header
        console.log(chalk.blue.bold('\n📊 REAL-TIME SYSTEM MONITOR\n'));
        console.log(chalk.gray(`Last updated: ${new Date().toLocaleTimeString()}`));
        console.log(chalk.gray('─'.repeat(80)));
        
        // System Metrics
        console.log(chalk.yellow.bold('\n🖥️  SYSTEM METRICS'));
        console.log(chalk.gray('├─ CPU Cores:'), chalk.cyan(this.metrics.system.cpu || 'N/A'));
        console.log(chalk.gray('├─ Memory Usage:'), chalk.cyan(this.metrics.system.memory?.usage || 'N/A'));
        console.log(chalk.gray('├─ System Uptime:'), chalk.cyan(this.formatUptime(this.metrics.system.uptime)));
        console.log(chalk.gray('└─ Load Average:'), chalk.cyan(this.metrics.system.loadAvg?.map(l => l.toFixed(2)).join(', ') || 'N/A'));
        
        // Bot Metrics
        console.log(chalk.yellow.bold('\n🤖 BOT METRICS'));
        console.log(chalk.gray('├─ Total Users:'), chalk.cyan(this.metrics.bot.totalUsers || 0));
        console.log(chalk.gray('├─ Active Users:'), chalk.cyan(this.metrics.bot.activeUsers || 0));
        console.log(chalk.gray('├─ Active OTPs:'), chalk.cyan(this.metrics.bot.activeOTPs || 0));
        console.log(chalk.gray('└─ Error Logs:'), chalk.cyan(this.metrics.bot.errorLogs || 0));
        
        // Database Metrics
        console.log(chalk.yellow.bold('\n💾 DATABASE METRICS'));
        console.log(chalk.gray('├─ Database Size:'), chalk.cyan(this.metrics.database.size || 'N/A'));
        console.log(chalk.gray('├─ Total Records:'), chalk.cyan(this.metrics.database.totalRecords || 0));
        console.log(chalk.gray('├─ Collections:'), chalk.cyan(this.metrics.database.collections || 0));
        if (this.metrics.database.lastModified) {
            console.log(chalk.gray('└─ Last Modified:'), chalk.cyan(moment(this.metrics.database.lastModified).fromNow()));
        }
        
        // Security Metrics
        console.log(chalk.yellow.bold('\n🔒 SECURITY METRICS'));
        console.log(chalk.gray('├─ Total Errors:'), chalk.cyan(this.metrics.security.totalErrors || 0));
        console.log(chalk.gray('├─ Last 24h Errors:'), chalk.cyan(this.metrics.security.last24h || 0));
        console.log(chalk.gray('└─ Security Errors:'), chalk.cyan(this.metrics.security.securityErrors || 0));
        
        // Warnings
        console.log(chalk.yellow.bold('\n⚠️  WARNINGS'));
        this.displayWarnings();
        
        // Footer
        console.log(chalk.gray('\n' + '─'.repeat(80)));
        console.log(chalk.gray('Press Ctrl+C to exit | Auto-refresh every 5 seconds'));
    }
    
    displayWarnings() {
        const warnings = [];
        
        // Memory warning
        if (this.metrics.system.memory && this.metrics.system.memory.usage) {
            const usage = parseFloat(this.metrics.system.memory.usage);
            if (usage > 90) {
                warnings.push(chalk.red(`High memory usage: ${usage}%`));
            } else if (usage > 80) {
                warnings.push(chalk.yellow(`Moderate memory usage: ${usage}%`));
            }
        }
        
        // Database size warning
        if (this.metrics.database.size) {
            const sizeMB = parseFloat(this.metrics.database.size);
            if (sizeMB > 1024) {
                warnings.push(chalk.red(`Large database size: ${sizeMB} MB`));
            }
        }
        
        // Error rate warning
        if (this.metrics.security.last24h > 100) {
            warnings.push(chalk.red(`High error rate: ${this.metrics.security.last24h} errors in 24h`));
        }
        
        if (warnings.length === 0) {
            console.log(chalk.green('✅ All systems normal'));
        } else {
            warnings.forEach(warning => console.log('•', warning));
        }
    }
    
    formatUptime(seconds) {
        const days = Math.floor(seconds / (24 * 60 * 60));
        const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((seconds % (60 * 60)) / 60);
        
        return `${days}d ${hours}h ${minutes}m`;
    }
    
    startMonitoring() {
        console.log(chalk.green('🚀 Starting system monitor...\n'));
        
        // Initial collection
        this.collectSystemMetrics();
        this.collectBotMetrics();
        this.collectSecurityMetrics();
        this.collectDatabaseMetrics();
        this.displayDashboard();
        
        // Set up interval for updates
        this.interval = setInterval(() => {
            this.collectSystemMetrics();
            this.collectBotMetrics();
            this.collectSecurityMetrics();
            this.collectDatabaseMetrics();
            this.displayDashboard();
        }, this.refreshInterval);
    }
    
    stopMonitoring() {
        if (this.interval) {
            clearInterval(this.interval);
        }
        console.log(chalk.yellow('\n👋 Monitoring stopped.'));
        process.exit(0);
    }
}

// Start monitoring
const monitor = new SystemMonitor();

// Handle Ctrl+C
process.on('SIGINT', () => {
    monitor.stopMonitoring();
});

// Start the monitoring
monitor.startMonitoring();