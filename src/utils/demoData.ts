import { TaskReminder } from '../types';

export function generateDemoTasks(): TaskReminder[] {
  const now = new Date();

  // Helper to add days / hours relative to now
  const addHours = (hours: number) => {
    return new Date(now.getTime() + hours * 3600 * 1000).toISOString();
  };

  const addDays = (days: number, setHour = 17) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(setHour, 0, 0, 0);
    return d.toISOString();
  };

  return [
    {
      id: 'demo-task-1',
      title: 'Global AI & Web3 Hackathon 🚀',
      category: 'hackathon',
      deadline: addDays(2, 21), // in 2 days at 9:00 PM
      priority: 'high',
      notes: 'Building an autonomous research assistant on decentralized storage. Team checkpoint on Discord every evening.',
      link: 'https://devpost.com',
      reminderTimes: [
        { preset: '1_day' },
        { preset: '1_hour' },
      ],
      repeat: 'weekly',
      checklist: [
        { id: 'c1', text: 'Confirm team members & role allocation', completed: true },
        { id: 'c2', text: 'Prepare architecture proposal & API keys', completed: true },
        { id: 'c3', text: 'Create 3-minute video presentation & slides', completed: false },
        { id: 'c4', text: 'Submit final project repo to Devpost', completed: false },
      ],
      completed: false,
      createdAt: new Date(now.getTime() - 86400000 * 3).toISOString(),
      updatedAt: now.toISOString(),
      completionHistory: [],
    },
    {
      id: 'demo-task-2',
      title: 'Distributed Systems Lab Report 📝',
      category: 'submission',
      deadline: addHours(4), // Due today in 4 hours!
      priority: 'high',
      notes: 'Upload compiled PDF with benchmark charts comparing Raft and Paxos consensus latencies.',
      link: 'https://classroom.google.com',
      reminderTimes: [
        { preset: '1_hour' },
      ],
      repeat: 'never',
      checklist: [
        { id: 'c5', text: 'Benchmark cluster node failure latencies', completed: true },
        { id: 'c6', text: 'Draw topology diagram with Mermaid/Figma', completed: true },
        { id: 'c7', text: 'Export LaTeX document to IEEE PDF', completed: false },
      ],
      completed: false,
      createdAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'demo-task-3',
      title: 'Advanced Calculus Midterm Exam 📚',
      category: 'exam',
      deadline: addDays(4, 9), // in 4 days at 9:00 AM
      priority: 'high',
      notes: 'Room 304, Engineering Hall. Topics: Multivariable Taylor series, Stokes Theorem, Green Theorem.',
      reminderTimes: [
        { preset: '1_week' },
        { preset: '1_day' },
        { preset: '1_hour' },
      ],
      repeat: 'never',
      checklist: [
        { id: 'c8', text: 'Solve past exam papers from 2024 and 2025', completed: true },
        { id: 'c9', text: 'Prepare formula cheat sheet for quick recall', completed: false },
        { id: 'c10', text: 'Pack approved scientific calculator & spare pens', completed: false },
      ],
      completed: false,
      createdAt: new Date(now.getTime() - 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'demo-task-4',
      title: 'Summer Research Fellowship Application 🌱',
      category: 'personal',
      deadline: addDays(10, 18), // in 10 days
      priority: 'normal',
      notes: 'Undergraduate research fellowship funding for summer term. Submit academic transcript and statement.',
      link: 'https://university.edu/fellowship-portal',
      reminderTimes: [
        { preset: '1_week' },
        { preset: '1_day' },
      ],
      repeat: 'monthly',
      checklist: [
        { id: 'c11', text: 'Request professor recommendation letter', completed: true },
        { id: 'c12', text: 'Draft 1-page Statement of Purpose', completed: false },
        { id: 'c13', text: 'Order official e-transcript from registrar', completed: false },
      ],
      completed: false,
      createdAt: new Date(now.getTime() - 86400000 * 5).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'demo-task-5',
      title: 'Course Fee Payment Receipt Upload 📝',
      category: 'submission',
      deadline: addHours(-5), // Overdue by 5 hours! Demonstrates overdue UX
      priority: 'normal',
      notes: 'Upload the semester bank challan or transaction ID on the student portal.',
      link: 'https://portal.student.ac.in',
      reminderTimes: [
        { preset: '1_day' },
      ],
      repeat: 'never',
      checklist: [
        { id: 'c14', text: 'Download payment confirmation PDF', completed: true },
        { id: 'c15', text: 'Upload to portal finance section', completed: false },
      ],
      completed: false,
      createdAt: new Date(now.getTime() - 86400000 * 4).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'demo-task-6',
      title: 'Open Source Pull Request Review 🚀',
      category: 'hackathon',
      deadline: addDays(-1, 14), // Completed task sample
      priority: 'low',
      notes: 'Reviewed community PR for the hackathon starter template repository.',
      link: 'https://github.com',
      reminderTimes: [],
      repeat: 'weekly',
      checklist: [
        { id: 'c16', text: 'Checkout pull request branch locally', completed: true },
        { id: 'c17', text: 'Run test suite and verify UI', completed: true },
        { id: 'c18', text: 'Leave constructive code review', completed: true },
      ],
      completed: true,
      completedAt: addDays(-1, 15),
      createdAt: new Date(now.getTime() - 86400000 * 6).toISOString(),
      updatedAt: now.toISOString(),
      completionHistory: [addDays(-1, 15)],
    },
  ];
}
