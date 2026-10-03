using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MetroRailApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTicketPassengers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Passengers",
                table: "Tickets",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Passengers",
                table: "Tickets");
        }
    }
}
