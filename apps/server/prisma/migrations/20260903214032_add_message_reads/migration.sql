BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[MessageRead] (
    [id] NVARCHAR(1000) NOT NULL,
    [messageId] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [readAt] DATETIME2 NOT NULL CONSTRAINT [MessageRead_readAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [MessageRead_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [MessageRead_messageId_userId_key] UNIQUE NONCLUSTERED ([messageId],[userId])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [MessageRead_userId_idx] ON [dbo].[MessageRead]([userId]);

-- AddForeignKey
ALTER TABLE [dbo].[MessageRead] ADD CONSTRAINT [MessageRead_messageId_fkey] FOREIGN KEY ([messageId]) REFERENCES [dbo].[Message]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
