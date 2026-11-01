import { IPIP50_V1 } from './ipip50-v1.js';
import { validateIPIP50Answer, scoreIPIP50 } from './ipip50-scoring.js';

// Thin adapter for existing public.personality_answers with self-only RLS.
// Intentionally no family/partner read, no sharing and no privileged key.
// API accepts the existing authenticated supabase-js client from live-app.js.
async function authenticatedUser(db) {
  const { data, error } = await db.auth.getUser();
  if (error) throw error;
  if (!data?.user?.id) throw new Error('Du måste vara inloggad för att spara testet.');
  return data.user.id;
}

export async function loadMyIPIP50Answers(db) {
  const userId = await authenticatedUser(db);
  const { data, error } = await db.from('personality_answers')
    .select('question_id,answer')
    .eq('user_id', userId)
    .eq('instrument_id', IPIP50_V1.id);
  if (error) throw error;
  const known = new Set(IPIP50_V1.items.map(item => item.id));
  const answers = {};
  for (const row of data ?? []) {
    if (!known.has(row.question_id)) continue; // Never reinterpret other instruments.
    const value = row.answer?.value;
    validateIPIP50Answer(row.question_id, value);
    if (Object.hasOwn(answers, row.question_id)) throw new Error('Dubblettsvar upptäckt');
    answers[row.question_id] = value;
  }
  return { answers, status: scoreIPIP50(answers), instrumentId: IPIP50_V1.id };
}

export async function saveMyIPIP50Answer(db, questionId, value) {
  validateIPIP50Answer(questionId, value);
  const userId = await authenticatedUser(db);
  // Stable instrument ID includes version; do not overwrite another version's answers.
  const row = { user_id: userId, instrument_id: IPIP50_V1.id,
    question_id: questionId, answer: { value } };
  const { error } = await db.from('personality_answers')
    .upsert(row, { onConflict: 'user_id,instrument_id,question_id' });
  if (error) throw error;
  return { saved: true, questionId, instrumentId: IPIP50_V1.id };
}
