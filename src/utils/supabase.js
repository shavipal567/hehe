import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xkktlhdmpoqefiehbouo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_GEXCdI56fQSYq_4Z5x-k7Q_bboDCLkq";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
