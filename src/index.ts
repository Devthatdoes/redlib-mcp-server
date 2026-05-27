#!/usr/bin/env node

import * as cheerio from 'cheerio';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from "node-fetch";

// Helper: Parse Redlib search/hot results HTML into structured JSON
function parsePostList(html: string) {
  const $ = cheerio.load(html);
  const results: Array<{
    id: string;
    title: string;
    subreddit: string;
    author: string;
    score: number;
    commentCount: number;
    permalink: string;
  }> = [];

  $('.post').each((i: number, el: any) => {
    const $el = $(el);
    const $titleLink = $el.find('.post_title a').first();
    const title = $titleLink.text().trim();
    const href = $titleLink.attr('href') || '';
    
    // Get post ID from the div's id attribute (most reliable)
    let id = $el.attr('id') || '';
    
    // Fallback: extract from href if id attribute is missing
    if (!id) {
      const idMatch = href.match(/\/comments\/([a-z0-9]+)/i);
      id = idMatch ? idMatch[1] : '';
    }
    
    if (!id || !title) return;

    const subreddit = $el.find('.post_subreddit').text().replace('r/', '').trim();
    const author = $el.find('.post_author').text().trim();
    const scoreText = $el.find('.post_score').text().trim().replace(/,/g, '');
    const score = parseInt(scoreText) || 0;
    const commentsText = $el.find('.post_comments').first().text().trim();
    const commentCountMatch = commentsText.match(/(\d+)/);
    const commentCount = commentCountMatch ? parseInt(commentCountMatch[1]) : 0;

    results.push({
      id,
      title,
      subreddit,
      author,
      score,
      commentCount,
      permalink: `http://localhost:8085${href}`
    });
  });

  return results;
}

// Helper: Parse individual Redlib post + comments HTML into structured JSON
function parsePostDetails(html: string) {
  const $ = cheerio.load(html);  
  const title = $('.post_title').first().text().trim();
  const author = $('.post_author').first().text().trim();
  const subreddit = $('.post_subreddit').first().text().replace('r/', '').trim();
  const body = $('.post-content .md').first().text().trim();
  const scoreText = $('.post_score').first().text().trim().replace(/,/g, '');
  const score = parseInt(scoreText) || 0;

  const comments: Array<{
    author: string;
    text: string;
    score: number;
  }> = [];  
  $('.comment').each((i: number, el: any) => {
    if (i >= 10) return false;
    const $comment = $(el);
    comments.push({
      author: $comment.find('.comment_author').text().trim(),
      text: $comment.find('.comment_body .md').text().trim().substring(0, 1000),
      score: parseInt($comment.find('.comment_score').text().replace(/,/g, '')) || 0
    });
  });

  return {
    title,
    author,
    subreddit,
    score,
    body: body.substring(0, 2000),
    commentCount: $('.comment').length,
    comments
  };
}

// Configuration
const REDLIB_BASE_URL = process.env.REDLIB_URL || "http://localhost:8080";
const USE_HTTP = process.env.USE_HTTP === "true";  // Optional: enable HTTP transport

// Create MCP server instance
const server = new McpServer({
  name: "redlib-mcp-server",
  version: "1.0.0",
  description: "MCP server for interacting with Redlib (private Reddit front-end)"
});

// Tool 1: Search Reddit via Redlib
server.tool(
  "search_reddit",
  "Search Reddit posts using your private Redlib instance. Returns post IDs for follow-up with get_post.",
  {
    query: z.string().describe("Search query"),
    subreddit: z.string().optional().describe("Limit search to specific subreddit (optional)")
  },
  async ({ query, subreddit }) => {
    try {
      const url = subreddit 
        ? `${REDLIB_BASE_URL}/r/${subreddit}/search?q=${encodeURIComponent(query)}`
        : `${REDLIB_BASE_URL}/search?q=${encodeURIComponent(query)}`;
      
      const response = await fetch(url);
      const html = await response.text();
      const results = parsePostList(html);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            query,
            resultCount: results.length,
            posts: results
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error searching Reddit: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

// Tool 2: Get hot posts from subreddit
server.tool(
  "get_subreddit_hot",
  "Get hot posts from a specific subreddit",
  {
    subreddit: z.string().describe("Subreddit name (without r/)"),
    limit: z.number().optional().describe("Number of posts to fetch (default 25)")
  },
  async ({ subreddit, limit }) => {
    try {
      const url = `${REDLIB_BASE_URL}/r/${subreddit}/hot${limit ? `?limit=${limit}` : ''}`;
      const response = await fetch(url);
      const html = await response.text();
      const results = parsePostList(html);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            subreddit,
            resultCount: results.length,
            posts: results
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error fetching hot posts: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

// Tool 3: Get specific post with comments
server.tool(
  "get_post",
  "Get a specific Reddit post and its comments. Use post ID from search or hot post results.",
  {
    subreddit: z.string().describe("Subreddit name"),
    postId: z.string().describe("Reddit post ID (from search/hot results)")
  },
  async ({ subreddit, postId }) => {
    try {
      const url = `${REDLIB_BASE_URL}/r/${subreddit}/comments/${postId}`;
      const response = await fetch(url);
      const html = await response.text();
      const postData = parsePostDetails(html);

      return {
        content: [{
          type: "text",
          text: JSON.stringify(postData, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error fetching post: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

// Start the server
async function main() {
  if (USE_HTTP) {
    // Optional HTTP transport
    const { StreamableHTTPServerTransport } = await import("@modelcontextprotocol/sdk/server/streamableHttp.js");
    const { randomUUID } = await import("node:crypto");
    const http = await import("http");
    
    console.error("Redlib MCP Server running on HTTP transport");
    
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sid: string) => {
        console.error(`Session initialized: ${sid}`);
      }
    });
    
    await server.connect(transport);
    
    // Create HTTP server
    const httpServer = http.createServer(async (req, res) => {
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, MCP-Session-ID, Authorization');
      res.setHeader('Access-Control-Max-Age', '86400');
      
      if (req.method === 'OPTIONS') {
        res.writeHead(204).end();
        return;
      }
      
      // Handle MCP endpoint
      if (req.url === '/mcp') {
        transport.handleRequest(req, res);
      } else {
        res.writeHead(404).end('Not found');
      }
    });
    
    const PORT = parseInt(process.env.PORT || "3000", 10);
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.error(`Redlib MCP Server listening on http://0.0.0.0:${PORT}/mcp`);
    });
    
  } else {
    // Default stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Redlib MCP Server running on stdio");
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
