using Microsoft.EntityFrameworkCore;
using LabTrackLite.Models;

namespace LabTrackLite.Data
{
    public class LabTrackDbContext : DbContext
    {
        public LabTrackDbContext(DbContextOptions<LabTrackDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<Asset> Assets => Set<Asset>();
        public DbSet<Ticket> Tickets => Set<Ticket>();

        public DbSet<Comment> Comments => Set<Comment>();

    }
}
