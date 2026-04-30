const API_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjY1MjIzNjAwNiwiYWFpIjoxMSwidWlkIjo5NjQ3NjY4MCwiaWFkIjoiMjAyNi0wNC0zMFQxMTo0ODo0MS44NzZaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MzI1NTc4OTEsInJnbiI6ImV1YzEifQ.sflERYBS0sZEyZ_xoTDIAeTsAYXVKwyqJZVkZmY1Uhc";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
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
