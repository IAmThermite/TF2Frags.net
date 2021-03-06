# TF2Frags.net

[![Coverage Status](https://coveralls.io/repos/github/IAmThermite/TF2Frags.net/badge.svg?branch=master)](https://coveralls.io/github/IAmThermite/TF2Frags.net?branch=master)
[![Build Status](https://travis-ci.org/IAmThermite/TF2Frags.net.svg?branch=master)](https://travis-ci.org/IAmThermite/TF2Frags.net)

Code for [TF2Frags Website](https://tf2frags.net).

The mongodb database requires db.clips.createIndex({name:'text', description:'text'}) to be run in order for the search functionality to work.

## API Endpoints

### GET [/api/clips](https://tf2frags.net/api/clips)

Lists all clips in a condensed form, sorted by last uploaded

### GET /api/clips/:code

Lists details about specfic clip

### GET [/api/clips/count](https://tf2frags.net/api/clips/count)

Returns the amount of valid clips submitted

### POST /api/clips/ (requires authorization)

Add a clip

### PUT /api/clips/:\_id (requires authorization)

Updates the clip by id


## Limitations

Due to the way Twitch handles clips, there is no way that they can be controlled like the YouTube videos can be controlled. They are dissimilar from regular twitch vods (for some reason!) so cannot be controlled with the Twitch embed player api bindings like YouTube clips can be. There is a 30 sec max time on Twitch clips and then the next clip will be loaded regardless of whether it is actually finished or not (default clips duration is 28sec). YouTube videos must be [embedable](https://support.google.com/youtube/answer/171780?hl=en) (on by default) as well.

## Project Info

The goal of this project is not to make money off of anyone elses content. I will not be enabling Twitch ads or subs for this reason. The intention is to provide publicity to members of the community that create content and to bring a variety of content into one common place.

I do not assume to own any of the content that is uploaded to the website, it is owned by the original creators of that content. If someone wants their content removed I am more that happy to do so