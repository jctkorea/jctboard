"use client";

import { useState } from "react";
import styles from "./page.module.css";

type Post = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
};

const SEED_POSTS: Post[] = [
  {
    id: 3,
    title: "주문한 무연 불판, 언제쯤 도착할까요?",
    content:
      "어제 저녁에 주문했는데 배송 조회에는 아직 아무것도 안 뜹니다. 주말 전에 받아볼 수 있을까요?",
    createdAt: "2026-09-05",
  },
  {
    id: 2,
    title: "불판 코팅이 벗겨졌는데 교환되나요?",
    content:
      "구매한 지 3주 정도 됐습니다. 가운데 부분 코팅이 조금씩 일어나는데 교환이나 환불이 가능한지 궁금합니다.",
    createdAt: "2026-09-04",
  },
  {
    id: 1,
    title: "인덕션에서도 쓸 수 있는 제품인가요?",
    content:
      "가스레인지용으로만 표시되어 있는데, 인덕션 호환 모델은 따로 있는지 알려주세요.",
    createdAt: "2026-09-02",
  },
];

function today() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>(SEED_POSTS);
  const [isWriting, setIsWriting] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle || !trimmedContent) return;

    const post: Post = {
      id: Date.now(),
      title: trimmedTitle,
      content: trimmedContent,
      createdAt: today(),
    };
    setPosts([post, ...posts]);
    setTitle("");
    setContent("");
    setIsWriting(false);
    setOpenId(post.id);
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
        <span className={styles.count}>문의 {posts.length}건</span>
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
          />

          <div className={styles.formFooter}>
            <span className={styles.notice}>작성자는 익명으로 등록됩니다.</span>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={!title.trim() || !content.trim()}
            >
              등록하기
            </button>
          </div>
        </form>
      )}

      <ul className={styles.list}>
        {posts.map((post) => (
          <li key={post.id} className={styles.item}>
            <button
              type="button"
              className={styles.itemHead}
              onClick={() => setOpenId(openId === post.id ? null : post.id)}
            >
              <span className={styles.itemTitle}>{post.title}</span>
              <span className={styles.meta}>
                익명 · {post.createdAt}
              </span>
            </button>
            {openId === post.id && (
              <p className={styles.content}>{post.content}</p>
            )}
          </li>
        ))}
      </ul>

      <footer className={styles.footer}>
        저장 기능이 아직 연결되지 않아, 새로고침하면 작성한 글이 사라집니다.
      </footer>
    </div>
  );
}
