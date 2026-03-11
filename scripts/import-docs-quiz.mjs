import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';

const ROOT = process.cwd();
const DOCS_DIR = path.join(ROOT, 'docs');
const PPTX_PATH = path.join(DOCS_DIR, 'Киноквест GCore.pptx');
const EXTRACT_DIR = path.join(ROOT, 'tmp', 'quiz_parse_auto');
const MEDIA_DIR = path.join(EXTRACT_DIR, 'ppt', 'media');
const SLIDES_DIR = path.join(EXTRACT_DIR, 'ppt', 'slides');
const RELS_DIR = path.join(EXTRACT_DIR, 'ppt', 'slides', '_rels');
const PUBLIC_MEDIA_DIR = path.join(ROOT, 'public', 'quiz-media', 'gcore');

function parseEnv(filePath) {
  const out = {};
  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    out[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
  }
  return out;
}

function ensureExtracted() {
  fs.mkdirSync(EXTRACT_DIR, { recursive: true });
  execSync(`unzip -o ${JSON.stringify(PPTX_PATH)} -d ${JSON.stringify(EXTRACT_DIR)}`, {
    stdio: 'ignore',
  });
}

function decodeXmlText(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function getSlideTokens(slideNo) {
  const p = path.join(SLIDES_DIR, `slide${slideNo}.xml`);
  const raw = fs.readFileSync(p, 'utf8');
  const tokens = [];
  const re = /<a:t>([\s\S]*?)<\/a:t>/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    const t = decodeXmlText(m[1]);
    if (t) tokens.push(t);
  }
  return tokens;
}

function getSlideMedia(slideNo) {
  const p = path.join(RELS_DIR, `slide${slideNo}.xml.rels`);
  if (!fs.existsSync(p)) return [];
  const raw = fs.readFileSync(p, 'utf8');
  const matches = [...raw.matchAll(/Target="([^"]+)"/g)];
  return matches
    .map((m) => m[1])
    .filter((t) => t.includes('../media/'))
    .map((t) => path.basename(t));
}

const DECORATIVE_IMAGES = new Set([
  'image1.png', 'image2.png', 'image3.png', 'image4.png', 'image6.png', 'image12.png',
  'image17.png', 'image18.png', 'image19.png', 'image20.png', 'image21.png', 'image22.png',
  'image23.png', 'image24.png', 'image25.png', 'image26.png', 'image27.png', 'image28.png',
]);

function extensionType(name) {
  const ext = path.extname(name).toLowerCase();
  if (ext === '.mp3') return 'audio';
  if (ext === '.mp4') return 'video';
  if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) return 'image';
  return 'unknown';
}

function pickMedia(slideNo, type) {
  const mediaNames = getSlideMedia(slideNo);
  const candidates = mediaNames.filter((n) => extensionType(n) === type);

  if (type === 'image') {
    const filtered = candidates.filter((n) => !DECORATIVE_IMAGES.has(n));
    if (filtered.length === 0) return '';
    const list = filtered;

    let best = list[0];
    let bestSize = fs.existsSync(path.join(MEDIA_DIR, best)) ? fs.statSync(path.join(MEDIA_DIR, best)).size : 0;
    for (const item of list.slice(1)) {
      const fp = path.join(MEDIA_DIR, item);
      const size = fs.existsSync(fp) ? fs.statSync(fp).size : 0;
      if (size > bestSize) {
        best = item;
        bestSize = size;
      }
    }
    return best;
  }

  return candidates[0] || '';
}

function buildQuestionText(roundName, index, fallbackText = '') {
  if (fallbackText && fallbackText.length > 8) return fallbackText;
  return `${roundName} - Вопрос ${index}`;
}

function extractRound4Question(slideNo, index) {
  const tokens = getSlideTokens(slideNo);
  const skip = new Set(['4', 'раунд', '«', '»', 'Важный персонаж', String(index)]);
  const cleaned = tokens.filter((t) => !skip.has(t));
  return buildQuestionText('Раунд 4: Важный персонаж', index, cleaned.join(' '));
}

function extractRound5Question(slideNo, index) {
  const tokens = getSlideTokens(slideNo);
  const skip = new Set(['5', 'раунд', '«', '»', 'Последний шанс', String(index)]);
  const cleaned = tokens.filter((t) => !skip.has(t));
  return buildQuestionText('Раунд 5: Последний шанс', index, cleaned.join(' '));
}

