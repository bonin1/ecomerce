const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');
const PDFDocument = require('pdfkit');
const User = require('../../../model/UserModel');
const UserActivityLog = require('../../../model/UserActivityLogModel');
const { logUserActivity } = require('./ActivityLogOperations');
const archiver = require('archiver');
const { v4: uuidv4 } = require('uuid');

exports.exportUserData = async (req, res) => {
    try {
        const userId = req.user.id;
        const { formats } = req.body;
        
        if (!formats || !formats.length) {
            return res.status(400).json({
                status: 'error',
                message: 'You must specify at least one export format'
            });
        }
        
        const user = await User.findByPk(userId, {
            attributes: {
                exclude: ['password', 'two_factor_secret', 'passwordResetToken', 
                         'passwordResetExpires', 'verificationToken', 'otp', 'otpExpires']
            }
        });
        
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }
        
        const activities = await UserActivityLog.findAll({
            where: { user_id: userId },
            order: [['createdAt', 'DESC']]
        });
        
        const parsedActivities = activities.map(activity => {
            const item = activity.toJSON();
            try {
                item.details = JSON.parse(item.details);
            } catch (e) {
                item.details = {};
            }
            return item;
        });
        
        const userData = user.toJSON();
        if (userData.profile_picture && Buffer.isBuffer(userData.profile_picture)) {
            userData.profile_picture = `data:image/jpeg;base64,${userData.profile_picture.toString('base64')}`;
        }
        
        const exportId = uuidv4();
        const exportDir = path.join(__dirname, '../../../exports', exportId);
        fs.mkdirSync(exportDir, { recursive: true });
        
        const filePaths = [];
        
        if (formats.includes('json')) {
            const jsonPath = path.join(exportDir, 'profile-data.json');
            fs.writeFileSync(jsonPath, JSON.stringify({ 
                user: userData, 
                activities: parsedActivities 
            }, null, 2));
            filePaths.push(jsonPath);
        }
        
        if (formats.includes('csv')) {
            const csvPath = path.join(exportDir, 'profile-data.csv');
            const flattenedUser = { ...userData };
            
            if (flattenedUser.profile_picture) {
                delete flattenedUser.profile_picture; 
            }
            
            const csvWriter = createObjectCsvWriter({
                path: csvPath,
                header: Object.keys(flattenedUser).map(key => ({ id: key, title: key }))
            });
            
            await csvWriter.writeRecords([flattenedUser]);
            filePaths.push(csvPath);
            
            const activitiesCsvPath = path.join(exportDir, 'activities.csv');
            const activityWriter = createObjectCsvWriter({
                path: activitiesCsvPath,
                header: [
                    { id: 'id', title: 'ID' },
                    { id: 'activity_type', title: 'Activity Type' },
                    { id: 'message', title: 'Message' },
                    { id: 'createdAt', title: 'Date' },
                    { id: 'ip_address', title: 'IP Address' }
                ]
            });
            
            await activityWriter.writeRecords(parsedActivities.map(a => ({
                id: a.id,
                activity_type: a.activity_type,
                message: a.details?.message || '',
                createdAt: a.createdAt,
                ip_address: a.ip_address
            })));
            
            filePaths.push(activitiesCsvPath);
        }
        
        if (formats.includes('pdf')) {
            const pdfPath = path.join(exportDir, 'profile-data.pdf');
            const doc = new PDFDocument({ margin: 50 });
            
            doc.pipe(fs.createWriteStream(pdfPath));
            
            doc.fontSize(25).text('User Profile Data', { align: 'center' });
            doc.moveDown();
            doc.fontSize(14);
            
            Object.entries(userData).forEach(([key, value]) => {
                if (key === 'profile_picture') return; 
                doc.text(`${key}: ${value}`);
            });
            
            doc.moveDown(2);
            doc.fontSize(18).text('Activity History');
            doc.moveDown();
            
            parsedActivities.forEach((activity, i) => {
                doc.fontSize(12)
                   .text(`${i+1}. ${activity.activity_type} - ${new Date(activity.createdAt).toLocaleString()}`);
                doc.fontSize(10)
                   .text(`Message: ${activity.details?.message || 'Activity recorded'}`)
                   .text(`IP: ${activity.ip_address || 'N/A'}`)
                   .moveDown(0.5);
                
                if (i % 5 === 4) doc.addPage(); 
            });
            
            doc.end();
            filePaths.push(pdfPath);
        }
        
        const zipPath = path.join(exportDir, 'profile-data.zip');
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        archive.pipe(output);
        
        filePaths.forEach(filePath => {
            archive.file(filePath, { name: path.basename(filePath) });
        });
        
        await new Promise((resolve, reject) => {
            output.on('close', resolve);
            archive.on('error', reject);
            archive.finalize();
        });
        
        await logUserActivity(
            userId,
            'DATA_EXPORT',
            { message: `Data exported in ${formats.join(', ')} format${formats.length > 1 ? 's' : ''}` },
            req.ip,
            req.headers['user-agent']
        );
        
        const downloadUrl = `/api/downloads/${exportId}/profile-data.zip`;
        
        res.status(200).json({
            status: 'success',
            message: 'Data export successful',
            data: {
                downloadUrl,
                filename: 'profile-data.zip'
            }
        });
        
    } catch (error) {
        console.error('Error exporting user data:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error exporting data',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
