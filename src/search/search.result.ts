interface SearchResult {
    hits: {
      total: number;
      hits: Array<{
        _source: SearchBody;
      }>;
    };
  }