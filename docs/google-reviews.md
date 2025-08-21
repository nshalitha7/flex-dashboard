# Google Reviews Integration Findings

## Feasibility

Google reviews can be accessed through two main options:

1. **Places API – Place Details endpoint**
   - Returns basic place information along with up to five most relevant reviews.
   - Requires a Google Cloud API key with Places API enabled.
   - Endpoint format:
     `https://maps.googleapis.com/maps/api/place/details/json?place_id=PLACE_ID&fields=name,place_id,reviews&key=API_KEY`
   - Returned review fields include:
     - `author_name`
     - `rating`
     - `text`
     - `time` (UNIX timestamp)
     - `author_url`
     - `profile_photo_url`
   - Suitable for displaying recent public feedback but limited to five reviews.

2. **Google Business Profile API**
   - Allows management of business listings and access to the full set of reviews.
   - Supports replying to reviews and fetching more than five results.
   - Requires a verified business profile and OAuth authentication.

For many dashboard scenarios, the Places API suffices for read only display of recent feedback. For complete review management, the Business Profile API is required.

## Implemented Example

This repository now contains a basic integration using the Places API. An API route `/api/reviews/google` fetches reviews for a given `placeId` and normalizes them into the internal `NormalizedReview` shape. The route expects the following environment variables:

- `GOOGLE_API_KEY` – Google Cloud API key.
- `GOOGLE_PLACE_ID` (optional) – default place ID if not provided in the request.

Query parameters such as `minRating`, `sort`, `page`, and `perPage` mirror those used for Hostaway reviews.

## Required Fields Mapping

| Normalized Field | Google Source Field |
| ---------------- | ------------------- |
| `authorName`     | `author_name`       |
| `rating`         | `rating`            |
| `content`        | `text`              |
| `submittedAt`    | `time`              |
| `listingId`      | `place_id`          |
| `listingName`    | `name`              |

## Notes

- Reviews are read only; updating or deleting requires the Business Profile API.
- Rate limits and billing apply according to the Google Maps Platform pricing.
- Additional fields (e.g., `author_url`, `profile_photo_url`) can be stored if needed.
