const API_BASE = "/api";

export async function getAssets(role) {
  const res = await fetch(`${API_BASE}/assets`, {
    headers: {
      "X-User-Role": role
    }
  });

  if (!res.ok) {
    throw new Error("Failed to fetch assets");
  }

  return res.json();
}

export async function getTickets(role) {
  const res = await fetch(`${API_BASE}/tickets`, {
    headers: {
      "X-User-Role": role
    }
  });

  if (!res.ok) {
    throw new Error("Failed to fetch tickets");
  }

  return res.json();
}

export async function createTicket(ticket, role) {
  const res = await fetch(`${API_BASE}/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-Role": role
    },
    body: JSON.stringify(ticket)
  });

  if (!res.ok) {
    throw new Error("Forbidden");
  }

  return res.json();
}

