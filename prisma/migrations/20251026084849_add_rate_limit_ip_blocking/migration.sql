-- CreateTable
CREATE TABLE "RateLimit" (
    "id" SERIAL NOT NULL,
    "ip_address" TEXT NOT NULL,
    "login_attempts" INTEGER NOT NULL DEFAULT 0,
    "window_start" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedIP" (
    "id" SERIAL NOT NULL,
    "ip_address" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "blocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blocked_until" TIMESTAMP(3),
    "is_permanent" BOOLEAN NOT NULL DEFAULT false,
    "user_agent" TEXT,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "unblocked_by" INTEGER,
    "unblocked_at" TIMESTAMP(3),
    "unblock_reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlockedIP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityLog" (
    "id" SERIAL NOT NULL,
    "ip_address" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "user_agent" TEXT,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,

    CONSTRAINT "SecurityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_ip_address_key" ON "RateLimit"("ip_address");

-- CreateIndex
CREATE INDEX "RateLimit_ip_address_idx" ON "RateLimit"("ip_address");

-- CreateIndex
CREATE INDEX "RateLimit_window_start_idx" ON "RateLimit"("window_start");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedIP_ip_address_key" ON "BlockedIP"("ip_address");

-- CreateIndex
CREATE INDEX "BlockedIP_ip_address_idx" ON "BlockedIP"("ip_address");

-- CreateIndex
CREATE INDEX "BlockedIP_blocked_until_idx" ON "BlockedIP"("blocked_until");

-- CreateIndex
CREATE INDEX "BlockedIP_is_permanent_idx" ON "BlockedIP"("is_permanent");

-- CreateIndex
CREATE INDEX "BlockedIP_blocked_at_idx" ON "BlockedIP"("blocked_at");

-- CreateIndex
CREATE INDEX "SecurityLog_ip_address_idx" ON "SecurityLog"("ip_address");

-- CreateIndex
CREATE INDEX "SecurityLog_action_idx" ON "SecurityLog"("action");

-- CreateIndex
CREATE INDEX "SecurityLog_severity_idx" ON "SecurityLog"("severity");

-- CreateIndex
CREATE INDEX "SecurityLog_timestamp_idx" ON "SecurityLog"("timestamp");

-- CreateIndex
CREATE INDEX "SecurityLog_userId_idx" ON "SecurityLog"("userId");

-- AddForeignKey
ALTER TABLE "SecurityLog" ADD CONSTRAINT "SecurityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
