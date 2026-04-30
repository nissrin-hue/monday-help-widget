exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const API_TOKEN = process.env.MONDAY_API_TOKEN;

  if (!API_TOKEN) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API token not configured" }),
    };
  }

  try {
    const { query, variables } = JSON.parse(event.body);

    const response = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": API_TOKEN,
        "API-Version": "2024-01",
      },
      body: JSON.stringify({ query, variables }),
    });

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
