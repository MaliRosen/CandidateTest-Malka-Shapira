using Microsoft.AspNetCore.Mvc;
using Requests.Application.Requests;
using Requests.Domain.Entities;

namespace Requests.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RequestsController : ControllerBase
{
    private static readonly string[] AllowedSortFields =
        ["Id", "RequestNumber", "Status", "RequestType", "CreatedAt", "OwnerId"];

    private readonly IRequestService _service;

    public RequestsController(IRequestService service)
    {
        _service = service;
    }

    // For the exercise, the current user is supplied through headers:
    // X-User-Id: integer
    // X-Is-Admin: true|false
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<RequestDto>>> Get(
        CancellationToken cancellationToken)
    {
        var userIdHeader = Request.Headers["X-User-Id"].FirstOrDefault();
        if (!int.TryParse(userIdHeader, out var userId))
            return BadRequest("X-User-Id header is required and must be a valid integer");

        var isAdmin = string.Equals(
            Request.Headers["X-Is-Admin"].FirstOrDefault(),
            "true",
            StringComparison.OrdinalIgnoreCase);

        var result = await _service.GetRequestsAsync(userId, isAdmin, cancellationToken);
        return Ok(result);
    }

    [HttpGet("search")]
    public async Task<ActionResult<PagedResult<RequestDto>>> Search(
        [FromQuery] SearchRequestsQuery query,
        CancellationToken cancellationToken)
    {
        // Validate X-User-Id header
        var userIdHeader = Request.Headers["X-User-Id"].FirstOrDefault();
        if (!int.TryParse(userIdHeader, out var userId))
            return BadRequest("X-User-Id header is required and must be a valid integer");

        var isAdmin = string.Equals(
            Request.Headers["X-Is-Admin"].FirstOrDefault(),
            "true",
            StringComparison.OrdinalIgnoreCase);

        // Validate model state (handles enum binding failures for Status and RequestType)
        if (!ModelState.IsValid)
        {
            var allowedStatuses = string.Join(", ", Enum.GetNames<RequestStatus>());
            var allowedTypes = string.Join(", ", Enum.GetNames<RequestType>());
            return BadRequest(
                $"Invalid enum value. Allowed Status values: {allowedStatuses}. " +
                $"Allowed RequestType values: {allowedTypes}.");
        }

        // Validate pagination
        if (query.Page < 1 || query.PageSize < 1 || query.PageSize > 200)
            return BadRequest(
                "page must be >= 1, pageSize must be between 1 and 200.");

        // Validate date range
        if (query.CreatedFrom.HasValue && query.CreatedTo.HasValue
            && query.CreatedFrom.Value > query.CreatedTo.Value)
            return BadRequest("createdFrom must not be later than createdTo.");

        // Validate sortBy
        if (!AllowedSortFields.Contains(query.SortBy, StringComparer.OrdinalIgnoreCase))
            return BadRequest(
                $"Invalid sortBy value '{query.SortBy}'. Allowed values: {string.Join(", ", AllowedSortFields)}.");

        // Validate sortDirection
        if (!string.Equals(query.SortDirection, "asc", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(query.SortDirection, "desc", StringComparison.OrdinalIgnoreCase))
            return BadRequest("sortDirection must be 'asc' or 'desc'.");

        var result = await _service.SearchAsync(query, userId, isAdmin, cancellationToken);
        return Ok(result);
    }
}
