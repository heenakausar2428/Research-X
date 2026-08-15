import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding research database...');

  // Hash passwords
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // Clear existing users to start clean
  await prisma.projectCollaborator.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});

  // Seed Researcher 1 (Project Owner)
  const user1 = await prisma.user.create({
    data: {
      email: 'researcher1@example.com',
      name: 'Dr. Evelyn Carter',
      password: passwordHash,
      phone: '1234567890',
    },
  });
  console.log(`Seeded User: ${user1.email}`);

  // Seed Researcher 2 (Project Editor)
  const user2 = await prisma.user.create({
    data: {
      email: 'researcher2@example.com',
      name: 'Liam Vance',
      password: passwordHash,
      phone: '0987654321',
    },
  });
  console.log(`Seeded User: ${user2.email}`);

  // Seed Researcher 3 (Viewer)
  const user3 = await prisma.user.create({
    data: {
      email: 'researcher3@example.com',
      name: 'Sarah Chen',
      password: passwordHash,
      phone: '1122334455',
    },
  });
  console.log(`Seeded User: ${user3.email}`);

  // Create a research project owned by Dr. Evelyn Carter (user1)
  const project = await prisma.project.create({
    data: {
      title: 'Quantum Neural Interfaces',
      description: 'Developing high-throughput bi-directional interfaces mapping neural circuits to quantum processors.',
      goal: 'Achieve microsecond signal translation accuracy with under 0.05% error rate.',
      status: 'ACTIVE',
      ownerId: user1.id,
    },
  });
  console.log(`Seeded Project: ${project.title}`);

  // Add collaborator entries:
  // Evelyn Carter is the OWNER
  await prisma.projectCollaborator.create({
    data: {
      projectId: project.id,
      userId: user1.id,
      role: 'OWNER',
    },
  });

  // Liam Vance is an EDITOR
  await prisma.projectCollaborator.create({
    data: {
      projectId: project.id,
      userId: user2.id,
      role: 'EDITOR',
    },
  });

  // Sarah Chen is a VIEWER
  await prisma.projectCollaborator.create({
    data: {
      projectId: project.id,
      userId: user3.id,
      role: 'VIEWER',
    },
  });

  console.log('Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
