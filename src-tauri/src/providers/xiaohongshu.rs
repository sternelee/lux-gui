use regex::Regex;
use reqwest::header::HeaderMap;
use serde_json;
use std::collections::HashMap;
use url::Url;

const FAKE_HEADERS: [(&str, &str); 5] = [
    ("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"),
    ("Accept-Charset", "UTF-8,*;q=0.5"),
    ("Accept-Encoding", "gzip,deflate,sdch"),
    ("Accept-Language", "en-US,en;q=0.8"),
    ("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.81 Safari/537.36"),
];

pub struct Extractor;

impl Extractor {
    pub fn new() -> Self {
        Extractor
    }

    pub async fn extract(&self, url: &str) -> Result<Vec<ExtractorData>, Box<dyn std::error::Error>> {
        let client = reqwest::Client::new();

        let mut headers = HeaderMap::new();

        for (key, value) in FAKE_HEADERS.iter() {
            headers.insert(*key, value.parse()?);
        }

        let html = client
            .get(url)
            .headers(headers)
            .send()
            .await?
            .text()
            .await?;

        // title
        let title_regex = Regex::new(r"<title>(.*?)</title>")?;
        let title = if let Some(caps) = title_regex.captures(&html) {
            caps.get(1).map_or("", |m| m.as_str())
        } else {
            return Err("Failed to parse title".into());
        };

        // video url
        let urls_regex = Regex::new(r#""backupUrls":(\[.+?\])"#)?;
        let urls_json = if let Some(caps) = urls_regex.captures(&html) {
            caps.get(1).map_or("", |m| m.as_str())
        } else {
            return Err("Failed to parse video URLs".into());
        };

        let urls: Vec<String> = serde_json::from_str(urls_json)?;

        let parsed_url = Url::parse(url)?;

        let mut streams: HashMap<String, Stream> = HashMap::new();

        for (i, video_url) in urls.iter().enumerate() {
            if !video_url.contains("mp4") {
                continue;
            }

            let size = self.get_video_size(video_url).await?;

            // 判断是否符合条件
            if parsed_url.host_str() == Some("xhslink.com") && video_url.contains("sns-video-qc") {
                // 自定义逻辑
            }

            streams.insert(
                i.to_string(),
                Stream {
                    parts: vec![Part {
                        url: video_url.clone(),
                        size,
                        ext: "mp4".to_string(),
                    }],
                    size,
                },
            );
        }

        if streams.is_empty() {
            return Err("No valid streams found".into());
        }

        Ok(vec![ExtractorData {
            site: "小红书 xiaohongshu.com".to_string(),
            title: title.to_string(),
            type_: "video".to_string(),
            streams,
            url: url.to_string(),
        }])
    }

    async fn get_video_size(&self, url: &str) -> Result<u64, Box<dyn std::error::Error>> {
        let response = reqwest::Client::new().head(url).send().await?;
        if let Some(size) = response.content_length() {
            Ok(size)
        } else {
            Err("Failed to get video size".into())
        }
    }
}

struct ExtractorData {
    site: String,
    title: String,
    type_: String,
    streams: HashMap<String, Stream>,
    url: String,
}

struct Stream {
    parts: Vec<Part>,
    size: u64,
}

struct Part {
    url: String,
    size: u64,
    ext: String,
}

// #[tokio::main]
// async fn main() {
//     let extractor = Extractor::new();
//     match extractor.extract("http://example.com").await {
//         Ok(data) => println!("{:?}", data),
//         Err(e) => eprintln!("Error: {:?}", e),
//     }
// }
