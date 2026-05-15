using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkillsHub.API.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLocationAvailability : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Availability",
                table: "EmployeeProfiles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Location",
                table: "EmployeeProfiles",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Availability",
                table: "EmployeeProfiles");

            migrationBuilder.DropColumn(
                name: "Location",
                table: "EmployeeProfiles");
        }
    }
}
