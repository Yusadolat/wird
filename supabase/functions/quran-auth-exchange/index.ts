const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function getOAuthConfig(useProduction: boolean) {
  if (useProduction) {
    return {
      clientId: Deno.env.get("QF_PROD_CLIENT_ID") ?? "",
      clientSecret: Deno.env.get("QF_PROD_CLIENT_SECRET") ?? "",
      baseUrl:
        Deno.env.get("QF_PROD_OAUTH_BASE_URL") ??
        "https://oauth2.quran.foundation",
    };
  }

  return {
    clientId: Deno.env.get("QF_PRELIVE_CLIENT_ID") ?? "",
    clientSecret: Deno.env.get("QF_PRELIVE_CLIENT_SECRET") ?? "",
    baseUrl:
      Deno.env.get("QF_PRELIVE_OAUTH_BASE_URL") ??
      "https://prelive-oauth2.quran.foundation",
  };
}

function buildBasicAuthHeader(clientId: string, clientSecret: string) {
  return `Basic ${btoa(`${clientId}:${clientSecret}`)}`;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      code = "",
      codeVerifier = "",
      redirectUri = "",
      useProduction = false,
    } = await request.json();

    const oauth = getOAuthConfig(Boolean(useProduction));

    if (!oauth.clientId || !oauth.clientSecret) {
      return Response.json(
        { error: "Quran OAuth credentials are not configured." },
        { headers: corsHeaders, status: 500 },
      );
    }

    const tokenResponse = await fetch(`${oauth.baseUrl}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: buildBasicAuthHeader(oauth.clientId, oauth.clientSecret),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: String(code),
        code_verifier: String(codeVerifier),
        redirect_uri: String(redirectUri),
        client_id: oauth.clientId,
      }),
    });

    const tokenPayload = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("[quran-auth-exchange] token exchange failed", tokenPayload);

      return Response.json(
        {
          error:
            tokenPayload.error_description ??
            tokenPayload.error ??
            "Unable to exchange Quran authorization code.",
        },
        { headers: corsHeaders, status: 400 },
      );
    }

    const userInfoResponse = await fetch(`${oauth.baseUrl}/userinfo`, {
      headers: {
        Authorization: `Bearer ${tokenPayload.access_token}`,
      },
    });

    const user = await userInfoResponse.json();

    if (!userInfoResponse.ok) {
      console.error("[quran-auth-exchange] userinfo failed", user);

      return Response.json(
        {
          error: "Token exchange succeeded, but user info could not be loaded.",
        },
        { headers: corsHeaders, status: 400 },
      );
    }

    return Response.json(
      {
        accessToken: tokenPayload.access_token ?? null,
        refreshToken: tokenPayload.refresh_token ?? null,
        idToken: tokenPayload.id_token ?? null,
        expiresIn: tokenPayload.expires_in ?? null,
        scope: tokenPayload.scope ?? null,
        user,
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error("[quran-auth-exchange] unexpected failure", error);

    return Response.json(
      {
        error: "Unexpected Quran authentication exchange failure.",
      },
      { headers: corsHeaders, status: 500 },
    );
  }
});
