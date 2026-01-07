using LabTrackLite.Data;
using LabTrackLite.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy
                .WithOrigins("http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
});

// SQLite DbContext
builder.Services.AddDbContext<LabTrackDbContext>(options =>
    options.UseSqlite("Data Source=labtrack.db"));

var app = builder.Build();
app.UseCors("AllowFrontend");

// --------------------
// Helper: Get User Role
// --------------------
string GetUserRole(HttpContext context)
{
    return context.Request.Headers["X-User-Role"].FirstOrDefault()
           ?? "Technician";
}

// --------------------
// Create DB & Tables
// --------------------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<LabTrackDbContext>();
    db.Database.EnsureCreated();
}

// --------------------
// Middleware
// --------------------

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}


app.UseHttpsRedirection();

// --------------------
// Health Check
// --------------------
app.MapGet("/", () => "LabTrack Lite Backend is running 🚀");

// =======================
// ASSETS
// =======================

// GET all assets (ALL roles)
app.MapGet("/assets", async (LabTrackDbContext db) =>
{
    return await db.Assets.ToListAsync();
});

// POST asset (ADMIN only)
app.MapPost("/assets", async (
    Asset asset,
    LabTrackDbContext db,
    HttpContext context) =>
{
    if (GetUserRole(context) != "Admin")
        return Results.Forbid();

    db.Assets.Add(asset);
    await db.SaveChangesAsync();
    return Results.Created($"/assets/{asset.Id}", asset);
});

// =======================
// TICKETS
// =======================

// GET all tickets (ALL roles)
app.MapGet("/tickets", async (LabTrackDbContext db) =>
{
    return await db.Tickets.ToListAsync();
});

// POST ticket (ENGINEER only)
app.MapPost("/tickets", async (
    Ticket ticket,
    LabTrackDbContext db,
    HttpContext context) =>
{
    if (GetUserRole(context) != "Engineer")
        return Results.Forbid();

    db.Tickets.Add(ticket);
    await db.SaveChangesAsync();
    return Results.Created($"/tickets/{ticket.Id}", ticket);
});

// PATCH ticket status (TECHNICIAN only)
app.MapPatch("/tickets/{id}/status", async (
    int id,
    string newStatus,
    LabTrackDbContext db,
    HttpContext context) =>
{
    if (GetUserRole(context) != "Technician")
        return Results.Forbid();

    var ticket = await db.Tickets.FindAsync(id);
    if (ticket == null)
        return Results.NotFound("Ticket not found");

    if (ticket.Status == "Closed")
        return Results.BadRequest("Closed tickets cannot be updated");

    if (ticket.Status == "Open" && newStatus != "InProgress")
        return Results.BadRequest("Open → InProgress only");

    if (ticket.Status == "InProgress" && newStatus != "Closed")
        return Results.BadRequest("InProgress → Closed only");

    ticket.Status = newStatus;
    await db.SaveChangesAsync();

    return Results.Ok(ticket);
});

app.MapGet("/tickets/{id}/comments", async (
    int id,
    LabTrackDbContext db) =>
{
    return await db.Comments
        .Where(c => c.TicketId == id)
        .OrderBy(c => c.CreatedAt)
        .ToListAsync();
});

app.MapPost("/tickets/{id}/comments", async (
    int id,
    Comment comment,
    LabTrackDbContext db) =>
{
    comment.TicketId = id;
    db.Comments.Add(comment);
    await db.SaveChangesAsync();
    return Results.Created($"/tickets/{id}/comments/{comment.Id}", comment);
});

app.Run();