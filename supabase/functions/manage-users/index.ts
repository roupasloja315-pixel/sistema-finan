import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action } = body;

    if (action === "init") {
      const { count } = await supabaseAdmin
        .from("profiles")
        .select("*", { count: "exact", head: true });

      if (count && count > 0) {
        return jsonResponse({ error: "Users already initialized" }, 400);
      }

      // Create admin user
      const { data: adminData, error: adminError } =
        await supabaseAdmin.auth.admin.createUser({
          email: "cleitonmaster@gmail.com",
          password: "master123456",
          email_confirm: true,
        });
      if (adminError) throw adminError;

      await supabaseAdmin.from("profiles").insert({
        id: adminData.user.id,
        email: "cleitonmaster@gmail.com",
        role: "admin",
      });

      // Create regular user
      const { data: userData, error: userError } =
        await supabaseAdmin.auth.admin.createUser({
          email: "tecnocar@gmail.com",
          password: "tecnocar321.",
          email_confirm: true,
        });
      if (userError) throw userError;

      await supabaseAdmin.from("profiles").insert({
        id: userData.user.id,
        email: "tecnocar@gmail.com",
        role: "user",
      });

      const userId = userData.user.id;
      await supabaseAdmin
        .from("expenses")
        .update({ user_id: userId })
        .is("user_id", null);
      await supabaseAdmin
        .from("revenues")
        .update({ user_id: userId })
        .is("user_id", null);
      await supabaseAdmin
        .from("units")
        .update({ user_id: userId })
        .is("user_id", null);
      await supabaseAdmin
        .from("categories")
        .update({ user_id: userId })
        .is("user_id", null);
      await supabaseAdmin
        .from("subcategories")
        .update({ user_id: userId })
        .is("user_id", null);
      await supabaseAdmin
        .from("expense_types")
        .update({ user_id: userId })
        .is("user_id", null);

      return jsonResponse({ success: true, message: "Users initialized" });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return jsonResponse({ error: "Invalid token" }, 401);
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.role !== "admin") {
      return jsonResponse({ error: "Admin access required" }, 403);
    }

    if (action === "list") {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      return jsonResponse({ users: profiles || [] });
    }

    if (action === "create") {
      const { email, password } = body;
      if (!email || !password) {
        return jsonResponse({ error: "Email and password required" }, 400);
      }

      const { data: newUser, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

      if (createError) {
        return jsonResponse({ error: createError.message }, 400);
      }

      if (!newUser?.user) {
        return jsonResponse({ error: "Failed to create auth user" }, 500);
      }

      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: newUser.user.id,
          email,
          role: "user",
        });

      if (profileError) {
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
        return jsonResponse({ error: "Failed to create profile: " + profileError.message }, 500);
      }

      return jsonResponse({
        success: true,
        user: { id: newUser.user.id, email },
      });
    }

    if (action === "delete") {
      const { userId } = body;
      if (!userId) {
        return jsonResponse({ error: "userId required" }, 400);
      }
      if (userId === user.id) {
        return jsonResponse({ error: "Cannot delete yourself" }, 400);
      }

      await supabaseAdmin.from("profiles").delete().eq("id", userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);

      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Invalid action" }, 400);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
