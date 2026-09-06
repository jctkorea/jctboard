"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";

type Post = {
  id: string;
  title: string;
  content: string;
  created_at: string;
};

type Comment = {
  id: string;
  post_id: string;
  content: string;
  created_at: string;
  is_auto: boolean;
};

const COMMENT_FIELDS = "id, post_id, content, created_at, is_auto";

function formatDate(iso: string) {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isWriting, setIsWriting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [submittingFor, setSubmittingFor] = useState<string | null>(null);

  useEffect(() => {
    async function loadBoard() {
      const [postResult, commentResult] = await Promise.all([
        supabase
          .from("posts")
          .select("id, title, content, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("comments")
          .select(COMMENT_FIELDS)
          .order("created_at", { ascending: true }),
      ]);

      if (postResult.error || commentResult.error) {
        setError("문의를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      } else {
        setPosts(postResult.data);
        setComments(commentResult.data);
      }
      setIsLoading(false);
    }
    loadBoard();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle || !trimmedContent) return;

    setIsSubmitting(true);
    setError("");
    const { data, error } = await supabase
      .from("posts")
      .insert({ title: trimmedTitle, content: trimmedContent })
      .select("id, title, content, created_at")
      .single();
    setIsSubmitting(false);

    if (error) {
      setError("문의를 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    // 글이 등록되면 DB 트리거가 접수 확인 댓글을 남기므로 함께 가져온다.
    const { data: ackComments } = await supabase
      .from("comments")
      .select(COMMENT_FIELDS)
      .eq("post_id", data.id)
      .order("created_at", { ascending: true });

    setPosts([data, ...posts]);
    if (ackComments) setComments([...comments, ...ackComments]);
    setTitle("");
    setContent("");
    setIsWriting(false);
    setOpenId(data.id);
  }

  async function handleCommentSubmit(event: React.FormEvent, postId: string) {
    event.preventDefault();
    const draft = (commentDrafts[postId] ?? "").trim();
    if (!draft) return;

    setSubmittingFor(postId);
    setError("");
    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: postId, content: draft })
      .select(COMMENT_FIELDS)
      .single();
    setSubmittingFor(null);

    if (error) {
      setError("댓글을 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    setComments([...comments, data]);
    setCommentDrafts({ ...commentDrafts, [postId]: "" });
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.category}>Q&amp;A</p>
        <h1 className={styles.title}>불판몰 고객센터</h1>
        <p className={styles.subtitle}>
          궁금한 점을 남겨주세요. 로그인 없이 익명으로 문의할 수 있습니다.
        </p>
      </header>

      <div className={styles.toolbar}>
        <span className={styles.count}>
          {isLoading ? "불러오는 중" : `문의 ${posts.length}건`}
        </span>
        <button
          type="button"
          className={styles.writeButton}
          onClick={() => setIsWriting(!isWriting)}
        >
          {isWriting ? "닫기" : "글쓰기"}
        </button>
      </div>

      {isWriting && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label} htmlFor="title">
            제목
          </label>
          <input
            id="title"
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="어떤 점이 궁금하신가요?"
            maxLength={60}
          />

          <label className={styles.label} htmlFor="content">
            내용
          </label>
          <textarea
            id="content"
            className={styles.textarea}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="주문번호나 제품명을 함께 적어주시면 더 빠르게 답변드릴 수 있어요."
            rows={6}
            maxLength={2000}
          />

          <div className={styles.formFooter}>
            <span className={styles.notice}>작성자는 익명으로 등록됩니다.</span>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={!title.trim() || !content.trim() || isSubmitting}
            >
              {isSubmitting ? "등록 중..." : "등록하기"}
            </button>
          </div>
        </form>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {!isLoading && posts.length === 0 && !error && (
        <p className={styles.empty}>아직 등록된 문의가 없습니다.</p>
      )}

      {posts.length > 0 && (
      <ul className={styles.list}>
        {posts.map((post) => {
          const postComments = comments.filter((c) => c.post_id === post.id);
          const draft = commentDrafts[post.id] ?? "";

          return (
            <li key={post.id} className={styles.item}>
              <button
                type="button"
                className={styles.itemHead}
                onClick={() => setOpenId(openId === post.id ? null : post.id)}
              >
                <span className={styles.itemTitle}>
                  {post.title}
                  {postComments.length > 0 && (
                    <span className={styles.commentCount}>
                      {postComments.length}
                    </span>
                  )}
                </span>
                <span className={styles.meta}>
                  익명 · {formatDate(post.created_at)}
                </span>
              </button>

              {openId === post.id && (
                <>
                  <p className={styles.content}>{post.content}</p>

                  <div className={styles.comments}>
                    {postComments.map((comment) => (
                      <div
                        key={comment.id}
                        className={
                          comment.is_auto
                            ? `${styles.comment} ${styles.autoComment}`
                            : styles.comment
                        }
                      >
                        <p className={styles.commentText}>{comment.content}</p>
                        <span className={styles.commentMeta}>
                          {comment.is_auto ? (
                            <span className={styles.autoBadge}>자동 응답</span>
                          ) : (
                            "익명"
                          )}{" "}
                          · {formatDate(comment.created_at)}
                        </span>
                      </div>
                    ))}

                    <form
                      className={styles.commentForm}
                      onSubmit={(e) => handleCommentSubmit(e, post.id)}
                    >
                      <input
                        className={styles.commentInput}
                        value={draft}
                        onChange={(e) =>
                          setCommentDrafts({
                            ...commentDrafts,
                            [post.id]: e.target.value,
                          })
                        }
                        placeholder="댓글을 남겨주세요."
                        maxLength={1000}
                      />
                      <button
                        type="submit"
                        className={styles.commentButton}
                        disabled={!draft.trim() || submittingFor === post.id}
                      >
                        {submittingFor === post.id ? "등록 중..." : "댓글 등록"}
                      </button>
                    </form>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>
      )}
    </div>
  );
}
