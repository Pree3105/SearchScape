
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListResourceTemplatesRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { HfInference } from "@huggingface/inference";

dotenv.config();

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const hf = new HfInference(process.env.HUGGING_FACE_API_KEY);

// For mapping session to fetched images
const userImageStore = new Map();


// Initialize server with resource capabilities
const server = new Server(
  {
    name: "Search Scape MCP",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {}, // Required for image resources
    },
  }
);

server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
  return {
    resourceTemplates: [], // Return an empty array or your actual templates if you have any
  };
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "fetch-image",
      description: "Fetch an image from Unsplash based on a user's prompt.",
      inputSchema: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "Describe the image to fetch",
          },
          userId: {
            type: "string",
            description: "User session ID",
          },
        },
        required: ["prompt", "userId"],
      },
    },
    {
      name: "transform-image",
      description: "Apply a visual transformation to an image (cartoon, artistic, enhance)",
      inputSchema: {
        type: "object",
        properties: {
          filter: {
            type: "string",
            description: "Type of filter (cartoon, artistic, enhance)",
          },
          userId: {
            type: "string",
            description: "User session ID",
          },
        },
        required: ["filter", "userId"],
      },
    },
  ],
}));

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "searchscape://images",
        mimeType: "image/jpeg",
        name: "Fetched and Transformed Images",
      },
    ],
  };
});

// Read resources
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === "searchscape://images") {
    return {
      contents: [
        {
          uri: "searchscape://images",
          mimeType: "image/jpeg",
          blob: "", 
        },
      ],
    };
  }
  throw new Error("Resource not found");
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "fetch-image") {
    try {
      const { prompt, userId } = request.params.arguments;

      if (!userId) throw new Error("UserId is required to track the sessions");
      if (!prompt) throw new Error("Prompt is missing");

      const unsplashResponse = await fetch(
        `https://api.unsplash.com/photos/random?query=${encodeURIComponent(prompt)}&client_id=${UNSPLASH_ACCESS_KEY}`
      );

      if (!unsplashResponse.ok) {
        throw new Error(`Unsplash API error: ${unsplashResponse.status}`);
      }

      const unsplashData = await unsplashResponse.json();
      if (!unsplashData?.urls?.regular) {
        throw new Error("Invalid response from Unsplash API");
      }

      const imageUrl = unsplashData.urls.regular;
      userImageStore.set(userId, imageUrl);

      console.log(`Fetched Unsplash image for user ${userId}: ${imageUrl}`);

      return {
        content: [
          {
            type: "text", 
            text: `Image fetched successfully! Image URL: ${imageUrl}`,
          },
        ],
      };
    } catch (error) {
      console.error(`Error fetching image: ${error.message}`);
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  } else if (request.params.name === "transform-image") {
    try {
      const { filter, userId } = request.params.arguments;
  
      if (!userId) throw new Error("UserId is required to track the sessions");
      if (!filter) throw new Error("Filter type is missing");
  
      const imageUrl = userImageStore.get(userId);
      if (!imageUrl) throw new Error("No image found. Please fetch an image first using fetch-image");
  
      console.log(`Applying filter '${filter}' to image for user ${userId}`);
      console.log("Image URL being sent to Hugging Face:", imageUrl);
  
      const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY; 
  
      let transformedImgUrl;
      switch (filter.toLowerCase()) {
        case "artistic":
          const artisticResponse = await fetch(
            "https://api-inference.huggingface.co/models/lambdalabs/sd-style-transfer",
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${HUGGING_FACE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ inputs: imageUrl }),
            }
          );
  
          if (!artisticResponse.ok) {
            throw new Error(`Hugging Face API error: ${artisticResponse.status}`);
          }
  
          const artisticData = await artisticResponse.json();
          if (!artisticData || !artisticData[0]?.generated_image) {
            throw new Error("Artistic transformation failed: No output image");
          }
  
          transformedImgUrl = artisticData[0].generated_image;
          break;
  
        case "enhance":
          // Use eugenesiow/super-image for image enhancement
          const enhanceResponse = await fetch(
            "https://api-inference.huggingface.co/models/eugenesiow/super-image",
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${HUGGING_FACE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ inputs: imageUrl }),
            }
          );
  
          if (!enhanceResponse.ok) {
            throw new Error(`Hugging Face API error: ${enhanceResponse.status}`);
          }
  
          const enhanceData = await enhanceResponse.json();
          if (!enhanceData || !enhanceData[0]?.generated_image) {
            throw new Error("Image enhancement failed: No output image");
          }
  
          transformedImgUrl = enhanceData[0].generated_image;
          break;
  
        case "translate":
          // Use timbrooks/instruct-pix2pix for image-to-image translation
          const translateResponse = await fetch(
            "https://api-inference.huggingface.co/models/timbrooks/instruct-pix2pix",
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${HUGGING_FACE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                inputs: {
                  image: imageUrl,
                  prompt: "make it look like a cartoon", // Example prompt for cartoon transformation
                },
              }),
            }
          );
  
          if (!translateResponse.ok) {
            throw new Error(`Hugging Face API error: ${translateResponse.status}`);
          }
  
          const translateData = await translateResponse.json();
          if (!translateData || !translateData[0]?.generated_image) {
            throw new Error("Image translation failed: No output image");
          }
  
          transformedImgUrl = translateData[0].generated_image;
          break;
  
        default:
          throw new Error("Invalid filter. Please choose: artistic, enhance, or translate");
      }
  
      console.log(`Transformed image URL for user ${userId}: ${transformedImgUrl}`);
  
      return {
        content: [
          {
            type: "text",
            text: `Image transformed with ${filter} filter successfully! Transformed image URL: ${transformedImgUrl}`,
          },
        ],
      };
    } catch (error) {
      console.error(`Error transforming image: ${error.message}`);
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
});
// Start server using stdio transport
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("SearchScape MCP Server running on stdio");
}

runServer().catch(console.error);