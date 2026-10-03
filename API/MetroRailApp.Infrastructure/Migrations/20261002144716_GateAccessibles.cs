using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MetroRailApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class GateAccessibles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NearbyLandmark",
                table: "StationGates");

            migrationBuilder.AddColumn<string>(
                name: "Accessibles",
                table: "StationGates",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Accessibles",
                table: "StationGates");

            migrationBuilder.AddColumn<string>(
                name: "NearbyLandmark",
                table: "StationGates",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
