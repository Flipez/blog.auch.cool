---
title: "Clickhouse: Import compressed JSON fast"
date: 2024-10-21
tags: ["clickhouse", "mvg"]
showtoc: true
---
As part of the [MVG Observatory Project](https://mvg.auch.cool) I collect departures of the Munich public transport.
These departures are stored on the filesystem in the following structure:

```
20240615/
├── de:09162:1
│   ├── 1718409659_body.json
│   ├── 1718409659_meta.json
```

Top level is the date and the subfolder includes multiple stations (with their id as the folder name).
Each station includes lots of single files.
Every day the top level folder gets archived into a zstd compressed file.
To analyse the data, the content has to be imported into Clickhouse.

## Status Quo: mvg-analyser

Initially I wrote a simple Ruby script, the [mvg-analyser](https://github.com/Flipez/mvg-analyser/) to extract the files and insert them into Clickhouse.
The program has a `stream` method that is used to process all files "on the fly", meaning avoiding to write any uncompressed content to the filesystem.

```ruby
def stream(file, &block)
  ZSTDS::Stream::Reader.open file do |reader|
    Minitar::Reader.open reader do |tar|
      tar.each_entry(&block)
    end
  end
end
```

The interesting part starts at the `export_file()` method.
While streaming through the archive, the file name is important to decide if the entry is handled as a response (from the API) or the request (to the API).

```ruby
def export_file(filename, filepath)
  bar = multibar.register("[:bar] #{filename} @ :rate inserts/s")

  stream(filepath) do |entry|
    if entry.name.end_with? "body.json"
      insert_response(entry, bar)
    elsif entry.name.end_with? "meta.json"
      insert_request(entry, bar)
    end
  end
end
```

This is followed by the `insert_response()` which looks like this (some context has been removed for simplicity).
It loads the JSON and goes through each of the response entries.
Each response file typically contains an array with up to 30 hashes.

```ruby
def insert_response(entry, bar)
  content = Oj.load(entry.read)

  content = content.each_with_index.map do |response, idx|
    enrich_hash(entry, response, idx)
  end

  ...
end
```

You might wondering: "Why parsing the JSON?" when [Clickhouse supports importing JSON](https://clickhouse.com/docs/en/faq/integration/json-import) already?
The reason is the call to `enrich_hash()` which does exactly what it sounds like: enrich each hash which additional information.
Specifically, the filename is parsed and a `datestring` (the date when the request was made), `station` (the id of the station which was requested) and the `timestamp` (unix timestamp when the request was made) are extraced.
They are added as additional attributes to the response hash like so:

```ruby
def enrich_hash(entry, hash, idx = nil)
  split      = entry.name.split("/")
  datestring = split[0].to_i
  station    = split[1]
  timestamp  = split[2].split("_")[0].to_i

  hash.each do |key, value|
    hash[key] = value.to_json if value.is_a?(Array) || value.is_a?(Hash)
  end

  hash["datestring"] = datestring
  hash["station"] = station
  hash["timestamp"] = timestamp

  hash
end
```

While not really needed for later analysis, these three fields are handy when it comes to debugging.
With these you can directly and easy identify from which archive and specific file a response was imported.
When something looks of it is possible to look up the raw source data quickly.

If you are used to Ruby or software engineering in general, you might have spotted several issues with that already.


### Bottleneck #1
There are currently 250 archives, each including approximately 270.000 files.
While this is not particularely much, the first issue is sequencial processing.
The single-threaded Ruby process loops through all the files one after another while all but one CPU core are idling.

### Bottleneck #2
The still single-threaded program has to parse each and every file, add some stuff to it and submits it to Clickhouse.
Parsing the JSON is a relatively expensive tasks and adds up to the bigges bottleneck when running the app.

### Bottleneck #3
Probably arguable but in the end it is still Ruby and not some high performance, low level language that has been optimized for tasks like this.

### Benefit #1
One big benefit is that this method requires basically no memory and also can be safely interrupted on checkpoints (eg. between to archives).

---

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

```
Elapsed: 3630.785 sec. Processed 977.30 million rows, 362.32 GB (269.17 thousand rows/s., 99.79 MB/s.)
Peak memory usage: 4.56 GiB.
```

```
Elapsed: 3117.311 sec. Processed 33.59 million rows, 37.85 GB (10.78 thousand rows/s., 12.14 MB/s.)
Peak memory usage: 55.63 GiB.
```