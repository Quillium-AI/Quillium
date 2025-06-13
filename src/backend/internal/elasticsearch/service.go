package elasticsearch

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"

	"github.com/elastic/go-elasticsearch/v8"
	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/chats"
	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/db"
)

// Initialize creates the Elasticsearch client
func Initialize(addresses []string, username, password string) (*elasticsearch.Client, error) {
	cfg := elasticsearch.Config{
		Addresses: addresses,
		Username:  username,
		Password:  password,
	}

	client, err := elasticsearch.NewClient(cfg)
	if err != nil {
		return nil, fmt.Errorf("error creating the client: %s", err)
	}
	return client, nil
}

func SearchElasticSearch(dbConn *db.DB, query string, limit int, msgNum int) ([]chats.Source, error) {
	adminSettings, err := dbConn.GetAdminSettings()
	if err != nil {
		return nil, err
	}

	client, err := Initialize([]string{adminSettings.ElasticsearchURL}, adminSettings.ElasticsearchUsername, adminSettings.ElasticsearchPassword)
	if err != nil {
		return nil, err
	}

	elasticQuery := map[string]interface{}{
		"query": map[string]interface{}{
			"multi_match": map[string]interface{}{
				"query":    query,
				"fields":   []string{"title^3", "snippet^2", "full_content"}, // ^n boosts the field
				"type":     "best_fields",                                    // or "most_fields", "phrase", "phrase_prefix", "cross_fields"
				"operator": "or",
			},
		},
	}

	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(elasticQuery); err != nil {
		return nil, err
	}

	res, err := client.Search(
		client.Search.WithContext(context.Background()),
		client.Search.WithIndex(adminSettings.CrawlerIndexName),
		client.Search.WithBody(&buf),
		client.Search.WithTrackTotalHits(true),
		client.Search.WithSize(limit),
		client.Search.WithPretty(),
	)
	if err != nil {
		return nil, err
	}

	var searchRes SearchResponse
	if err := json.NewDecoder(res.Body).Decode(&searchRes); err != nil {
		return nil, fmt.Errorf("error parsing the response body: %s", err)
	}

	var results []chats.Source
	for _, hit := range searchRes.Hits.Hits {
		results = append(results, chats.Source{
			Title:       hit.Source["title"].(string),
			URL:         hit.Source["url"].(string),
			Snippet:     hit.Source["snippet"].(string),
			FullContent: hit.Source["full_content"].(string),
			MsgNum:      msgNum,
		})
	}

	return results, nil
}
