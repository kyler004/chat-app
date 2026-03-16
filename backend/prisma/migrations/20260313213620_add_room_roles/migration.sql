-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RoomRole" AS ENUM ('ADMIN', 'MEMBER');

-- AlterTable
ALTER TABLE "RoomMember" ADD COLUMN     "role" "RoomRole" NOT NULL DEFAULT 'MEMBER';

-- CreateTable
CREATE TABLE "ConversationInvite" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConversationInvite_senderId_receiverId_key" ON "ConversationInvite"("senderId", "receiverId");

-- AddForeignKey
ALTER TABLE "ConversationInvite" ADD CONSTRAINT "ConversationInvite_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationInvite" ADD CONSTRAINT "ConversationInvite_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
