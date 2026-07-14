import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";

// Public project URL + anon/publishable key — these are SAFE to ship inside
// the app. They only allow what the database's row-level security policies
// permit (here: public read/insert/update on the "profiles" table), which is
// an intentional, simple tradeoff for a small private friend group. This is
// not meant to hold sensitive data.

const SUPABASE_URL = "https://xkktlhdmpoqefiehbouo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_GEXCdI56fQSYq_4Z5x-k7Q_bboDCLkq";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
