const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const password = await bcrypt.hash('Password123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@boardify.dev' },
    update: {},
    create: {
      email: 'demo@boardify.dev',
      password,
      name: 'Demo User',
    },
  });

  console.log(`Created user: ${user.email}`);

  // Create demo board
  const board = await prisma.board.upsert({
    where: { slug: 'my-startup' },
    update: {},
    create: {
      name: 'My Startup',
      slug: 'my-startup',
      description: 'Public feedback board for My Startup. Vote on features you want to see!',
      ownerId: user.id,
      accentColor: '#6366f1',
    },
  });

  console.log(`Created board: ${board.slug}`);

  // Create demo posts
  const posts = [
    {
      title: 'Dark mode support',
      description: 'It would be great to have a dark mode option for the dashboard.',
      category: 'UI',
      upvoteCount: 42,
    },
    {
      title: 'Export data to CSV',
      description: 'Allow users to export their feedback data to a CSV file for analysis.',
      category: 'Feature',
      status: 'PLANNED',
      upvoteCount: 38,
    },
    {
      title: 'Slack integration',
      description: 'Send notifications to a Slack channel when new feedback is submitted.',
      category: 'Integrations',
      status: 'UNDER_REVIEW',
      upvoteCount: 27,
    },
    {
      title: 'Custom domain for public boards',
      description: 'Allow setting a custom subdomain like feedback.mycompany.com.',
      category: 'Feature',
      upvoteCount: 19,
    },
    {
      title: 'Mobile app',
      description: 'A native mobile app would make it easier to manage feedback on the go.',
      category: 'Feature',
      upvoteCount: 15,
    },
  ];

  for (const postData of posts) {
    await prisma.post.create({
      data: {
        ...postData,
        boardId: board.id,
        authorId: user.id,
        status: postData.status || 'OPEN',
      },
    });
  }

  console.log(`Created ${posts.length} posts`);
  console.log('\n✅ Seed complete!');
  console.log('   Email: demo@boardify.dev');
  console.log('   Password: Password123');
  console.log(`   Board URL: /board/${board.slug}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
