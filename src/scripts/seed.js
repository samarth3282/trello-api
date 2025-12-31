require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Project = require('../models/Project');
const Board = require('../models/Board');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const logger = require('../utils/logger');

const seedData = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        logger.info('MongoDB Connected for seeding');

        // Clear existing data
        await User.deleteMany({});
        await Project.deleteMany({});
        await Board.deleteMany({});
        await Task.deleteMany({});
        await Comment.deleteMany({});
        logger.info('Cleared existing data');

        // Create users
        const users = await User.create([
            {
                name: 'Admin User',
                email: 'admin@example.com',
                password: await bcrypt.hash('Admin123!', 10),
                role: 'admin',
                emailVerified: true,
            },
            {
                name: 'John Manager',
                email: 'john@example.com',
                password: await bcrypt.hash('Manager123!', 10),
                role: 'manager',
                emailVerified: true,
            },
            {
                name: 'Jane Developer',
                email: 'jane@example.com',
                password: await bcrypt.hash('Developer123!', 10),
                role: 'member',
                emailVerified: true,
            },
            {
                name: 'Bob Tester',
                email: 'bob@example.com',
                password: await bcrypt.hash('Tester123!', 10),
                role: 'member',
                emailVerified: true,
            },
        ]);

        logger.info(`Created ${users.length} users`);

        // Create projects
        const projects = await Project.create([
            {
                name: 'Website Redesign',
                description: 'Complete redesign of company website with modern UI/UX',
                owner: users[0]._id,
                members: [
                    { user: users[0]._id, role: 'admin' },
                    { user: users[1]._id, role: 'manager' },
                    { user: users[2]._id, role: 'member' },
                ],
                color: '#3498db',
            },
            {
                name: 'Mobile App Development',
                description: 'Native mobile application for iOS and Android',
                owner: users[1]._id,
                members: [
                    { user: users[1]._id, role: 'admin' },
                    { user: users[2]._id, role: 'member' },
                    { user: users[3]._id, role: 'member' },
                ],
                color: '#e74c3c',
            },
            {
                name: 'API Integration',
                description: 'Integrate third-party APIs for payment and analytics',
                owner: users[0]._id,
                members: [
                    { user: users[0]._id, role: 'admin' },
                    { user: users[2]._id, role: 'manager' },
                ],
                color: '#2ecc71',
            },
        ]);

        logger.info(`Created ${projects.length} projects`);

        // Create boards
        const boards = [];
        for (const project of projects) {
            const projectBoards = await Board.create([
                {
                    name: 'Backlog',
                    description: 'Tasks to be prioritized',
                    project: project._id,
                    order: 1,
                    color: '#95a5a6',
                },
                {
                    name: 'Sprint 1',
                    description: 'Current sprint tasks',
                    project: project._id,
                    order: 2,
                    color: '#3498db',
                },
                {
                    name: 'In Progress',
                    description: 'Tasks currently being worked on',
                    project: project._id,
                    order: 3,
                    color: '#f39c12',
                },
                {
                    name: 'Completed',
                    description: 'Finished tasks',
                    project: project._id,
                    order: 4,
                    color: '#27ae60',
                },
            ]);
            boards.push(...projectBoards);
        }

        logger.info(`Created ${boards.length} boards`);

        // Create tasks
        const taskTemplates = [
            {
                title: 'Design homepage mockup',
                description: 'Create high-fidelity mockups for the new homepage design',
                status: 'todo',
                priority: 'high',
            },
            {
                title: 'Implement user authentication',
                description: 'Add JWT-based authentication with refresh tokens',
                status: 'in-progress',
                priority: 'urgent',
            },
            {
                title: 'Write API documentation',
                description: 'Document all API endpoints with examples',
                status: 'review',
                priority: 'medium',
            },
            {
                title: 'Set up CI/CD pipeline',
                description: 'Configure automated testing and deployment',
                status: 'done',
                priority: 'high',
            },
            {
                title: 'Database optimization',
                description: 'Add indexes and optimize slow queries',
                status: 'todo',
                priority: 'medium',
            },
            {
                title: 'Mobile responsive design',
                description: 'Ensure all pages work well on mobile devices',
                status: 'in-progress',
                priority: 'high',
            },
        ];

        const tasks = [];
        for (const board of boards) {
            for (let i = 0; i < 3; i++) {
                const template = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
                const assignedUser = users[Math.floor(Math.random() * users.length)];
                const createdUser = users[Math.floor(Math.random() * users.length)];

                const task = await Task.create({
                    ...template,
                    title: `${template.title} - ${board.name}`,
                    board: board._id,
                    assignedTo: assignedUser._id,
                    createdBy: createdUser._id,
                    dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
                    tags: ['backend', 'frontend', 'design', 'testing'][Math.floor(Math.random() * 4)],
                    order: i + 1,
                });
                tasks.push(task);
            }
        }

        logger.info(`Created ${tasks.length} tasks`);

        // Create comments
        const comments = [];
        for (const task of tasks.slice(0, 10)) {
            const comment = await Comment.create({
                content: `This is a comment on task: ${task.title}`,
                task: task._id,
                author: users[Math.floor(Math.random() * users.length)]._id,
            });
            comments.push(comment);
        }

        logger.info(`Created ${comments.length} comments`);

        logger.info('✅ Database seeded successfully!');
        logger.info('\n📧 Test Credentials:');
        logger.info('Admin: admin@example.com / Admin123!');
        logger.info('Manager: john@example.com / Manager123!');
        logger.info('Member: jane@example.com / Developer123!');
        logger.info('Member: bob@example.com / Tester123!\n');

        process.exit(0);
    } catch (error) {
        logger.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedData();
