import { prisma } from '../src/lib/prisma.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    const password = await bcrypt.hash('password123', 12);

    // 1. Create 7 users
    const usersData = [
      { username: 'alice', email: 'alice@example.com', password },
      { username: 'bob', email: 'bob@example.com', password },
      { username: 'charlie', email: 'charlie@example.com', password },
      { username: 'david', email: 'david@example.com', password },
      { username: 'eve', email: 'eve@example.com', password },
      { username: 'frank', email: 'frank@example.com', password },
      { username: 'grace', email: 'grace@example.com', password },
    ];

    const users = [];
    for (const data of usersData) {
      const user = await prisma.user.upsert({
        where: { email: data.email },
        update: {},
        create: data,
      });
      users.push(user);
    }

    console.log(`✅ Created ${users.length} users.`);

    // 2. Create "Community Forum" with 3 users (Alice, Bob, Charlie)
    const room1 = await prisma.room.upsert({
      where: { id: 'community-forum' }, // Use stable ID for upsert
      update: { name: 'Community Forum' },
      create: {
        id: 'community-forum',
        name: 'Community Forum',
        description: 'A place for everyone to chat.',
      }
    });

    for (let i = 0; i < 3; i++) {
      await prisma.roomMember.upsert({
        where: { userId_roomId: { userId: users[i].id, roomId: room1.id } },
        update: {},
        create: { userId: users[i].id, roomId: room1.id }
      });
    }

    console.log('✅ Created Community Forum with 3 members.');

    // 3. Create "Developers Forum" with 4 users (David, Eve, Frank, Grace)
    const room2 = await prisma.room.upsert({
      where: { id: 'developers-forum' },
      update: { name: 'Developers Forum' },
      create: {
        id: 'developers-forum',
        name: 'Developers Forum',
        description: 'Technical discussions and debugging.',
      }
    });

    for (let i = 3; i < 7; i++) {
      await prisma.roomMember.upsert({
        where: { userId_roomId: { userId: users[i].id, roomId: room2.id } },
        update: {},
        create: { userId: users[i].id, roomId: room2.id }
      });
    }

    console.log('✅ Created Developers Forum with 4 members.');
    console.log('✨ Seeding complete!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