const r1Answers = [
  'Выстрел в пустоту (2017)', 'Голая правда (2009)', 'Душа (2020)', 'Заводной апельсин (1971)', 'Исчезнувшая (2014)',
  'Малыш на Драйве (2017)', 'Реквием по мечте (2000)', 'Самый пьяный округ в мире (2012)', 'Сердцеедки (2021)', 'Топ Ган: Мэверик (2022)',
];
const r2Answers = [
  '500 дней лета (2009)', 'Железный человек (2008)', 'Карнавал (1981)', 'Король Ричард', 'Матрица',
  'Мгла', 'Рокки Бальбоа (1976)', 'Свадьба в Малиновке (1967)', 'Страх и ненависть в Лас-Вегасе (1998)', 'Форд против Феррари (2019)',
];
const r3Answers = [
  'Апгрейд (2018)', 'Главный герой (2021)', 'Дневник Баскетболиста (1995)', 'Джентльмены (2019)', 'Интерстеллар (2014)',
  'Малефисента: Владычица тьмы (2019)', 'Не грози южному централу (1996)', 'Отпетые мошенницы (2019)', 'Стажер (2015)', 'Четыре комнаты (1995)',
];
const r4Answers = [
  'Бенедикт Камбербэтч', 'Горбачева Ирина', 'Мерил Стрип', 'Николас Кейдж', 'Роберт Дауни-младший', 'Том Хэнкс', 'Элайджа Вуд',
];
const r5Answers = [
  '9 1/2 недель (1986)', 'Анжелина Джоли', 'Бен Аффлек', 'Война и мир', 'Гарри Поттер',
  'Дивергент', 'Дюна', 'Запах женщины', 'Касабланка', 'Кевин Маккалистер',
  'Молчание ягнят', 'Побег из Шоушенка', 'Убить Билла (2003)', 'Тайная вечеря', 'Эффект бабочки (2003)',
];

function buildQuestions() {
  const questions = [];

  for (let i = 0; i < 10; i += 1) {
    const slideNo = 3 + i;
    questions.push({
      key: `r1_q${i + 1}`,
      round: 1,
      questionNumber: i + 1,
      text: `Раунд 1: Лучший кадр - Назовите фильм (#${i + 1})`,
      mediaType: 'image',
      mediaLocalFile: pickMedia(slideNo, 'image'),
      correctAnswer: r1Answers[i],
      timeLimitSec: 30,
    });
  }

  for (let i = 0; i < 10; i += 1) {
    const slideNo = 14 + i;
    questions.push({
      key: `r2_q${i + 1}`,
      round: 2,
      questionNumber: i + 1,
      text: `Раунд 2: Озвучка - Назовите фильм по аудио (#${i + 1})`,
      mediaType: 'audio',
      mediaLocalFile: pickMedia(slideNo, 'audio'),
      correctAnswer: r2Answers[i],
      timeLimitSec: 15,
    });
  }

  for (let i = 0; i < 10; i += 1) {
    const slideNo = 25 + i;
    questions.push({
      key: `r3_q${i + 1}`,
      round: 3,
      questionNumber: i + 1,
      text: `Раунд 3: В моменте - Назовите фильм по видео (#${i + 1})`,
      mediaType: 'video',
      mediaLocalFile: pickMedia(slideNo, 'video'),
      correctAnswer: r3Answers[i],
      timeLimitSec: 15,
    });
  }

  const r4Slides = [37, 39, 41, 43, 45, 47, 49];
  for (let i = 0; i < r4Slides.length; i += 1) {
    questions.push({
      key: `r4_q${i + 1}`,
      round: 4,
      questionNumber: i + 1,
      text: extractRound4Question(r4Slides[i], i + 1),
      mediaType: 'text',
      mediaLocalFile: '',
      correctAnswer: r4Answers[i],
      timeLimitSec: 20,
    });
  }

  for (let i = 0; i < 15; i += 1) {
    const slideNo = 52 + i;
    const mediaName = pickMedia(slideNo, 'image');
    questions.push({
      key: `r5_q${i + 1}`,
      round: 5,
      questionNumber: i + 1,
      text: extractRound5Question(slideNo, i + 1),
      mediaType: mediaName ? 'image' : 'text',
      mediaLocalFile: mediaName,
      correctAnswer: r5Answers[i],
      timeLimitSec: 20,
    });
  }

  return questions;
}

function publishLocalMedia(localFileName) {
  if (!localFileName) return '';
  const src = path.join(MEDIA_DIR, localFileName);
  if (!fs.existsSync(src)) {
    throw new Error(`Media file not found: ${localFileName}`);
  }

  fs.mkdirSync(PUBLIC_MEDIA_DIR, { recursive: true });
  const dst = path.join(PUBLIC_MEDIA_DIR, localFileName);
  if (!fs.existsSync(dst)) {
    fs.copyFileSync(src, dst);
  }
  return `/quiz-media/gcore/${localFileName}`;
}

async function main() {
  ensureExtracted();

  const env = parseEnv(path.join(ROOT, '.env'));
  const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const questions = buildQuestions();
  console.log(`Prepared ${questions.length} questions`);

  let linkedMedia = 0;
  let index = 0;

  for (const q of questions) {
    index += 1;
    const mediaUrl = publishLocalMedia(q.mediaLocalFile);
    if (mediaUrl) linkedMedia += 1;

    const docId = `doc_${String(index).padStart(3, '0')}`;
    await setDoc(doc(collection(db, 'questions'), docId), {
      id: String(index).padStart(3, '0'),
      text: q.text,
      mediaType: q.mediaType,
      mediaUrl,
      correctAnswer: q.correctAnswer,
      timeLimitSec: q.timeLimitSec,
      round: q.round,
      questionNumber: q.questionNumber,
      source: 'docs/Киноквест GCore.pptx + docs/Киноквест - ответы.docx.pdf',
      importKey: q.key,
    });

    console.log(`Imported ${docId}: ${q.key}${q.mediaLocalFile ? ` [${q.mediaLocalFile}]` : ''}`);
  }

  console.log(`Done. Questions: ${questions.length}, questions with media: ${linkedMedia}`);
  console.log(`Local media directory: ${path.relative(ROOT, PUBLIC_MEDIA_DIR)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
