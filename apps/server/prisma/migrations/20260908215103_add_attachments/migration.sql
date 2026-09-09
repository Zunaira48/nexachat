BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Attachment] (
    [id] NVARCHAR(1000) NOT NULL,
    [messageId] NVARCHAR(1000) NOT NULL,
    [fileName] NVARCHAR(1000) NOT NULL,
    [mimeType] NVARCHAR(1000) NOT NULL,
    [size] INT NOT NULL,
    [key] NVARCHAR(1000) NOT NULL,
    [url] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Attachment_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Attachment_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Attachment_messageId_key] UNIQUE NONCLUSTERED ([messageId])
);

-- AddForeignKey
ALTER TABLE [dbo].[Attachment] ADD CONSTRAINT [Attachment_messageId_fkey] FOREIGN KEY ([messageId]) REFERENCES [dbo].[Message]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
