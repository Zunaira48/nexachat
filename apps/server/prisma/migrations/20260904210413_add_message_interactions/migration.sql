BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[MessageRead] DROP CONSTRAINT [MessageRead_messageId_fkey];

-- AlterTable
ALTER TABLE [dbo].[ConversationMember] ADD [isFavorite] BIT NOT NULL CONSTRAINT [ConversationMember_isFavorite_df] DEFAULT 0;

-- AlterTable
ALTER TABLE [dbo].[Message] ADD [deletedAt] DATETIME2,
[editedAt] DATETIME2,
[pinnedAt] DATETIME2,
[replyToId] NVARCHAR(1000);

-- CreateTable
CREATE TABLE [dbo].[MessageReaction] (
    [id] NVARCHAR(1000) NOT NULL,
    [messageId] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [emoji] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [MessageReaction_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [MessageReaction_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [MessageReaction_messageId_userId_emoji_key] UNIQUE NONCLUSTERED ([messageId],[userId],[emoji])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [MessageReaction_messageId_idx] ON [dbo].[MessageReaction]([messageId]);

-- AddForeignKey
ALTER TABLE [dbo].[Message] ADD CONSTRAINT [Message_replyToId_fkey] FOREIGN KEY ([replyToId]) REFERENCES [dbo].[Message]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MessageReaction] ADD CONSTRAINT [MessageReaction_messageId_fkey] FOREIGN KEY ([messageId]) REFERENCES [dbo].[Message]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MessageRead] ADD CONSTRAINT [MessageRead_messageId_fkey] FOREIGN KEY ([messageId]) REFERENCES [dbo].[Message]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
