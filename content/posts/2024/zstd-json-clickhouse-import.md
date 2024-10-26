---
title: "Clickhouse: Import compressed JSON fast"
date: 2024-10-21
tags: ["clickhouse", "mvg"]
showtoc: true
---
As part of the [MVG Observatory Project](https://mvg.auch.cool) I collect departures of the Munich public transport.
Top level is the date and the subfolder includes multiple stations (with their id as the folder name).
Each station includes lots of single files.
Every day the top level folder gets archived into a zstd compressed file.
To analyse the data, the content has to be imported into Clickhouse.
The `*_body.json` files contain either an error message from the api or a JSON array with multiple **responses**, which will go into the `mvg.responses` table.
In the `*_meta.json` contains details about the one request that resulted in the body (thus the same timestamp in the file) which goes into the `mvg.requests` table.

```
20240615/
├── de:09162:1
│   ├── 1718409659_body.json
│   ├── 1718409659_meta.json
│   ├── ...
├── de:09166:1
│   ├── 1718409734_body.json
│   ├── 1718409734_meta.json
│   ├── ...
├── ...
```


## Status Quo: mvg-analyser

Initially I wrote a simple Ruby script, the [mvg-analyser](https://github.com/Flipez/mvg-analyser/) to extract the files and insert them into Clickhouse.
The tool streams over all archives in [data.mvg.auch.cool](https://data.mvg.auch.cool) and processes them on the fly without writing decompressed content to the filesystem.
One issue with both the requests and the responses is that they do not contain all information necessary.
To make debugging easier during the analytics, the folder name (DateTime), subfolder name (station id) and the file prefix (timestamp) need to be included in each entry.
Therefore the Ruby script parses the JSON of each file, parses the filepath and adds the information to the hash object.
The hash in then passed to the clickhouse-ruby gem which most likely serializes it again to submit it via a HTTP(S) request.
HTTP overhead is kept low by caching 100.000 entries locally before submitting them but parsing every entry is still a massive overhead.
Additionally the process only runs on a single core and can't really be parallized with the current design.

### Bottlenecks
- There are currently 250 archives, each including approximately 270.000 files.
While this is not particularely much, the first issue is sequencial processing.
The single-threaded Ruby process loops through all the files one after another while all but one CPU core are idling.

- The still single-threaded program has to parse each and every file, add some stuff to it and submits it to Clickhouse.
Parsing the JSON is a relatively expensive tasks and adds up to the bigges bottleneck when running the app.

- Probably arguable but in the end it is still Ruby and not some high performance, low level language that has been optimized for tasks like this.

### Benefits
- One big benefit is that this method requires basically no memory and also can be safely interrupted on checkpoints (eg. between to archives).

After all, importing the current dataset in Ruby takes about 12 hours on a [CX32 from Hetzner](https://www.hetzner.com/cloud/).
This is due to a combination of all the bottlenecks and the relatively low clock speed of the CPU used in the cloud servers.

## Making it fast

```sql
INSERT INTO mvg.responses
(
  plannedDepartureTime,
  realtime,
  delayInMinutes,
  realtimeDepartureTime,
  transportType,
  label,
  divaId,
  network,
  trainType,
  destination,
  cancelled,
  sev,
  stopPositionNumber,
  messages,
  bannerHash,
  occupancy,
  stopPointGlobalId,
  platform,
  platformChanged,
  station,
  timestamp,
  datestring
)

SELECT intDiv(plannedDepartureTime, 1000),
       realtime,
       delayInMinutes,
       intDiv(realtimeDepartureTime, 1000),
       transportType,
       label,
       divaId,
       network,
       trainType,
       destination,
       cancelled,
       sev,
       stopPositionNumber,
       messages,
       bannerHash,
       occupancy,
       stopPointGlobalId,
       platform,
       platformChanged,
       splitByChar('/', _file)[2],
       splitByChar('_', splitByChar('/', _file)[3])[1],
       splitByChar('/', _file)[1]

FROM file('*.tar.zst :: */*/*_body.json', 'JSONEachRow')
SETTINGS input_format_allow_errors_ratio = 1;
```
Responses:
```
Elapsed: 3630.785 sec. Processed 977.30 million rows, 362.32 GB (269.17 thousand rows/s., 99.79 MB/s.)
Peak memory usage: 4.56 GiB.
```
Requests:
```
Elapsed: 3117.311 sec. Processed 33.59 million rows, 37.85 GB (10.78 thousand rows/s., 12.14 MB/s.)
Peak memory usage: 55.63 GiB.
```