import { supabase } from "./supabase";

let keepAlivePromise = null;

export function pingSupabase() {
    // Run only once during this browser page load.
    // Also prevents duplicate calls from React StrictMode.
    if (keepAlivePromise) {
        return keepAlivePromise;
    }

    keepAlivePromise = (async () => {
        try {
            const { error } = await supabase
                .from("marquee_images")
                .select("id")
                .limit(1)
                .abortSignal(AbortSignal.timeout(10000));

            if (error) {
                if (import.meta.env.DEV) {
                    console.warn(
                        "[Supabase Keep Alive] Failed:",
                        error.message
                    );
                }

                return false;
            }

            if (import.meta.env.DEV) {
                console.info(
                    "[Supabase Keep Alive] Database activity successful."
                );
            }

            return true;

        } catch (error) {
            if (import.meta.env.DEV) {
                console.warn(
                    "[Supabase Keep Alive] Request failed:",
                    error.message
                );
            }

            return false;
        }
    })();

    return keepAlivePromise;
}
