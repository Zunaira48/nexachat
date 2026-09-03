BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Conversation] (
    [id] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Conversation_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Conversation_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ConversationMember] (
    [id] NVARCHAR(1000) NOT NULL,
    [conversationId] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [ConversationMember_role_df] DEFAULT 'MEMBER',
    [joinedAt] DATETIME2 NOT NULL CONSTRAINT [ConversationMember_joinedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ConversationMember_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ConversationMember_conversationId_userId_key] UNIQUE NONCLUSTERED ([conversationId],[userId])
);

-- CreateTable
CREATE TABLE [dbo].[Message] (
    [id] NVARCHAR(1000) NOT NULL,
    [conversationId] NVARCHAR(1000) NOT NULL,
    [senderId] NVARCHAR(1000) NOT NULL,
    [content] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Message_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Message_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ConversationMember_userId_idx] ON [dbo].[ConversationMember]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Message_conversationId_createdAt_idx] ON [dbo].[Message]([conversationId], [createdAt]);

-- AddForeignKey
ALTER TABLE [dbo].[ConversationMember] ADD CONSTRAINT [ConversationMember_conversationId_fkey] FOREIGN KEY ([conversationId]) REFERENCES [dbo].[Conversation]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ConversationMember] ADD CONSTRAINT [ConversationMember_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Message] ADD CONSTRAINT [Message_conversationId_fkey] FOREIGN KEY ([conversationId]) REFERENCES [dbo].[Conversation]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
