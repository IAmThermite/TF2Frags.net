# TF2Frags.net
Code for TF2Frags Website

## API Schema

### GET /api/clips

Lists a condensed version of all valid clips

### GET /api/clips/count

Returns the amount of valid clips submitted

### GET /api/clips/current

Returns extra information about the current clip

### GET /api/clips/type/:type

Retrieves the clips by type

### POST /api/clips/next (requires authorization)

Updates the current clips and loads the next on

### POST /api/clips/:\_id (requires authorization)

Updates the clip by id
