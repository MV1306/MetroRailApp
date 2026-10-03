using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MetroRailApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTimetableAndTrainRuns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LineTimetables",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LineId = table.Column<int>(type: "int", nullable: false),
                    Direction = table.Column<int>(type: "int", nullable: false),
                    DayType = table.Column<int>(type: "int", nullable: false),
                    FirstDeparture = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastDeparture = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PeakStart = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PeakEnd = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PeakFrequencyMinutes = table.Column<int>(type: "int", nullable: false),
                    OffPeakFrequencyMinutes = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LineTimetables", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LineTimetables_Lines_LineId",
                        column: x => x.LineId,
                        principalTable: "Lines",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TrainRuns",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LineId = table.Column<int>(type: "int", nullable: false),
                    Direction = table.Column<int>(type: "int", nullable: false),
                    DepartureFromTerminal = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainRuns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrainRuns_Lines_LineId",
                        column: x => x.LineId,
                        principalTable: "Lines",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LineTimetables_LineId",
                table: "LineTimetables",
                column: "LineId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainRuns_LineId",
                table: "TrainRuns",
                column: "LineId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LineTimetables");

            migrationBuilder.DropTable(
                name: "TrainRuns");
        }
    }
}
