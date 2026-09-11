'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Pin, Pencil, Trash2, Reply as ReplyIcon, X, Paperclip, FileText } from 'lucide-react';
import { authedFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth-store';
import { useConversationSocket } from '@/hooks/use-conversation-socket';
import { useTyping } from '@/hooks/use-typing';
import { ReactionPicker } from '@/components/reaction-picker';
import { useFileUpload } from '@/hooks/use-file-upload';

interface Reaction {
  id: string;
  userId: string;
  emoji: string;
}

interface Attachment {
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  type: string;
  createdAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
  pinnedAt?: string | null;
  replyToId?: string | null;
  replyTo?: { id: string; content: string; senderId: string; deletedAt: string | null } | null;
  reactions: Reaction[];
  attachment?: Attachment | null;
}

export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  const conversationId = params.id;
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');

  useConversationSocket(conversationId);
  const { typingUserIds, emitTypingStart, emitTypingStop } = useTyping(conversationId);
  const { uploadFile, isUploading, error: uploadError } = useFileUpload(conversationId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () =>
      authedFetch<{ messages: Message[]; nextCursor: string | null }>(
        `/api/conversations/${conversationId}/messages`,
      ),
  });

  const messages = data?.messages ?? [];

  useEffect(() => {
    if (!messages.length) return;
    authedFetch(`/api/conversations/${conversationId}/read`, { method: 'POST' }).catch(() => {});
  }, [conversationId, messages.length]);

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      authedFetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content, replyToId: replyTo?.id }),
      }),
    onSuccess: () => {
      setDraft('');
      setReplyTo(null);
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      authedFetch(`/api/conversations/${conversationId}/messages/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ content }),
      }),
    onSuccess: () => setEditingId(null),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      authedFetch(`/api/conversations/${conversationId}/messages/${id}`, { method: 'DELETE' }),
  });

  const pinMutation = useMutation({
    mutationFn: (id: string) =>
      authedFetch(`/api/conversations/${conversationId}/messages/${id}/pin`, { method: 'POST' }),
  });

  const reactMutation = useMutation({
    mutationFn: ({ id, emoji }: { id: string; emoji: string }) =>
      authedFetch(`/api/conversations/${conversationId}/messages/${id}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      }),
  });

  const unreactMutation = useMutation({
    mutationFn: ({ id, emoji }: { id: string; emoji: string }) =>
      authedFetch(
        `/api/conversations/${conversationId}/messages/${id}/reactions/${encodeURIComponent(emoji)}`,
        { method: 'DELETE' },
      ),
  });

  function toggleReaction(message: Message, emoji: string) {
    const mine = message.reactions.find((r) => r.userId === currentUserId && r.emoji === emoji);
    if (mine) {
      unreactMutation.mutate({ id: message.id, emoji });
    } else {
      reactMutation.mutate({ id: message.id, emoji });
    }
  }

  if (isLoading) return <p className="p-6 text-muted-foreground">Loading messages…</p>;
  if (error) return <p className="p-6 text-red-500">Unable to load this conversation.</p>;

  const pinnedMessages = messages.filter((m) => m.pinnedAt);

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] max-w-2xl mx-auto">
      {pinnedMessages.length > 0 && (
        <div className="border-b border-border px-4 py-2 bg-foreground/3 text-xs text-muted-foreground flex items-center gap-1.5 overflow-x-auto">
          <Pin size={12} className="shrink-0" />
          {pinnedMessages.map((m) => m.content).join(' · ')}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-1">
        {messages.length === 0 ? (
          <p className="text-muted-foreground">No messages yet. Say hello.</p>
        ) : (
          messages.map((m) => {
            const isMine = m.senderId === currentUserId;

            if (m.type === 'SYSTEM') {
              return (
                <p key={m.id} className="text-center text-xs text-muted-foreground py-2">
                  {m.content}
                </p>
              );
            }

            const reactionGroups = m.reactions.reduce<Record<string, number>>((acc, r) => {
              acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
              return acc;
            }, {});

            return (
              <div key={m.id} className={`group flex ${isMine ? 'justify-end' : 'justify-start'} py-1`}>
                <div className={`flex items-end gap-1.5 ${isMine ? 'flex-row-reverse' : ''}`}>
                  <div className="max-w-xs">
                    {m.replyTo && (
                      <div className="text-xs text-muted-foreground border-l-2 border-border pl-2 mb-1 truncate">
                        {m.replyTo.deletedAt ? 'Original message deleted' : m.replyTo.content}
                      </div>
                    )}

                    {editingId === m.id ? (
                      <form
                        className="flex gap-1"
                        onSubmit={(e) => {
                          e.preventDefault();
                          editMutation.mutate({ id: m.id, content: editDraft });
                        }}
                      >
                        <Input value={editDraft} onChange={(e) => setEditDraft(e.target.value)} autoFocus />
                        <Button type="submit" variant="secondary">
                          Save
                        </Button>
                      </form>
                    ) : m.attachment && !m.deletedAt ? (
                      m.type === 'IMAGE' ? (
                        <a href={m.attachment.url} target="_blank" rel="noopener noreferrer">
                          <Image
                            src={m.attachment.url}
                            alt={m.attachment.fileName}
                            width={240}
                            height={240}
                            unoptimized
                            className="rounded-md max-w-60 max-h-60 object-cover"
                          />
                        </a>
                      ) : (
                        <a
                          href={m.attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm bg-foreground/5 hover:bg-foreground/10 border border-border"
                        >
                          <FileText size={16} className="shrink-0" />
                          <span className="truncate">{m.attachment.fileName}</span>
                        </a>
                      )
                    ) : (
                      <div
                        className={`rounded-md px-3 py-2 text-sm ${
                          m.deletedAt
                            ? 'italic text-muted-foreground bg-foreground/5'
                            : isMine
                              ? 'bg-linear-to-br from-signal to-signal-2 text-paper'
                              : 'bg-foreground/5'
                        }`}
                      >
                        {m.deletedAt ? 'This message was deleted' : m.content}
                        {m.editedAt && !m.deletedAt && (
                          <span className="text-[10px] opacity-70 ml-1.5">(edited)</span>
                        )}
                      </div>
                    )}

                    {Object.keys(reactionGroups).length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {Object.entries(reactionGroups).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            onClick={() => toggleReaction(m, emoji)}
                            className="text-xs bg-foreground/5 border border-border rounded-full px-1.5 py-0.5 hover:bg-foreground/10"
                          >
                            {emoji} {count}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {!m.deletedAt && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                      <ReactionPicker onSelect={(emoji) => toggleReaction(m, emoji)} />
                      <Button variant="ghost" onClick={() => setReplyTo(m)} aria-label="Reply">
                        <ReplyIcon size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => pinMutation.mutate(m.id)}
                        aria-label={m.pinnedAt ? 'Unpin message' : 'Pin message'}
                      >
                        <Pin size={16} className={m.pinnedAt ? 'fill-amber text-amber' : ''} />
                      </Button>
                      {isMine && (
                        <>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setEditingId(m.id);
                              setEditDraft(m.content);
                            }}
                            aria-label="Edit message"
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(m.id)}
                            aria-label="Delete message"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {replyTo && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-foreground/3 text-sm">
          <span className="text-muted-foreground truncate">
            Replying to: <span className="text-foreground">{replyTo.content}</span>
          </span>
          <Button variant="ghost" onClick={() => setReplyTo(null)} aria-label="Cancel reply">
            <X size={14} />
          </Button>
        </div>
      )}

      <form
        className="flex gap-2 p-4 border-t border-border"
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.trim()) sendMutation.mutate(draft);
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadFile(file);
            e.target.value = '';
          }}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          aria-label="Attach file"
        >
          <Paperclip size={16} />
        </Button>
        <Input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            emitTypingStart();
          }}
          onBlur={emitTypingStop}
          placeholder="Type a message…"
        />
        <Button type="submit" disabled={sendMutation.isPending}>
          Send
        </Button>
      </form>
      {isUploading && <p className="px-6 pb-2 text-xs text-muted-foreground">Uploading…</p>}
      {uploadError && <p className="px-6 pb-2 text-xs text-red-500">{uploadError}</p>}
      {typingUserIds.size > 0 && (
        <p className="px-6 pb-2 text-xs text-muted-foreground">Someone is typing…</p>
      )}
    </div>
  );
}