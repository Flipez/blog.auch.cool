---
title: "Clickhouse: Import compressed JSON fast"
date: 2024-10-21
tags: ["clickhouse", "mvg"]
showtoc: true
---
The [MVG Observatory Project](https://mvg.auch.cool) collects real-time departure data from Munich's public transport system.
The data is organized hierarchically: the top level contains date-based folders, each containing subfolders named after station IDs.
These station folders hold multiple JSON files that capture departure information throughout the day.

Each station's data is stored in two types of files: `*_body.json` and `*_meta.json`.
The body files contain either API error messages or JSON arrays of responses, which are imported into the `mvg.responses` table in Clickhouse.
The corresponding meta files store request metadata (sharing the same timestamp as their body files) and are imported into the `mvg.requests` table.

At the end of each day, the top-level folder is automatically archived into a zstd compressed file. To analyze this data, the contents must be imported into a Clickhouse database for processing.
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

The initial data processing solution, [mvg-analyser](https://github.com/Flipez/mvg-analyser/), is a Ruby script that extracts and processes data from [data.mvg.auch.cool](https://data.mvg.auch.cool) into Clickhouse. The script streams compressed archives directly into memory, avoiding the need to write decompressed files to disk.

However, both the request and response data lack essential contextual information. To facilitate debugging during analysis, each entry needs to be enriched with:
- DateTime (from the folder name)
- Station ID (from the subfolder name)
- Timestamp (from the file prefix)

The current workflow operates as follows:
1. Parse JSON from each file
2. Extract context from the filepath
3. Enrich the data by adding context to the hash object
4. Use clickhouse-ruby gem to serialize and submit via HTTP(S)

While the script reduces HTTP overhead by batching 100,000 entries before submission, it has several limitations:

### Bottlenecks

1. **Sequential Processing**
   - Current dataset: 250 archives containing ~270,000 files each
   - Single-threaded execution leaves most CPU cores idle

2. **Expensive Data Operations**
   - Each file requires individual JSON parsing
   - Data enrichment is performed on every record
   - High cumulative processing overhead across millions of files

3. **Language Limitations**
   - Ruby, while flexible, isn't optimized for high-performance data processing

### Benefits

1. **Resource Efficiency**
   - Minimal memory footprint
   - Safe interruption at archive boundaries
   - Checkpointing enables reliable resume functionality

### Current Performance Metrics
   - Environment: [Hetzner CX32](https://www.hetzner.com/cloud/)
   - Processing time: ~12 hours for a complete dataset

Even with more hardware, the only factor that would improve significantly the performance is clock speed.
So even with the dedicated server used below, the compute time would not improve much.

## Making it Fast: Leveraging Clickhouse's Native Capabilities
While the initial plan was to rewrite the tool in [Go](https://go.dev) with parallelization in mind, exploring Clickhouse's rich feature set revealed a more elegant solution.
The key breakthrough came from utilizing Clickhouse's built-in data handling functions.

### Direct File Processing
Clickhouse's [file](https://clickhouse.com/docs/en/sql-reference/table-functions/file) function enables direct data reading from various sources:

```sql
SELECT *
FROM file('cleaned/20240807/de:09162:1/1722990560_body.json')
LIMIT 1
```

```
   ┌─plannedDepartureTime─┬─realtime─┬─delayInMinutes─┬─realtimeDepartureTime─┬─transportType─┬─label─┬─divaId─┬─network─┬─trainType─┬─destination─┬─cancelled─┬─sev───┬─stopPositionNumber─┬─messages─┬─bannerHash─┬─occupancy─┬─stopPointGlobalId─┬─platform─┬─platformChanged─┐
1. │        1722990900000 │ true     │              0 │         1722990900000 │ TRAM          │ N17   │ 32917  │ swm     │           │ Effnerplatz │ false     │ false │                  2 │ []       │            │ LOW       │ de:09162:1:2:3    │     ᴺᵁᴸᴸ │ ᴺᵁᴸᴸ            │
   └──────────────────────┴──────────┴────────────────┴───────────────────────┴───────────────┴───────┴────────┴─────────┴───────────┴─────────────┴───────────┴───────┴────────────────────┴──────────┴────────────┴───────────┴───────────────────┴──────────┴─────────────────┘
```

This produces a nicely formatted table with all departure data.
The function also supports:
- Remote files via [url()](https://clickhouse.com/docs/en/sql-reference/table-functions/url) or [s3()](https://clickhouse.com/docs/en/sql-reference/table-functions/s3) functions
- Automatic file format detection (CSV, JSON, Parquet)
- Direct reading of compressed files with automatic format detection
- Native Zstandard support

### Archived File Processing
But as mentioned earlier, one major benefit of our initial tool is direct in-memory processing of the data, and decompressing it would take quite a lot of disk space.
Luckily, Clickhouse can read from compressed files (the compression algorithm is automatically detected), and Zstandard is of course supported.

```sql
SELECT *
FROM file('cleaned/20240807.tar.zst')
LIMIT 1
```

```
   ┌─c1─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
1. │ 20240807/0000755000000000000000000000000014654534474010502 5ustar  rootroot20240807/de:09162:1/0000755000000000000000000000000014655005141011722 5ustar  rootroot20240807/de:09162:1/1722988805_body.json0000644000000000000000000002504314654534407014752 |
   └────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

But that does no longer look like the nicely formatted table we got when parsing the file directly.
That is due to the fact that Clickhouse expects only one file in the archive to be parsed.
Not only do we have multiple files in different subfolders, we also have two types of files (requests and responses) that we want to import into different tables.

But there is a solution for that: Since [Clickhouse 23.8](https://clickhouse.com/blog/clickhouse-release-23-08#direct-import-from-archives-nikita-keba-antonio-andelic-pavel-kruglov), `file()` supports specifying the `path` attribute that also supports [globs](https://clickhouse.com/docs/en/sql-reference/table-functions/file#globs-in-path).
That means we can explicitly filter for our `_meta.json` and `_body.json` files like so:

```sql
SELECT *
FROM file('*.tar.zst :: */*/*_body.json')
LIMIT 1
```

```
   ┌─plannedDepartureTime─┬─realtime─┬─delayInMinutes─┬─realtimeDepartureTime─┬─transportType─┬─label─┬─divaId─┬─network─┬─trainType─┬─destination─────────┬─cancelled─┬─sev───┬─stopPositionNumber─┬─messages─┬─bannerHash─┬─occupancy─┬─stopPointGlobalId─┬─platform─┬─platformChanged─┐
1. │        1713052800000 │ true     │              1 │         1713052860000 │ BUS           │ N40   │ 33N40  │ swm     │           │ Klinikum Großhadern │ false     │ false │                  8 │ []       │            │ LOW       │ de:09162:1:7:7    │     ᴺᵁᴸᴸ │ ᴺᵁᴸᴸ            │
   └──────────────────────┴──────────┴────────────────┴───────────────────────┴───────────────┴───────┴────────┴─────────┴───────────┴─────────────────────┴───────────┴───────┴────────────────────┴──────────┴────────────┴───────────┴───────────────────┴──────────┴─────────────────┘
```

### Data Enrichment
That is almost everything we need.
But if we remember that the main reason for parsing the JSON in the first place was to enrich the entry, we notice that these three fields are still missing.
In the Ruby tool, that information is parsed from the filename, and coincidentally, Clickhouse provides a `_file` variable when using the `file()` function with a path.
We can use it like this:

```sql
SELECT _file
FROM file('*.tar.zst :: */*/*_body.json')
LIMIT 1
```
```
   ┌─_file────────────────────────────────────┐
1. │ 20240414/de:09162:1/1713052847_body.json │
   └──────────────────────────────────────────┘
```

Together with some Clickhouse functions, we can parse the three required fields from the path:

```sql
SELECT
    splitByChar('/', _file)[2]                      AS station,
    splitByChar('_', splitByChar('/', _file)[3])[1] AS timestamp,
    splitByChar('/', _file)[1]                      AS datestring
FROM file('*.tar.zst :: */*/*_body.json')
LIMIT 1
```
```
   ┌─station────┬─timestamp──┬─datestring─┐
1. │ de:09162:1 │ 1713052847 │ 20240414   │
   └────────────┴────────────┴────────────┘
```

### Final Solution
With everything being assembled together (we need to specify what goes in which column) and also converting nanoseconds to seconds, the final query looks like this:

#### Responses
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

#### Requests
```sql
INSERT INTO mvg.requests
(
  station,
  timestamp,
  datestring,
  appconnect_time,
  connect_time,
  httpauth_avail,
  namelookup_time,
  pretransfer_time,
  primary_ip,
  redirect_count,
  redirect_url,
  request_size,
  request_url,
  response_code,
  return_code,
  return_message,
  size_download,
  size_upload,
  starttransfer_time,
  total_time,
  headers,
  request_params,
  request_header
)
SELECT
    splitByChar('/', _file)[2],
    splitByChar('_', splitByChar('/', _file)[3])[1],
    splitByChar('/', _file)[1],
    appconnect_time,
    connect_time,
    httpauth_avail,
    namelookup_time,
    pretransfer_time,
    primary_ip,
    redirect_count,
    redirect_url,
    request_size,
    request_url,
    response_code,
    return_code,
    return_message,
    size_download,
    size_upload,
    starttransfer_time,
    total_time,
    headers,
    request_params,
    request_header
FROM file('*.tar.zst :: */*/*_meta.json', 'JSONEachRow')
SETTINGS input_format_allow_errors_ratio = 1
```

`SETTINGS input_format_allow_errors_ratio = 1;` is provided because some files do not contain JSON, but the earlier mentioned error messages, we just ignore them.

## Results
And just like Clickhouse was made for efficiently processing large amounts of data, it processes multiple archives in parallel and allows for the utilization of much more hardware.
Therefore, I upgraded the initial CX32 to (relatively speaking) much beefier machines, and with a dedicated server the whole import finishes in just 60 minutes for the responses and 50 minutes for the requests.

- CCX33 (Hetzner Cloud, dedicated CPU, 8 threads, 32 GB memory)
```
0 rows in set. Elapsed: 5392.159 sec. Processed 977.30 million rows, 362.32 GB (181.24 thousand rows/s., 67.19 MB/s.)
Peak memory usage: 4.47 GiB.
```
The request import was unable to be completed because, for some reason, the peak memory usage is much higher than for the responses (4.56 GB vs. 55.63 GB).

- Dedicated Server (Hetzner, i7-8700, 12 threads, 128 GB memory)
```
Elapsed: 3630.785 sec. Processed 977.30 million rows, 362.32 GB (269.17 thousand rows/s., 99.79 MB/s.)
Peak memory usage: 4.56 GiB.
```
```
Elapsed: 3117.311 sec. Processed 33.59 million rows, 37.85 GB (10.78 thousand rows/s., 12.14 MB/s.)
Peak memory usage: 55.63 GiB.
```

Overall we saved about **83%** processing time and also a whole Ruby script with one single SQL query.

## Appendix
The following database schema is using for `mvg.requests` and `mvg.responses`

```sql
CREATE TABLE mvg.responses
(
    `datestring` Date CODEC(Delta(2), ZSTD(3)),
    `timestamp` DateTime CODEC(Delta(4), ZSTD(3)),
    `station` LowCardinality(String) CODEC(ZSTD(3)),
    `plannedDepartureTime` DateTime CODEC(Delta(4), ZSTD(3)),
    `realtime` Bool CODEC(ZSTD(3)),
    `delayInMinutes` Int32 CODEC(ZSTD(3)),
    `realtimeDepartureTime` DateTime CODEC(Delta(4), ZSTD(3)),
    `transportType` LowCardinality(String) CODEC(ZSTD(3)),
    `label` LowCardinality(String) CODEC(ZSTD(3)),
    `divaId` LowCardinality(String) CODEC(ZSTD(3)),
    `network` LowCardinality(String) CODEC(ZSTD(3)),
    `trainType` String CODEC(ZSTD(3)),
    `destination` LowCardinality(String) CODEC(ZSTD(3)),
    `cancelled` Bool CODEC(ZSTD(3)),
    `sev` Bool CODEC(ZSTD(3)),
    `platform` Int32 CODEC(ZSTD(3)),
    `platformChanged` Bool CODEC(ZSTD(3)),
    `stopPositionNumber` Int32 CODEC(ZSTD(3)),
    `messages` String CODEC(ZSTD(3)),
    `bannerHash` String CODEC(ZSTD(3)),
    `occupancy` LowCardinality(String) CODEC(ZSTD(3)),
    `stopPointGlobalId` String CODEC(ZSTD(3))
)
ENGINE = MergeTree
PARTITION BY datestring
ORDER BY (label, destination, station, plannedDepartureTime, timestamp)
```

```sql
CREATE TABLE mvg.requests
(
    `datestring` Date CODEC(Delta(2), ZSTD(3)),
    `timestamp` DateTime CODEC(Delta(4), ZSTD(3)),
    `station` LowCardinality(String) CODEC(ZSTD(3)),
    `appconnect_time` Float64 CODEC(ZSTD(3)),
    `connect_time` Float64 CODEC(ZSTD(3)),
    `httpauth_avail` Int32 CODEC(ZSTD(3)),
    `namelookup_time` Float64 CODEC(ZSTD(3)),
    `pretransfer_time` Float64 CODEC(ZSTD(3)),
    `primary_ip` LowCardinality(String) CODEC(ZSTD(3)),
    `redirect_count` Int32 CODEC(ZSTD(3)),
    `redirect_url` String CODEC(ZSTD(3)),
    `request_size` Int32 CODEC(ZSTD(3)),
    `request_url` String CODEC(ZSTD(3)),
    `response_code` Int16 CODEC(ZSTD(3)),
    `return_code` LowCardinality(String) CODEC(ZSTD(3)),
    `return_message` LowCardinality(String) CODEC(ZSTD(3)),
    `size_download` Float32 CODEC(ZSTD(3)),
    `size_upload` Float32 CODEC(ZSTD(3)),
    `starttransfer_time` Float32 CODEC(ZSTD(3)),
    `total_time` Float32 CODEC(ZSTD(3)),
    `headers` String CODEC(ZSTD(3)),
    `request_params` String CODEC(ZSTD(3)),
    `request_header` String CODEC(ZSTD(3))
)
ENGINE = MergeTree
PARTITION BY datestring
ORDER BY (station, timestamp)
```