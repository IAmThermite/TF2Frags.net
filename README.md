# TF2Frags.net
Code for TF2Frags Website

## API Schema

### GET /api/clips

Lists all clips

### GET /api/clips/:\_id (requires authorization)

Lists details about specfic clip

### GET /api/clips/count

Returns the amount of valid clips submitted

### GET /api/clips/queue

Returns the next 20 clips in the queue

### GET /api/clips/current

Returns extra information about the current clip

### GET /api/clips/previous

Returns some information about the previous clip

### POST /api/clips/next (requires authorization)

Updates the current clips and loads the next one

### POST /api/clips/:\_id (requires authorization)

Updates the clip by id
