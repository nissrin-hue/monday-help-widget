exports.handler = async (event) => {
  const { code, error } = event.queryStringParameters || {};

  if (error) {
    return {
      statusCode: 302,
      headers: { Location: `/?error=${error}` },
    };
  }

  if (!code) {
    return {
      statusCode: 302,
      headers: { Location: "/?error=no_code" },
    };
  }

  try {
    const params = new URLSearchParams();
    params.append("client_id",     process.env.MONDAY_CLIENT_ID);
    params.append("client_secret", process.env.MONDAY_CLIENT_SECRET);
    params.append("redirect_uri",  process.env.MONDAY_REDIRECT_URI);
    params.append("code",          code);

    const response = await fetch("https://auth.monday.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return {
        statusCode: 302,
        headers: { Location: "/?error=parse_failed" },
      };
    }

    if (!data.access_token) {
      return {
        statusCode: 302,
        headers: { Location: `/?error=${data.error || "no_token"}` },
      };
    }

    return {
      statusCode: 302,
      headers: {
        Location: `/?token=${data.access_token}`,
      },
    };
  } catch (err) {
    return {
      statusCode: 302,
      headers: { Location: `/?error=${encodeURIComponent(err.message)}` },
    };
  }
};
