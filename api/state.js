// /api/state.js
// 단일 엔드포인트로 4가지 데이터 타입(task, expectation, gap, agreement)을
// Upstash Redis(Vercel Marketplace 연동)에 저장/조회한다.
// 프론트(index.html)는 fetch('/api/state?...')로만 통신한다.
//
// 필요한 환경변수 (Vercel 프로젝트 > Storage > Upstash for Redis 연결 시 자동 생성됨):
//   KV_REST_API_URL
//   KV_REST_API_TOKEN

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const ALLOWED_TYPES = new Set(['task', 'expectation', 'gap', 'agreement']);

// 저장 키 규칙
//   task:{taskId}
//   expectation:{taskId}:{role}      role = 'leader' | 'member'
//   gap:{taskId}
//   agreement:{taskId}
function buildKey({ type, taskId, role }) {
  if (!ALLOWED_TYPES.has(type)) throw new Error('invalid type');
  if (!taskId) throw new Error('taskId required');
  if (type === 'expectation') {
    if (role !== 'leader' && role !== 'member') throw new Error('invalid role');
    return `expectation:${taskId}:${role}`;
  }
  return `${type}:${taskId}`;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { type, taskId, role } = req.query;

      // 특수 조회: expectation 타입에서 role을 생략하면 leader+member 둘 다 반환
      // (탭3 Gap 분석 화면에서 한 번에 양측 답변을 읽어오기 위함)
      if (type === 'expectation' && !role) {
        if (!taskId) return res.status(400).json({ error: 'taskId required' });
        const [leader, member] = await Promise.all([
          redis.get(`expectation:${taskId}:leader`),
          redis.get(`expectation:${taskId}:member`),
        ]);
        return res.status(200).json({ leader: leader || null, member: member || null });
      }

      const key = buildKey({ type, taskId, role });
      const value = await redis.get(key);
      return res.status(200).json(value || null);
    }

    if (req.method === 'POST') {
      const { type, taskId, role, data } = req.body || {};
      const key = buildKey({ type, taskId, role });
      await redis.set(key, data);
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
