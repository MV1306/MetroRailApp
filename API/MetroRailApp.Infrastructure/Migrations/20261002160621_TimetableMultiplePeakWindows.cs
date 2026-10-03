using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MetroRailApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TimetableMultiplePeakWindows : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PeakEnd",
                table: "LineTimetables");

            migrationBuilder.RenameColumn(
                name: "PeakStart",
                table: "LineTimetables",
                newName: "PeakWindows");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PeakWindows",
                table: "LineTimetables",
                newName: "PeakStart");

            migrationBuilder.AddColumn<string>(
                name: "PeakEnd",
                table: "LineTimetables",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
