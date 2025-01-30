const request = require('supertest');
const app = require('../app');
const User = require('../model/UserModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

describe('Password Change Tests', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
        const hashedPassword = await bcrypt.hash('currentPassword123', 10);
        testUser = await User.create({
            name: 'Test',
            lastname: 'User',
            email: 'test@example.com',
            password: hashedPassword,
            is_verified: true
        });

        authToken = jwt.sign(
            { userId: testUser.id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
    });

    afterEach(async () => {
        // Cleanup
        await User.destroy({
            where: { email: 'test@example.com' }
        });
    });

    test('Should successfully change password with correct credentials', async () => {
        const response = await request(app)
            .post('/auth/change-password')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                currentPassword: 'currentPassword123',
                newPassword: 'newPassword123'
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Password updated successfully');

        const updatedUser = await User.findByPk(testUser.id);
        const passwordIsValid = await bcrypt.compare('newPassword123', updatedUser.password);
        expect(passwordIsValid).toBe(true);
    });

    test('Should fail with incorrect current password', async () => {
        const response = await request(app)
            .post('/auth/change-password')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                currentPassword: 'wrongPassword',
                newPassword: 'newPassword123'
            });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Current password is incorrect');
    });

    test('Should fail without authentication', async () => {
        const response = await request(app)
            .post('/auth/change-password')
            .send({
                currentPassword: 'currentPassword123',
                newPassword: 'newPassword123'
            });

        expect(response.status).toBe(401);
    });

    test('Should fail with invalid new password format', async () => {
        const response = await request(app)
            .post('/auth/change-password')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                currentPassword: 'currentPassword123',
                newPassword: '123'
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });
});
