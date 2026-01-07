import { useEffect, useState } from "react";
import { getAssets, getTickets, createTicket } from "./api";

function App() {
  // --------------------
  // Core data
  // --------------------
  const [assets, setAssets] = useState([]);
  const [tickets, setTickets] = useState([]);

  // --------------------
  // Role (RBAC demo)
  // --------------------
  const [role, setRole] = useState("Engineer");

  // --------------------
  // Asset creation (Admin)
  // --------------------
  const [assetName, setAssetName] = useState("");
  const [assetCategory, setAssetCategory] = useState("");
  const [assetStatus, setAssetStatus] = useState("Available");

  // --------------------
  // Ticket creation (Engineer)
  // --------------------
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState("");

  // --------------------
  // Chatbot
  // --------------------
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  // --------------------
  // Load data
  // --------------------
  useEffect(() => {
    refreshData();
  }, [role]);

  function refreshData() {
    getAssets(role).then(setAssets);
    getTickets(role).then(setTickets);
  }

  // --------------------
  // Create Asset (Admin)
  // --------------------
  async function handleCreateAsset(e) {
    e.preventDefault();

    await fetch("http://localhost:5284/assets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Role": role
      },
      body: JSON.stringify({
        name: assetName,
        category: assetCategory,
        status: assetStatus
      })
    });

    setAssetName("");
    setAssetCategory("");
    setAssetStatus("Available");
    refreshData();
  }

  // --------------------
  // Create Ticket (Engineer)
  // --------------------
  async function handleCreateTicket(e) {
    e.preventDefault();

    await createTicket(
      {
        title,
        description,
        assetId: Number(selectedAssetId),
        status: "Open"
      },
      role
    );

    setTitle("");
    setDescription("");
    setSelectedAssetId("");
    refreshData();
  }

  // --------------------
  // Update Ticket Status (Technician)
  // --------------------
  async function updateStatus(id, newStatus) {
    await fetch(
      `http://localhost:5284/tickets/${id}/status?newStatus=${newStatus}`,
      {
        method: "PATCH",
        headers: {
          "X-User-Role": role
        }
      }
    );

    refreshData();
  }

  // --------------------
  // Chatbot logic
  // --------------------
  function handleAsk() {
  const q = question.toLowerCase();

  if (q.includes("how many tickets") || q.includes("total tickets")) {
    setAnswer(`There are ${tickets.length} tickets in total.`);
  }
  else if (q.includes("open tickets")) {
    const count = tickets.filter(t => t.status === "Open").length;
    setAnswer(`There are ${count} open tickets.`);
  }
  else if (q.includes("broken assets")) {
    const broken = assets.filter(a => a.status === "Broken").length;
    setAnswer(`There are ${broken} broken assets.`);
  }
  else if (q.includes("total assets") || q.includes("how many assets")) {
    setAnswer(`Total assets: ${assets.length}`);
  }
  else {
    setAnswer(
      "I can answer questions like: open tickets, total tickets, broken assets, total assets."
    );
  }
}
  // --------------------
  // UI
  // --------------------
  return (
    <div className="container">
      <h1>LabTrack Lite</h1>

      {/* Role selector */}
      <div style={{ marginBottom: 20 }}>
        <label>
          Role:&nbsp;
          <select value={role} onChange={e => setRole(e.target.value)}>
            <option value="Admin">Admin</option>
            <option value="Engineer">Engineer</option>
            <option value="Technician">Technician</option>
          </select>
        </label>
      </div>

      {/* ================= ASSETS ================= */}
      <h2>Assets</h2>

      {role === "Admin" && (
        <>
          <h3>Create Asset (Admin only)</h3>
          <form onSubmit={handleCreateAsset}>
            <input
              placeholder="Asset name"
              value={assetName}
              onChange={e => setAssetName(e.target.value)}
              required
            />
            <input
              placeholder="Category"
              value={assetCategory}
              onChange={e => setAssetCategory(e.target.value)}
              required
            />
            <select
              value={assetStatus}
              onChange={e => setAssetStatus(e.target.value)}
            >
              <option value="Available">Available</option>
              <option value="InUse">In Use</option>
              <option value="Broken">Broken</option>
            </select>
            <button type="submit">Create Asset</button>
          </form>
        </>
      )}

      {assets.length === 0 && <p>No assets found.</p>}
      {assets.map(asset => (
        <div className="card" key={asset.id}>
          <strong>{asset.name}</strong>
          <p>{asset.category}</p>
          <span className="badge open">{asset.status}</span>
        </div>
      ))}

      {/* ================= TICKETS ================= */}
      <h2>Create Ticket</h2>

      {role === "Engineer" && (
        <form onSubmit={handleCreateTicket}>
          <input
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
          />
          <select
            value={selectedAssetId}
            onChange={e => setSelectedAssetId(e.target.value)}
            required
          >
            <option value="">Select Asset</option>
            {assets.map(asset => (
              <option key={asset.id} value={asset.id}>
                {asset.name}
              </option>
            ))}
          </select>
          <button type="submit">Create Ticket</button>
        </form>
      )}

      <h2>Tickets</h2>
      {tickets.length === 0 && <p>No tickets found.</p>}
      {tickets.map(ticket => (
        <div className="card" key={ticket.id}>
          <strong>{ticket.title}</strong>
          <span
            className={`badge ${
              ticket.status === "Open"
                ? "open"
                : ticket.status === "InProgress"
                ? "inprogress"
                : "closed"
            }`}
          >
            {ticket.status}
          </span>
          <p>{ticket.description}</p>

          {role === "Technician" && ticket.status === "Open" && (
            <button onClick={() => updateStatus(ticket.id, "InProgress")}>
              Start Work
            </button>
          )}

          {role === "Technician" && ticket.status === "InProgress" && (
            <button onClick={() => updateStatus(ticket.id, "Closed")}>
              Close Ticket
            </button>
          )}
        </div>
      ))}

      {/* ================= CHATBOT ================= */}
      <h2>Chatbot</h2>
      <input
        placeholder="Ask something like: open tickets"
        value={question}
        onChange={e => setQuestion(e.target.value)}
      />
      <button onClick={handleAsk}>Ask</button>
      <p><strong>{answer}</strong></p>
    </div>
  );
}

export default App;
