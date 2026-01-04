import { PrismaClient, Role, JobStatus, InvitationStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create company
  const company = await prisma.company.create({
    data: {
      name: "TechCorp Inc.",
      logoUrl: null,
    },
  });
  console.log("Created company:", company.name);

  // Create recruiter user
  const hashedPassword = await bcrypt.hash("password123", 10);
  const recruiterUser = await prisma.user.create({
    data: {
      email: "recruiter@techcorp.com",
      name: "Sarah Johnson",
      passwordHash: hashedPassword,
      role: Role.RECRUITER,
    },
  });

  const recruiter = await prisma.recruiter.create({
    data: {
      userId: recruiterUser.id,
      companyId: company.id,
    },
  });
  console.log("Created recruiter:", recruiterUser.name);

  // Create assessment template
  const template = await prisma.assessmentTemplate.create({
    data: {
      companyId: company.id,
      createdById: recruiter.id,
      name: "Software Engineer Technical Assessment",
      description: "Evaluate coding skills, problem-solving, and technical communication",
      questionCount: 5,
      questions: {
        create: [
          {
            orderIndex: 0,
            questionText:
              "Tell me about a challenging technical problem you solved recently. What was your approach?",
            scoringRubric:
              "Look for: clear problem description, structured approach, technical depth, outcome",
          },
          {
            orderIndex: 1,
            questionText:
              "How would you design a URL shortening service like bit.ly? Consider scale and reliability.",
            scoringRubric:
              "Look for: system components, data storage, scaling considerations, trade-offs",
          },
          {
            orderIndex: 2,
            questionText:
              "Explain the difference between SQL and NoSQL databases. When would you choose one over the other?",
            scoringRubric:
              "Look for: understanding of both types, use cases, trade-offs, practical examples",
          },
          {
            orderIndex: 3,
            questionText:
              "Describe your experience with version control. How do you handle merge conflicts?",
            scoringRubric:
              "Look for: Git knowledge, branching strategy, conflict resolution, collaboration",
          },
          {
            orderIndex: 4,
            questionText:
              "What's your approach to writing maintainable code? Give an example from your work.",
            scoringRubric:
              "Look for: clean code principles, documentation, testing, refactoring",
          },
        ],
      },
    },
  });
  console.log("Created template:", template.name);

  // Create job
  const job = await prisma.job.create({
    data: {
      companyId: company.id,
      recruiterId: recruiter.id,
      templateId: template.id,
      title: "Senior Software Engineer",
      description:
        "We're looking for a senior engineer to join our platform team. You'll work on scalable systems and mentor junior developers.",
      status: JobStatus.ACTIVE,
    },
  });
  console.log("Created job:", job.title);

  // Create candidate
  const candidate = await prisma.candidate.create({
    data: {
      email: "john.doe@email.com",
      name: "John Doe",
    },
  });
  console.log("Created candidate:", candidate.name);

  // Create assessment invitation
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

  const invitation = await prisma.assessmentInvitation.create({
    data: {
      jobId: job.id,
      candidateId: candidate.id,
      token: nanoid(21),
      candidateEmail: candidate.email,
      status: InvitationStatus.SENT,
      expiresAt,
    },
  });
  console.log("Created invitation with token:", invitation.token);

  console.log("\n--- Seed Complete ---");
  console.log("Recruiter login: recruiter@techcorp.com / password123");
  console.log(`Assessment URL: http://localhost:3000/assessment/${invitation.token}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
