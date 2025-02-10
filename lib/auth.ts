import { PrismaClient } from "@prisma/client";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const NEXT_AUTH_CONFIG = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "email", type: "text", placeholder: "" },
        password: { label: "password", type: "password", placeholder: "" },
      },
      async authorize(credentials: any) {
        if (!credentials.email || !credentials.password) {
          throw new Error("Missing credentials");
        }

        // Find user in the database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("User not found");
        }

        // Compare hashed password
        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValidPassword) {
          throw new Error("Invalid password");
        }

        // Include 'name' along with other user details
        return {
          id: user.id,
          username: user.username, // Make sure 'username' is returned here
          email: user.email,
          name: user.username, // Add the 'name' field here, you can use username if name is not in the DB
          type: user.type,
          localityId: user.localityId, // Ensure localityId is passed
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    jwt: async ({ user, token }: any) => {
      if (user) {
        token.uid = user.id;
        token.username = user.username; // Add the 'username' field to the token
        token.localityId = user.localityId; // Store localityId in the token
      }
      return token;
    },
    session: ({ session, token }: any) => {
      if (session.user) {
        session.user.id = token.uid;
        session.user.username = token.username; // Ensure 'username' is in the session
        session.user.localityId = token.localityId; // Use 'localityId' from the token
      }
      return session;
    },
  },
};
