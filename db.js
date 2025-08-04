const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./rewards.db');

// 모든 테이블 생성
db.serialize(() => {
  // 리워드 적립 내역
  db.run(`
    CREATE TABLE IF NOT EXISTS influencer_rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ref TEXT NOT NULL,
      amount INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 출금 요청
  db.run(`
    CREATE TABLE IF NOT EXISTS withdrawal_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ref TEXT NOT NULL,
      amount INTEGER NOT NULL,
      bank TEXT NOT NULL,
      account TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      requested_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // 사용자 테이블 생성
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      phone TEXT,
      password TEXT,
      role TEXT CHECK(role IN ('consumer', 'influencer', 'seller')),
      name TEXT,
      platform TEXT,         -- 인플루언서만 해당
      fans INTEGER,          -- 인플루언서만 해당
      company TEXT,          -- 공급사만 해당
      license_file TEXT,     -- 공급사만 해당 (파일명 저장)
      bank_copy TEXT,        -- 인플루언서만 해당
      id_copy TEXT,          -- 인플루언서만 해당
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});


  // 상품 정보
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      price INTEGER,
      commission INTEGER,
      image TEXT
    )
  `);

  // 프로모션 링크
  db.run(`
    CREATE TABLE IF NOT EXISTS promotion_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      ref TEXT
    )
  `);
});

module.exports = db;
