import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import webpush from "npm:web-push@3.6.6";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
    title: string;
    body: string;
    url?: string;
    tag?: string;
    user_id?: string;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const payload: PushPayload = await req.json();
        console.log("Receiving push payload:", payload);

        // Configurar VAPID
        const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
        const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

        if (!vapidPublicKey || !vapidPrivateKey) {
            throw new Error("VAPID keys not configured in Edge Function secrets");
        }

        webpush.setVapidDetails(
            "mailto:suporte@inoveai.com.br",
            vapidPublicKey,
            vapidPrivateKey
        );

        // Buscar inscrições
        let query = supabaseClient.from("push_subscriptions").select("*");

        if (payload.user_id) {
            query = query.eq("user_id", payload.user_id);
        }

        const { data: subscriptions, error: subError } = await query;

        if (subError) throw subError;

        console.log(`Found ${subscriptions?.length || 0} subscriptions`);

        const results = await Promise.all(
            (subscriptions || []).map(async (sub) => {
                try {
                    const pushSubscription = {
                        endpoint: sub.endpoint,
                        keys: sub.keys,
                    };

                    await webpush.sendNotification(
                        pushSubscription,
                        JSON.stringify({
                            title: payload.title,
                            body: payload.body,
                            data: {
                                url: payload.url || "/",
                            },
                            tag: payload.tag || "default",
                        })
                    );
                    return { success: true, endpoint: sub.endpoint };
                } catch (err) {
                    console.error("Error sending to endpoint:", sub.endpoint, err);

                    // Se o endpoint não é mais válido, remover
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await supabaseClient
                            .from("push_subscriptions")
                            .delete()
                            .eq("id", sub.id);
                    }

                    return { success: false, endpoint: sub.endpoint, error: err.message };
                }
            })
        );

        const sentCount = results.filter((r) => r.success).length;

        return new Response(JSON.stringify({ success: true, sent: sentCount }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        console.error("Critical error in push function:", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
